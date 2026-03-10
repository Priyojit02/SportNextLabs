import React, { useState, useEffect } from 'react';
import { Tournament, Match, Player } from '../types';
import { MatchCard } from './MatchCard';
import { MatchModal } from './MatchModal';
import { setMatchWinner } from '../bracketLogic';

interface GameScore {
  player1Points: number;
  player2Points: number;
}

// Champion Celebration Modal
const ChampionModal: React.FC<{
  champion: Player;
  tournamentName: string;
  onClose: () => void;
}> = ({ champion, tournamentName, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <div 
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ff9f43'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative bg-gradient-to-br from-yellow-900/90 via-yellow-800/90 to-amber-900/90 rounded-3xl p-10 max-w-lg w-full mx-4 shadow-2xl border-2 border-yellow-500/50 animate-scaleIn text-center">
        {/* Glowing Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent rounded-3xl" />
        
        {/* Trophy Animation */}
        <div className="relative mb-6">
          <div className="text-8xl animate-bounce">🏆</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-yellow-400/20 rounded-full animate-ping" />
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          <span className="text-3xl animate-pulse" style={{ animationDelay: '0s' }}>⭐</span>
          <span className="text-4xl animate-pulse" style={{ animationDelay: '0.2s' }}>⭐</span>
          <span className="text-5xl animate-pulse" style={{ animationDelay: '0.4s' }}>⭐</span>
          <span className="text-4xl animate-pulse" style={{ animationDelay: '0.6s' }}>⭐</span>
          <span className="text-3xl animate-pulse" style={{ animationDelay: '0.8s' }}>⭐</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-2 animate-shimmer">
          CHAMPION!
        </h2>

        {/* Tournament Name */}
        <p className="text-yellow-300/80 text-sm mb-6">{tournamentName}</p>

        {/* Winner Name */}
        <div className="bg-gradient-to-r from-yellow-600/30 via-yellow-500/40 to-yellow-600/30 rounded-2xl p-6 mb-6 border border-yellow-500/30">
          <div className="text-4xl font-bold text-white mb-2">{champion.name}</div>
          <div className="flex items-center justify-center gap-3">
            <span className="px-3 py-1 bg-yellow-600 text-white text-sm font-bold rounded-full">
              Seed #{champion.seed}
            </span>
            <span className="text-yellow-300">🎾 Tournament Winner</span>
          </div>
        </div>

        {/* Celebration Message */}
        <p className="text-yellow-200/80 text-lg mb-8">
          🎉 Congratulations to the champion! 🎉
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-yellow-900 font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/30"
        >
          🎊 Celebrate! 🎊
        </button>
      </div>
    </div>
  );
};

interface BracketViewProps {
  tournament: Tournament;
  onTournamentUpdate: (tournament: Tournament) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({ tournament, onTournamentUpdate }) => {
  const [selectedMatch, setSelectedMatch] = useState<{ match: Match; roundIndex: number; matchIndex: number } | null>(null);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [lastChampionId, setLastChampionId] = useState<string | null>(tournament.champion?.id || null);

  // Detect when a new champion is crowned (not on initial load)
  useEffect(() => {
    const currentChampionId = tournament.champion?.id || null;
    if (currentChampionId && currentChampionId !== lastChampionId && lastChampionId !== null) {
      // Champion just changed (was someone else or null from user action)
      setShowChampionModal(true);
    }
    setLastChampionId(currentChampionId);
  }, [tournament.champion?.id]);

  // Also trigger when final match is decided (lastChampionId was null)
  const handleSelectWinnerWithCelebration = (winner: Player, player1Score?: string, player2Score?: string, games?: GameScore[]) => {
    if (selectedMatch) {
      const isFinalMatch = selectedMatch.roundIndex === tournament.rounds.length - 1;
      const updatedTournament = setMatchWinner(
        tournament,
        selectedMatch.roundIndex,
        selectedMatch.matchIndex,
        winner,
        player1Score,
        player2Score,
        games
      );
      
      // Show celebration if this was the final match
      if (isFinalMatch && updatedTournament.champion) {
        setTimeout(() => setShowChampionModal(true), 300);
      }
      
      onTournamentUpdate(updatedTournament);
      setSelectedMatch(null);
    }
  };

  const isMatchClickable = (match: Match): boolean => {
    return !!(match.player1 && match.player2 && !match.winner && !match.isBye);
  };

  const handleMatchClick = (match: Match, roundIndex: number, matchIndex: number) => {
    if (isMatchClickable(match)) {
      setSelectedMatch({ match, roundIndex, matchIndex });
    }
  };

  return (
    <div className="p-6 overflow-x-auto min-h-screen">
      {/* Champion Display */}
      {tournament.champion && (
        <div className="mb-8 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-xl p-6 shadow-lg">
            <div className="text-yellow-900 font-bold text-sm mb-2">🏆 CHAMPION 🏆</div>
            <div className="text-2xl font-bold text-white">{tournament.champion.name}</div>
            <div className="text-yellow-200 text-sm">Seed #{tournament.champion.seed}</div>
          </div>
        </div>
      )}

      {/* Bracket Grid - Auto-adjusting height */}
      <div className="flex gap-4 min-h-[600px]">
        {tournament.rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col flex-1">
            {/* Round Header */}
            <div className="bg-gray-700 text-center py-2 px-4 rounded-t-lg mb-2 min-w-[180px] flex-shrink-0">
              <span className="text-white font-bold text-sm">{round.name}</span>
            </div>

            {/* Matches - Evenly distributed */}
            <div className="flex flex-col justify-around flex-1 min-h-0">
              {round.matches.map((match, matchIndex) => (
                <div key={match.id} className="flex justify-center mb-2">
                  <MatchCard
                    match={match}
                    onSelectWinner={() => handleMatchClick(match, roundIndex, matchIndex)}
                    isClickable={isMatchClickable(match)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Match selection modal */}
      {selectedMatch && (
        <MatchModal
          match={selectedMatch.match}
          rules={tournament.rules}
          onClose={() => setSelectedMatch(null)}
          onSelectWinner={handleSelectWinnerWithCelebration}
        />
      )}

      {/* Tournament Stats */}
      <div className="mt-8 bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Tournament Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{tournament.players.length}</div>
            <div className="text-gray-400 text-sm">Players</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {tournament.rounds.reduce((count, round) => 
                count + round.matches.filter(m => m.winner && !m.isBye).length, 0
              )}
            </div>
            <div className="text-gray-400 text-sm">Matches Played</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {tournament.rounds.reduce((count, round) => 
                count + round.matches.filter(m => m.isBye).length, 0
              )}
            </div>
            <div className="text-gray-400 text-sm">Byes</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{tournament.bracketSize}</div>
            <div className="text-gray-400 text-sm">Bracket Size</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400 capitalize">
              {tournament.rules?.scoringType || 'simple'}
            </div>
            <div className="text-gray-400 text-sm">Scoring</div>
          </div>
        </div>
      </div>

      {/* Champion Celebration Modal */}
      {showChampionModal && tournament.champion && (
        <ChampionModal
          champion={tournament.champion}
          tournamentName={tournament.name}
          onClose={() => setShowChampionModal(false)}
        />
      )}
    </div>
  );
};
