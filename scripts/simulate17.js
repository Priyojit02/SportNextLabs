// Quick simulation script to show bracket placement and bye propagation for 17 players
function isPowerOfTwo(n){ return Number.isInteger(Math.log2(n)); }
function nextPowerOfTwo(n){ return 2 ** Math.ceil(Math.log2(n)); }

function generateSeedingOrder(bracketSize){
  if (bracketSize < 2) return [];
  if (!isPowerOfTwo(bracketSize)) bracketSize = nextPowerOfTwo(bracketSize);
  if (bracketSize === 2) return [[1,2]];
  let seeds = [1,2];
  let currentSize = 2;
  while(currentSize < bracketSize){
    currentSize *= 2;
    const newSeeds = [];
    for(const s of seeds){ newSeeds.push(s); newSeeds.push(currentSize + 1 - s); }
    seeds = newSeeds;
  }
  const pairs = [];
  for(let i=0;i<seeds.length;i+=2) pairs.push([seeds[i], seeds[i+1]]);
  return pairs;
}

function createTournament(name, players, bracketSize){
  if (!isPowerOfTwo(bracketSize)) bracketSize = nextPowerOfTwo(bracketSize);
  const seeding = generateSeedingOrder(bracketSize);
  const rounds = [];
  const firstRound = seeding.map((pair, i) => {
    const p1 = players.find(p=>p.seed===pair[0]);
    const p2 = players.find(p=>p.seed===pair[1]);
    const isBye = !p1 || !p2;
    return { id: `r1m${i}`, round:1, position:i, player1: p1, player2: p2, isBye, winner: isBye ? (p1||p2) : undefined };
  });
  rounds.push({name:`ROUND OF ${bracketSize}`, matches:firstRound});
  const totalRounds = Math.log2(bracketSize);
  for(let r=2;r<=totalRounds;r++){
    const matchCount = bracketSize / Math.pow(2,r);
    const matches = [];
    for(let i=0;i<matchCount;i++) matches.push({ id:`r${r}m${i}`, round:r, position:i, isBye:false });
    rounds.push({name:`ROUND ${r}`, matches});
  }

  // advance byes from round1 to round2
  const second = rounds[1];
  if(second){
    for(let i=0;i<firstRound.length;i++){
      const m = firstRound[i];
      if(m.winner && m.isBye){
        const nextIdx = Math.floor(i/2);
        const next = second.matches[nextIdx];
        if(i%2===0) next.player1 = m.winner; else next.player2 = m.winner;
      }
    }
    // mark byes in second round
    for(let i=0;i<second.matches.length;i++){
      const m = second.matches[i];
      const feeder1 = firstRound[i*2];
      const feeder2 = firstRound[i*2+1];
      const bothFeedersByes = feeder1.isBye && feeder2.isBye;
      const onlyOnePlayer = (m.player1 && !m.player2) || (!m.player1 && m.player2);
      if(bothFeedersByes && onlyOnePlayer){ m.isBye = true; m.winner = m.player1||m.player2; }
    }
  }

  // propagate further
  for(let roundIndex=1; roundIndex<rounds.length-1; roundIndex++){
    const cur = rounds[roundIndex];
    const nxt = rounds[roundIndex+1];
    for(let i=0;i<cur.matches.length;i++){
      const m = cur.matches[i];
      if(m.isBye && m.winner){
        const nextIdx = Math.floor(i/2);
        const next = nxt.matches[nextIdx];
        if(i%2===0) next.player1 = m.winner; else next.player2 = m.winner;
      }
    }
    for(let i=0;i<nxt.matches.length;i++){
      const feeder1 = cur.matches[i*2];
      const feeder2 = cur.matches[i*2+1];
      const both = feeder1?.isBye && feeder2?.isBye;
      const onlyOne = (nxt.matches[i].player1 && !nxt.matches[i].player2) || (!nxt.matches[i].player1 && nxt.matches[i].player2);
      if(both && onlyOne){ nxt.matches[i].isBye = true; nxt.matches[i].winner = nxt.matches[i].player1||nxt.matches[i].player2; }
    }
  }

  return { id:'sim', name, players, bracketSize, rounds };
}

// Build 17 players
const players = [];
for(let i=1;i<=17;i++) players.push({ id:`p${i}`, name:`Player ${i}`, seed:i });

const tour = createTournament('17-player test', players, 17);

function printTournament(t){
  console.log(`Tournament: ${t.name} (${t.players.length} players) Bracket: ${t.bracketSize}`);
  t.rounds.forEach((r,ri)=>{
    console.log(`\n=== ${r.name} (Round ${ri+1}) ===`);
    r.matches.forEach((m,mi)=>{
      const p1 = m.player1 ? `${m.player1.seed} ${m.player1.name}` : 'TBD';
      const p2 = m.player2 ? `${m.player2.seed} ${m.player2.name}` : 'TBD';
      const bye = m.isBye ? ' BYE' : '';
      const win = m.winner ? ` => Winner: ${m.winner.seed} ${m.winner.name}` : '';
      console.log(`M${mi}: [${p1}] vs [${p2}]${bye}${win}`);
    });
  });
}

printTournament(tour);

process.exit(0);
