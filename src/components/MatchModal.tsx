import React, { useState } from 'react';
import { Match, Player, TournamentRules } from '../types';

interface GameScore {
  player1Points: number;
  player2Points: number;
}

interface MatchModalProps {
  match: Match;
  rules?: TournamentRules;
  onClose: () => void;
  onSelectWinner: (winner: Player, player1Score?: string, player2Score?: string, games?: GameScore[]) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ match, rules, onClose, onSelectWinner }) => {
  const scoringType = rules?.scoringType || 'badminton';
  const gamesToWin = rules?.gamesToWin || 2;
  const maxGames = gamesToWin * 2 - 1; // Best of 3 = max 3 games, Best of 5 = max 5 games
  const pointsPerGame = rules?.pointsPerGame || 21;
  
  // Initialize game scores
  const initGames = (): GameScore[] => {
    if (match.games && match.games.length > 0) {
      return [...match.games];
    }
    return Array(maxGames).fill(null).map(() => ({ player1Points: 0, player2Points: 0 }));
  };

  const [games, setGames] = useState<GameScore[]>(initGames());
  const [selectedWinner, setSelectedWinner] = useState<Player | null>(null);
  const [player1Score, setPlayer1Score] = useState(match.player1Score || '');
  const [player2Score, setPlayer2Score] = useState(match.player2Score || '');
  const [error, setError] = useState<string | null>(null);

  const updateGameScore = (gameIndex: number, player: 'player1' | 'player2', value: string) => {
    const points = parseInt(value) || 0;
    const newGames = [...games];
    if (player === 'player1') {
      newGames[gameIndex].player1Points = points;
    } else {
      newGames[gameIndex].player2Points = points;
    }
    setGames(newGames);
    
    // Auto-determine winner based on games won
    if (scoringType === 'badminton') {
      const p1Wins = newGames.filter(g => g.player1Points >= pointsPerGame && g.player1Points > g.player2Points).length;
      const p2Wins = newGames.filter(g => g.player2Points >= pointsPerGame && g.player2Points > g.player1Points).length;
      
      if (p1Wins >= gamesToWin && match.player1) {
        setSelectedWinner(match.player1);
      } else if (p2Wins >= gamesToWin && match.player2) {
        setSelectedWinner(match.player2);
      }
    }
  };

  const getGamesWon = () => {
    const p1Wins = games.filter(g => g.player1Points > 0 && g.player1Points > g.player2Points).length;
    const p2Wins = games.filter(g => g.player2Points > 0 && g.player2Points > g.player1Points).length;
    return { p1Wins, p2Wins };
  };

  const handleSubmit = () => {
    if (!selectedWinner) {
      setError('Please select a winner');
      return;
    }

    if (scoringType === 'badminton') {
      const validGames = games.filter(g => g.player1Points > 0 || g.player2Points > 0);
      if (validGames.length === 0) {
        setError('Please enter at least one game score');
        return;
      }
      const { p1Wins, p2Wins } = getGamesWon();
      onSelectWinner(selectedWinner, `${p1Wins}`, `${p2Wins}`, games);
    } else {
      onSelectWinner(selectedWinner, player1Score || undefined, player2Score || undefined);
    }
  };

  const { p1Wins, p2Wins } = getGamesWon();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">Enter Match Score</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Badminton Scorecard */}
        {scoringType === 'badminton' && (
          <div className="mb-6">
            <div className="text-gray-400 text-sm mb-3 text-center">
              Best of {maxGames} games • First to {pointsPerGame} points per game
            </div>
            
            {/* Scorecard Table */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 gap-1 bg-gray-700 p-2 text-sm font-bold text-center">
                <div className="text-gray-300">Player</div>
                {Array(maxGames).fill(0).map((_, i) => (
                  <div key={i} className="text-gray-300">Game {i + 1}</div>
                ))}
              </div>
              
              {/* Player 1 Row */}
              <div className="grid grid-cols-4 gap-1 p-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    match.player1 && match.player1.seed <= 8 ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}>
                    {match.player1?.seed}
                  </span>
                  <span className="text-white text-sm truncate">{match.player1?.name}</span>
                </div>
                {Array(maxGames).fill(0).map((_, i) => (
                  <input
                    key={i}
                    type="number"
                    min="0"
                    max="30"
                    value={games[i]?.player1Points || ''}
                    onChange={e => updateGameScore(i, 'player1', e.target.value)}
                    className="input-field text-center text-lg font-bold py-1"
                    placeholder="0"
                  />
                ))}
              </div>
              
              {/* Player 2 Row */}
              <div className="grid grid-cols-4 gap-1 p-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    match.player2 && match.player2.seed <= 8 ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}>
                    {match.player2?.seed}
                  </span>
                  <span className="text-white text-sm truncate">{match.player2?.name}</span>
                </div>
                {Array(maxGames).fill(0).map((_, i) => (
                  <input
                    key={i}
                    type="number"
                    min="0"
                    max="30"
                    value={games[i]?.player2Points || ''}
                    onChange={e => updateGameScore(i, 'player2', e.target.value)}
                    className="input-field text-center text-lg font-bold py-1"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            {/* Games Won Summary */}
            <div className="flex justify-center gap-8 mt-4 text-center">
              <div className={`px-4 py-2 rounded-lg ${p1Wins >= gamesToWin ? 'bg-green-700' : 'bg-gray-700'}`}>
                <div className="text-2xl font-bold text-white">{p1Wins}</div>
                <div className="text-xs text-gray-400">Games Won</div>
              </div>
              <div className="text-gray-500 text-2xl self-center">-</div>
              <div className={`px-4 py-2 rounded-lg ${p2Wins >= gamesToWin ? 'bg-green-700' : 'bg-gray-700'}`}>
                <div className="text-2xl font-bold text-white">{p2Wins}</div>
                <div className="text-xs text-gray-400">Games Won</div>
              </div>
            </div>
          </div>
        )}

        {/* Simple/Points/Sets scoring - Player selection */}
        {scoringType !== 'badminton' && (
          <div className="space-y-3 mb-6">
            {/* Player 1 */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedWinner?.id === match.player1?.id
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => match.player1 && setSelectedWinner(match.player1)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    match.player1 && match.player1.seed <= 8 ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {match.player1?.seed}
                  </span>
                  <span className="text-white font-medium">{match.player1?.name}</span>
                </div>
                {scoringType !== 'simple' && (
                  <input
                    type="text"
                    placeholder="Score"
                    value={player1Score}
                    onChange={e => setPlayer1Score(e.target.value)}
                    className="input-field w-24 text-sm"
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </div>
            </div>

            <div className="text-center text-gray-500 font-bold">VS</div>

            {/* Player 2 */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedWinner?.id === match.player2?.id
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => match.player2 && setSelectedWinner(match.player2)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    match.player2 && match.player2.seed <= 8 ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {match.player2?.seed}
                  </span>
                  <span className="text-white font-medium">{match.player2?.name}</span>
                </div>
                {scoringType !== 'simple' && (
                  <input
                    type="text"
                    placeholder="Score"
                    value={player2Score}
                    onChange={e => setPlayer2Score(e.target.value)}
                    className="input-field w-24 text-sm"
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Select Winner for Badminton */}
        {scoringType === 'badminton' && (
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-2 text-center">Select Winner:</div>
            <div className="flex gap-2">
              <button
                onClick={() => match.player1 && setSelectedWinner(match.player1)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  selectedWinner?.id === match.player1?.id
                    ? 'border-green-500 bg-green-900/30'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <span className="text-white font-medium">{match.player1?.name}</span>
              </button>
              <button
                onClick={() => match.player2 && setSelectedWinner(match.player2)}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  selectedWinner?.id === match.player2?.id
                    ? 'border-green-500 bg-green-900/30'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <span className="text-white font-medium">{match.player2?.name}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedWinner}
            className={`flex-1 ${selectedWinner ? 'btn-success' : 'bg-gray-600 text-gray-400 cursor-not-allowed py-2 px-4 rounded-lg'}`}
          >
            Confirm Winner
          </button>
        </div>
      </div>
    </div>
  );
};
