import React from 'react';
import { Match, Player } from '../types';

interface MatchCardProps {
  match: Match;
  onSelectWinner: () => void;
  isClickable: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectWinner, isClickable }) => {
  const getCardClass = () => {
    if (match.isBye) return 'match-card bye';
    if (match.winner) return 'match-card completed';
    return 'match-card';
  };

  const getPlayerSlotClass = (player?: Player) => {
    if (!player) return 'player-slot';
    if (match.winner?.id === player.id) return 'player-slot winner';
    if (match.winner && match.winner.id !== player.id) return 'player-slot loser';
    return 'player-slot';
  };

  const handleClick = () => {
    if (isClickable && match.player1 && match.player2 && !match.isBye) {
      onSelectWinner();
    }
  };

  // Format game scores for display (e.g., "21-16, 21-19")
  const getGameScores = (isPlayer1: boolean): string | null => {
    if (!match.games || match.games.length === 0) return null;
    
    const validGames = match.games.filter(g => g.player1Points > 0 || g.player2Points > 0);
    if (validGames.length === 0) return null;
    
    return validGames.map(g => 
      isPlayer1 ? `${g.player1Points}-${g.player2Points}` : `${g.player2Points}-${g.player1Points}`
    ).join(' ');
  };

  const renderPlayer = (player?: Player, position: 'top' | 'bottom' = 'top') => {
    if (!player) {
      return (
        <div className={`player-slot empty-slot ${position === 'bottom' ? '' : 'border-b border-gray-700'}`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 italic text-sm">—</span>
          </div>
        </div>
      );
    }

    const isWinner = match.winner?.id === player.id;
    const isPlayer1 = position === 'top';
    const gamesWon = isPlayer1 ? match.player1Score : match.player2Score;
    const gameScores = getGameScores(isPlayer1);

    return (
      <div className={getPlayerSlotClass(player)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                (player.seed <= 8 || (isWinner && match.isBye)) ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {player.seed}
              </span>
              {isWinner && match.isBye && (
                <span className="text-xs px-2 py-0.5 bg-yellow-600 text-white rounded-full font-semibold">
                  BYE
                </span>
              )}
            </div>
            <span className={`text-sm truncate ${isWinner ? 'font-bold' : ''}`}>
              {player.name}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {gameScores && (
              <span className={`text-xs font-mono ${isWinner ? 'text-green-400' : 'text-gray-400'}`}>
                {gameScores}
              </span>
            )}
            {!gameScores && gamesWon && (
              <span className={`text-xs font-mono ${isWinner ? 'text-green-400' : 'text-gray-400'}`}>
                {gamesWon}
              </span>
            )}
            {isWinner && (
              match.isBye ? (
                <div className="px-2 py-0.5 bg-yellow-600 text-white rounded-full text-xs font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M16.707 5.293a1 1 0 00-1.414-1.414L7.5 11.672 4.707 8.879a1 1 0 00-1.414 1.414l3.5 3.5a1 1 0 001.414 0l8-8z" fill="white" />
                  </svg>
                  <span>BYE</span>
                </div>
              ) : (
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${getCardClass()} ${isClickable && match.player1 && match.player2 && !match.winner ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      style={{ minWidth: '170px' }}
    >
      
      {renderPlayer(match.player1, 'top')}
      {renderPlayer(match.player2, 'bottom')}
    </div>
  );
};
