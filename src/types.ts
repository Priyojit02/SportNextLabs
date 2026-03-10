// Types for Tennis Tournament Bracket

export interface Player {
  id: string;
  name: string;
  seed: number;
}

export interface Match {
  id: string;
  round: number;
  position: number;
  player1?: Player;
  player2?: Player;
  winner?: Player;
  isBye: boolean;
  player1Score?: string;
  player2Score?: string;
  // Badminton/detailed game scores
  games?: {
    player1Points: number;
    player2Points: number;
  }[];
}

export interface Round {
  name: string;
  matches: Match[];
}

// Tournament Rules - fully customizable
export interface TournamentRules {
  scoringType: 'simple' | 'points' | 'sets' | 'badminton';
  // For points scoring
  pointsToWin?: number;
  // For sets scoring (tennis)
  setsToWin?: number;
  gamesPerSet?: number;
  tiebreakAt?: number;
  // For badminton scoring
  gamesToWin?: number;        // Best of 1, 3, or 5 (default 2 = best of 3)
  pointsPerGame?: number;     // Points to win each game (default 21)
  // General
  allowDraws: boolean;
  requireScore: boolean;
}

export const DEFAULT_RULES: TournamentRules = {
  scoringType: 'badminton',   // Default to badminton since this is a badminton app
  pointsToWin: 21,
  setsToWin: 2,
  gamesPerSet: 6,
  tiebreakAt: 6,
  gamesToWin: 2,              // Best of 3 games
  pointsPerGame: 21,          // First to 21 points per game
  allowDraws: false,
  requireScore: false
};

export interface Tournament {
  id: string;
  name: string;
  players: Player[];
  bracketSize: number; // Can be any power of 2: 2, 4, 8, 16, 32, 64, 128, 256...
  rounds: Round[];
  champion?: Player;
  createdAt: Date;
  rules: TournamentRules;
}

// Calculate the bracket size (only 16, 32, 64, 128 allowed)
export function getBracketSize(playerCount: number): number {
  if (playerCount <= 16) return 16;
  if (playerCount <= 32) return 32;
  if (playerCount <= 64) return 64;
  return 128;
}

// Get available bracket sizes based on player count
export function getAvailableBracketSizes(playerCount: number): number[] {
  const ALLOWED_SIZES = [16, 32, 64, 128];
  const minSize = getBracketSize(playerCount);
  return ALLOWED_SIZES.filter(size => size >= minSize);
}

export function getRoundName(bracketSize: number, round: number): string {
  const totalRounds = Math.log2(bracketSize);
  const roundsFromFinal = totalRounds - round;
  const playersInRound = bracketSize / Math.pow(2, round - 1);
  
  switch (roundsFromFinal) {
    case 0: return 'FINAL';
    case 1: return 'SEMIFINAL';
    case 2: return 'QUARTERFINAL';
    default: return `ROUND OF ${playersInRound}`;
  }
}

export function validateScore(
  rules: TournamentRules,
  player1Score: string,
  player2Score: string
): { valid: boolean; winner?: 'player1' | 'player2'; error?: string } {
  if (rules.scoringType === 'simple') {
    return { valid: true };
  }

  if (rules.scoringType === 'points') {
    const p1 = parseInt(player1Score) || 0;
    const p2 = parseInt(player2Score) || 0;
    const target = rules.pointsToWin || 21;

    if (p1 >= target && p1 > p2) {
      return { valid: true, winner: 'player1' };
    }
    if (p2 >= target && p2 > p1) {
      return { valid: true, winner: 'player2' };
    }
    if (p1 >= target || p2 >= target) {
      return { valid: false, error: `Winner must reach ${target} points and lead` };
    }
    return { valid: true };
  }

  if (rules.scoringType === 'sets') {
    // For sets, scores should be like "6-4, 7-5" or just game counts
    const p1Sets = parseInt(player1Score) || 0;
    const p2Sets = parseInt(player2Score) || 0;
    const setsToWin = rules.setsToWin || 2;

    if (p1Sets >= setsToWin && p1Sets > p2Sets) {
      return { valid: true, winner: 'player1' };
    }
    if (p2Sets >= setsToWin && p2Sets > p1Sets) {
      return { valid: true, winner: 'player2' };
    }
    if (p1Sets >= setsToWin || p2Sets >= setsToWin) {
      return { valid: false, error: `Winner must win ${setsToWin} sets and lead` };
    }
    return { valid: true };
  }

  if (rules.scoringType === 'badminton') {
    // For badminton, scores are game counts
    const p1Games = parseInt(player1Score) || 0;
    const p2Games = parseInt(player2Score) || 0;
    const gamesToWin = rules.gamesToWin || 2;

    if (p1Games >= gamesToWin && p1Games > p2Games) {
      return { valid: true, winner: 'player1' };
    }
    if (p2Games >= gamesToWin && p2Games > p1Games) {
      return { valid: true, winner: 'player2' };
    }
    if (p1Games >= gamesToWin || p2Games >= gamesToWin) {
      return { valid: false, error: `Winner must win ${gamesToWin} games and lead` };
    }
    return { valid: true };
  }

  return { valid: true };
}
