import { Player, Match, Round, Tournament, getRoundName, TournamentRules, DEFAULT_RULES } from './types';

// Generate seeding order for any bracket size
// Uses the standard tournament seeding algorithm to ensure top seeds meet late
export function generateSeedingOrder(bracketSize: number): number[][] {
  if (bracketSize < 2) return [];

  // Ensure bracketSize is a power of two. If not, round up to next power of two.
  function isPowerOfTwo(n: number) {
    return Number.isInteger(Math.log2(n));
  }
  function nextPowerOfTwo(n: number) {
    return 2 ** Math.ceil(Math.log2(n));
  }

  if (!isPowerOfTwo(bracketSize)) {
    const next = nextPowerOfTwo(bracketSize);
    console.warn(`bracketSize ${bracketSize} is not a power of two; rounding up to ${next}`);
    bracketSize = next;
  }

  if (bracketSize === 2) return [[1, 2]];
  
  // Build the bracket recursively
  // Start with [1, 2] and expand
  let seeds = [1, 2];
  let currentSize = 2;
  
  while (currentSize < bracketSize) {
    currentSize *= 2;
    const newSeeds: number[] = [];
    
    // For each existing seed, pair it with its mirror from the new range
    for (const seed of seeds) {
      newSeeds.push(seed);
      newSeeds.push(currentSize + 1 - seed);
    }
    seeds = newSeeds;
  }
  
  // Convert to pairs
  const pairs: number[][] = [];
  for (let i = 0; i < seeds.length; i += 2) {
    pairs.push([seeds[i], seeds[i + 1]]);
  }
  
  return pairs;
}

// Create a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Create tournament bracket from players
export function createTournament(
  name: string,
  players: Player[],
  bracketSize: number,
  rules: TournamentRules = DEFAULT_RULES
): Tournament {
  // Ensure bracketSize is valid (power of two), round up if necessary
  function isPowerOfTwo(n: number) {
    return Number.isInteger(Math.log2(n));
  }
  function nextPowerOfTwo(n: number) {
    return 2 ** Math.ceil(Math.log2(n));
  }

  if (!isPowerOfTwo(bracketSize)) {
    const next = nextPowerOfTwo(bracketSize);
    console.warn(`createTournament: bracketSize ${bracketSize} is not a power of two; using ${next}`);
    bracketSize = next;
  }

  const totalRounds = Math.log2(bracketSize);
  const rounds: Round[] = [];
  const seedingOrder = generateSeedingOrder(bracketSize);
  
  // Create first round matches
  const firstRoundMatches: Match[] = [];
  
  for (let i = 0; i < seedingOrder.length; i++) {
    const [seed1, seed2] = seedingOrder[i];
    const player1 = players.find(p => p.seed === seed1);
    const player2 = players.find(p => p.seed === seed2);
    
    // Determine if this is a bye (one or both players missing)
    const isBye = !player1 || !player2;
    
    const match: Match = {
      id: generateId(),
      round: 1,
      position: i,
      player1: player1,
      player2: player2,
      isBye: isBye,
      // If it's a bye, the existing player automatically wins
      winner: isBye ? (player1 || player2) : undefined
    };
    
    firstRoundMatches.push(match);
  }
  
  rounds.push({
    name: getRoundName(bracketSize, 1),
    matches: firstRoundMatches
  });
  
  // Create subsequent rounds (empty, will be filled as matches complete)
  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    const roundMatches: Match[] = [];
    
    for (let i = 0; i < matchCount; i++) {
      roundMatches.push({
        id: generateId(),
        round: round,
        position: i,
        isBye: false
      });
    }
    
    rounds.push({
      name: getRoundName(bracketSize, round),
      matches: roundMatches
    });
  }
  
  // Advance byes to next round
  const tournament: Tournament = {
    id: generateId(),
    name,
    players,
    bracketSize,
    rounds,
    rules,
    createdAt: new Date()
  };
  
  // Auto-advance bye winners
  advanceByeWinners(tournament);
  
  return tournament;
}

// Advance players who won via bye - ONLY for first round byes initially
function advanceByeWinners(tournament: Tournament): void {
  // First pass: Place all bye winners from round 1 into round 2
  const firstRound = tournament.rounds[0];
  const secondRound = tournament.rounds[1];
  
  if (!secondRound) return; // Only 1 round (2-player bracket)
  
  for (let i = 0; i < firstRound.matches.length; i++) {
    const match = firstRound.matches[i];
    if (match.winner && match.isBye) {
      const nextMatchIndex = Math.floor(i / 2);
      const nextMatch = secondRound.matches[nextMatchIndex];
      
      if (i % 2 === 0) {
        nextMatch.player1 = match.winner;
      } else {
        nextMatch.player2 = match.winner;
      }
    }
  }
  
  // Second pass: Check round 2 for byes (where only 1 player exists after all placements)
  // This happens when BOTH feeder matches were byes but only one side had a player
  for (let i = 0; i < secondRound.matches.length; i++) {
    const match = secondRound.matches[i];
    // Check if only one player exists in this match
    const onlyOnePlayer = (match.player1 && !match.player2) || (!match.player1 && match.player2);
    // Determine feeder matches from round 1
    const feeder1 = firstRound.matches[i * 2];
    const feeder2 = firstRound.matches[i * 2 + 1];

    // Only mark as a bye if both feeder matches were byes (i.e., there cannot be
    // another opponent later). If one feeder was a normal match (not a bye),
    // its winner will be decided later so we should not auto-mark this match as a bye.
    const bothFeedersByes = !!(feeder1 && feeder2 && feeder1.isBye && feeder2.isBye);

    if (onlyOnePlayer && bothFeedersByes) {
      match.isBye = true;
      match.winner = match.player1 || match.player2;
    }
  }
  
  // Continue advancing if there are more rounds and more byes
  propagateFurtherByes(tournament, 1);
}

// Propagate byes in later rounds (when both feeders were byes)
function propagateFurtherByes(tournament: Tournament, startRoundIndex: number): void {
  for (let roundIndex = startRoundIndex; roundIndex < tournament.rounds.length - 1; roundIndex++) {
    const currentRound = tournament.rounds[roundIndex];
    const nextRound = tournament.rounds[roundIndex + 1];
    
    for (let i = 0; i < currentRound.matches.length; i++) {
      const match = currentRound.matches[i];
      
      // Only process bye matches that have a winner
      if (match.isBye && match.winner) {
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatch = nextRound.matches[nextMatchIndex];
        
        if (i % 2 === 0) {
          nextMatch.player1 = match.winner;
        } else {
          nextMatch.player2 = match.winner;
        }
      }
    }
    
    // Check this round for new byes
    for (let i = 0; i < nextRound.matches.length; i++) {
      const match = nextRound.matches[i];
      const feederMatch1 = currentRound.matches[i * 2];
      const feederMatch2 = currentRound.matches[i * 2 + 1];
      
      const bothFeedersByes = feederMatch1?.isBye && feederMatch2?.isBye;
      const onlyOnePlayer = (match.player1 && !match.player2) || (!match.player1 && match.player2);
      
      if (bothFeedersByes && onlyOnePlayer) {
        match.isBye = true;
        match.winner = match.player1 || match.player2;
      }
    }
  }
}

// Set winner for a match and advance to next round
export function setMatchWinner(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number,
  winner: Player,
  player1Score?: string,
  player2Score?: string,
  games?: { player1Points: number; player2Points: number }[]
): Tournament {
  const updatedTournament = { ...tournament };
  const match = updatedTournament.rounds[roundIndex].matches[matchIndex];
  
  match.winner = winner;
  match.player1Score = player1Score;
  match.player2Score = player2Score;
  if (games) {
    match.games = games;
  }
  
  // If not the final round, advance winner
  if (roundIndex < updatedTournament.rounds.length - 1) {
    const nextRound = updatedTournament.rounds[roundIndex + 1];
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    
    if (matchIndex % 2 === 0) {
      nextMatch.player1 = winner;
    } else {
      nextMatch.player2 = winner;
    }
  } else {
    // This was the final - set champion
    updatedTournament.champion = winner;
  }
  
  return updatedTournament;
}

// Clear a match result (for corrections)
export function clearMatchResult(
  tournament: Tournament,
  roundIndex: number,
  matchIndex: number
): Tournament {
  const updatedTournament = JSON.parse(JSON.stringify(tournament)) as Tournament;
  const match = updatedTournament.rounds[roundIndex].matches[matchIndex];
  
  // Can only clear if next round match doesn't have a result
  if (roundIndex < updatedTournament.rounds.length - 1) {
    const nextRound = updatedTournament.rounds[roundIndex + 1];
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    
    // If next match has a winner, we can't clear this one
    if (nextMatch.winner) {
      throw new Error("Cannot clear a match when subsequent matches have results");
    }
    
    // Remove player from next match
    if (matchIndex % 2 === 0) {
      nextMatch.player1 = undefined;
    } else {
      nextMatch.player2 = undefined;
    }
  } else {
    updatedTournament.champion = undefined;
  }
  
  match.winner = undefined;
  match.player1Score = undefined;
  match.player2Score = undefined;
  
  return updatedTournament;
}
