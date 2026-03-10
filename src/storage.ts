import { Tournament, DEFAULT_RULES } from './types';

const STORAGE_KEY = 'tennis_tournaments';

export function saveTournaments(tournaments: Tournament[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
  } catch (error) {
    console.error('Failed to save tournaments:', error);
  }
}

export function loadTournaments(): Tournament[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const tournaments = JSON.parse(data) as Tournament[];
      // Convert date strings back to Date objects and ensure rules exist
      return tournaments.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
        rules: t.rules || { ...DEFAULT_RULES }
      }));
    }
  } catch (error) {
    console.error('Failed to load tournaments:', error);
  }
  return [];
}

export function saveTournament(tournament: Tournament): void {
  const tournaments = loadTournaments();
  const existingIndex = tournaments.findIndex(t => t.id === tournament.id);
  
  if (existingIndex >= 0) {
    tournaments[existingIndex] = tournament;
  } else {
    tournaments.push(tournament);
  }
  
  saveTournaments(tournaments);
}

export function deleteTournament(tournamentId: string): void {
  const tournaments = loadTournaments();
  const filtered = tournaments.filter(t => t.id !== tournamentId);
  saveTournaments(filtered);
}

export function getTournament(tournamentId: string): Tournament | undefined {
  const tournaments = loadTournaments();
  return tournaments.find(t => t.id === tournamentId);
}
