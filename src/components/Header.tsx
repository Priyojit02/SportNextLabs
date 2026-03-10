import React from 'react';

interface HeaderProps {
  onNewTournament: () => void;
  tournamentName?: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewTournament, tournamentName, onBack }) => {
  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-2xl">🏸</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {tournamentName || 'SportNext Brackets'}
              </h1>
              {tournamentName && (
                <p className="text-xs text-gray-400 uppercase tracking-wider">Tournament Bracket</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onNewTournament}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Tournament
          </button>
        </div>
      </div>
    </header>
  );
};
