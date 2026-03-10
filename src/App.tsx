import { useState, useEffect } from 'react';
import { Tournament } from './types';
import { Header } from './components/Header';
import { SetupPage } from './components/SetupPage';
import { BracketView } from './components/BracketView';
import { loadTournaments, saveTournament, deleteTournament } from './storage';

type View = 'home' | 'setup' | 'bracket';

// Fancy Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  tournamentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ tournamentName, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 animate-scaleIn">
      {/* Warning Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white text-center mb-2">Delete Tournament?</h2>
      
      {/* Tournament Name */}
      <div className="text-center mb-6">
        <span className="text-gray-400">You're about to delete</span>
        <div className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mt-1">
          "{tournamentName}"
        </div>
      </div>

      {/* Warning Message */}
      <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
        <p className="text-red-300 text-sm text-center">
          ⚠️ This action cannot be undone. All bracket data and match results will be permanently deleted.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/30"
        >
          Delete Forever
        </button>
      </div>
    </div>
  </div>
);

function App() {
  const [view, setView] = useState<View>('home');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; tournament: Tournament | null }>({ show: false, tournament: null });

  // Load tournaments from localStorage on mount
  useEffect(() => {
    const loaded = loadTournaments();
    setTournaments(loaded);
  }, []);

  const handleTournamentCreated = (tournament: Tournament) => {
    saveTournament(tournament);
    setTournaments(prev => [...prev.filter(t => t.id !== tournament.id), tournament]);
    setActiveTournament(tournament);
    setView('bracket');
  };

  const handleTournamentUpdate = (tournament: Tournament) => {
    saveTournament(tournament);
    setTournaments(prev => prev.map(t => t.id === tournament.id ? tournament : t));
    setActiveTournament(tournament);
  };

  const showDeleteModal = (tournament: Tournament) => {
    setDeleteModal({ show: true, tournament });
  };

  const confirmDelete = () => {
    if (deleteModal.tournament) {
      deleteTournament(deleteModal.tournament.id);
      setTournaments(prev => prev.filter(t => t.id !== deleteModal.tournament!.id));
      if (activeTournament?.id === deleteModal.tournament.id) {
        setActiveTournament(null);
        setView('home');
      }
    }
    setDeleteModal({ show: false, tournament: null });
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, tournament: null });
  };

  const openTournament = (tournament: Tournament) => {
    setActiveTournament(tournament);
    setView('bracket');
  };

  const goHome = () => {
    setView('home');
    setActiveTournament(null);
    // Refresh tournaments list
    setTournaments(loadTournaments());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onNewTournament={() => setView('setup')}
        tournamentName={activeTournament?.name}
        onBack={view !== 'home' ? goHome : undefined}
      />

      <main className="flex-1">
        {view === 'home' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-10">
              <div className="inline-block mb-4">
                <div className="text-7xl animate-bounce">🏸</div>
              </div>
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-3">
                Tournament Bracket Manager
              </h2>
              <p className="text-gray-400 text-lg">Create and manage professional tournament brackets with ease</p>
              <div className="flex justify-center gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 text-sm rounded-full">🎾 Tennis</span>
                <span className="px-3 py-1 bg-green-900/50 text-green-300 text-sm rounded-full">🏸 Badminton</span>
                <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-sm rounded-full">🏓 Table Tennis</span>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 text-center border border-gray-700 shadow-2xl">
                <div className="text-7xl mb-6 animate-pulse">🏆</div>
                <h3 className="text-2xl font-bold text-white mb-3">No Tournaments Yet</h3>
                <p className="text-gray-400 mb-8 text-lg">Create your first tournament to get started!</p>
                <button
                  onClick={() => setView('setup')}
                  className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30"
                >
                  ✨ Create Tournament
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Your Tournaments</h3>
                  <button
                    onClick={() => setView('setup')}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/20"
                  >
                    + New Tournament
                  </button>
                </div>
                {tournaments.map(tournament => (
                  <div
                    key={tournament.id}
                    className="bg-gradient-to-r from-gray-800 to-gray-800/80 rounded-xl p-6 flex items-center justify-between hover:from-gray-750 hover:to-gray-750 transition-all duration-300 border border-gray-700 hover:border-gray-600 group hover:shadow-xl"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                        {tournament.champion ? '🏆' : '🏸'}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{tournament.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded-full">
                            {tournament.players.length} players
                          </span>
                          <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded-full">
                            {tournament.bracketSize}-draw
                          </span>
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full capitalize">
                            {tournament.rules?.scoringType || 'simple'}
                          </span>
                          {tournament.champion && (
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded-full">
                              🏆 {tournament.champion.name}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          Created: {new Date(tournament.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openTournament(tournament)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/20"
                      >
                        {tournament.champion ? '👁 View' : '▶ Continue'}
                      </button>
                      <button
                        onClick={() => showDeleteModal(tournament)}
                        className="px-4 py-2.5 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white font-semibold rounded-lg transition-all duration-200 group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            {tournaments.length > 0 && (
              <div className="mt-10 grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 text-center border border-blue-700/30 hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{tournaments.length}</div>
                  <div className="text-blue-300 text-sm mt-1">Total Tournaments</div>
                </div>
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-6 text-center border border-green-700/30 hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    {tournaments.filter(t => t.champion).length}
                  </div>
                  <div className="text-green-300 text-sm mt-1">Completed</div>
                </div>
                <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-2xl p-6 text-center border border-amber-700/30 hover:scale-105 transition-transform">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                    {tournaments.filter(t => !t.champion).length}
                  </div>
                  <div className="text-amber-300 text-sm mt-1">In Progress</div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'setup' && (
          <SetupPage
            onTournamentCreated={handleTournamentCreated}
            onCancel={goHome}
          />
        )}

        {view === 'bracket' && activeTournament && (
          <BracketView
            tournament={activeTournament}
            onTournamentUpdate={handleTournamentUpdate}
          />
        )}
      </main>

      <footer className="bg-gray-900/80 border-t border-gray-700 py-4 text-center text-gray-500 text-sm backdrop-blur-sm">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">SportNext</span> Tournament Bracket © 2026
      </footer>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.tournament && (
        <DeleteConfirmModal
          tournamentName={deleteModal.tournament.name}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

export default App;
