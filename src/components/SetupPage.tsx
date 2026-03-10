import React, { useState, useRef } from 'react';
import { Player, getBracketSize, getAvailableBracketSizes, TournamentRules, DEFAULT_RULES } from '../types';
import { parseExcelFile, createSampleExcel } from '../excelImport';
import { createTournament } from '../bracketLogic';
import { Tournament } from '../types';

interface SetupPageProps {
  onTournamentCreated: (tournament: Tournament) => void;
  onCancel: () => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onTournamentCreated, onCancel }) => {
  const [tournamentName, setTournamentName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSeed, setNewPlayerSeed] = useState('');
  const [selectedBracketSize, setSelectedBracketSize] = useState<number | 'auto'>('auto');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [rules, setRules] = useState<TournamentRules>({ ...DEFAULT_RULES });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset bracket size to auto when players change significantly
  const updatePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setSelectedBracketSize('auto'); // Reset to auto for simplicity
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    const seed = parseInt(newPlayerSeed) || players.length + 1;
    
    if (players.some(p => p.seed === seed)) {
      setError(`Seed ${seed} is already assigned`);
      return;
    }

    const player: Player = {
      id: Math.random().toString(36).substring(2, 11),
      name: newPlayerName.trim(),
      seed
    };

    setPlayers([...players, player].sort((a, b) => a.seed - b.seed));
    setNewPlayerName('');
    setNewPlayerSeed('');
    setError(null);
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const importedPlayers = await parseExcelFile(file);
      if (importedPlayers.length === 0) {
        setError('No valid players found in file. Ensure columns have "Seed" and "Name".');
      } else {
        updatePlayers(importedPlayers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleExcel = () => {
    const blob = createSampleExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_players.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const createNewTournament = () => {
    if (!tournamentName.trim()) {
      setError('Please enter a tournament name');
      return;
    }

    if (players.length < 2) {
      setError('Please add at least 2 players');
      return;
    }

    // Always calculate proper bracket size
    const bracketSize = selectedBracketSize === 'auto' || typeof selectedBracketSize !== 'number'
      ? getBracketSize(players.length) 
      : Math.max(selectedBracketSize, getBracketSize(players.length));

    const tournament = createTournament(tournamentName, players, bracketSize, rules);
    onTournamentCreated(tournament);
  };

  const getAutoDetectedBracketSize = () => getBracketSize(players.length);
  const availableSizes = getAvailableBracketSizes(players.length);

  const updateRule = <K extends keyof TournamentRules>(key: K, value: TournamentRules[K]) => {
    setRules(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Tournament</h2>

        {/* Tournament Name */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2 font-medium">Tournament Name</label>
          <input
            type="text"
            value={tournamentName}
            onChange={e => setTournamentName(e.target.value)}
            placeholder="e.g., Spring Championship 2026"
            className="input-field w-full"
          />
        </div>

        {/* Bracket Size Selection */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2 font-medium">Bracket Size</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBracketSize('auto')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedBracketSize === 'auto'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Auto ({getAutoDetectedBracketSize()})
            </button>
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedBracketSize(size)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedBracketSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {size} Draw
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {players.length > 0 && (
              <>
                {players.length} players entered. 
                {(() => {
                  const size = selectedBracketSize === 'auto' ? getAutoDetectedBracketSize() : selectedBracketSize;
                  const byes = size - players.length;
                  return byes > 0 ? ` ${byes} byes (auto-advance).` : '';
                })()}
              </>
            )}
          </p>
        </div>

        {/* Tournament Rules */}
        <div className="border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Tournament Rules</h3>
            <button
              onClick={() => setShowRulesEditor(!showRulesEditor)}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              {showRulesEditor ? 'Hide' : 'Customize'}
              <svg className={`w-4 h-4 transition-transform ${showRulesEditor ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Quick summary */}
          <div className="text-gray-400 text-sm">
            Scoring: <span className="text-white capitalize">{rules.scoringType}</span>
            {rules.scoringType === 'points' && <span className="text-white"> (First to {rules.pointsToWin})</span>}
            {rules.scoringType === 'sets' && <span className="text-white"> (Best of {(rules.setsToWin || 2) * 2 - 1})</span>}
            {rules.scoringType === 'badminton' && <span className="text-white"> (Best of {(rules.gamesToWin || 2) * 2 - 1}, {rules.pointsPerGame || 21} pts)</span>}
          </div>

          {showRulesEditor && (
            <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
              {/* Scoring Type */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Scoring Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['simple', 'points', 'sets', 'badminton'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => updateRule('scoringType', type)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        rules.scoringType === type
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type === 'simple' && '👆 Click Winner'}
                      {type === 'points' && '🔢 Points'}
                      {type === 'sets' && '🎾 Tennis Sets'}
                      {type === 'badminton' && '🏸 Badminton'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points settings */}
              {rules.scoringType === 'points' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Points to Win</label>
                    <input
                      type="number"
                      value={rules.pointsToWin || 21}
                      onChange={e => updateRule('pointsToWin', parseInt(e.target.value) || 21)}
                      className="input-field w-full"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {/* Sets settings */}
              {rules.scoringType === 'sets' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Sets to Win</label>
                    <select
                      value={rules.setsToWin || 2}
                      onChange={e => updateRule('setsToWin', parseInt(e.target.value))}
                      className="input-field w-full"
                    >
                      <option value={1}>1 (Best of 1)</option>
                      <option value={2}>2 (Best of 3)</option>
                      <option value={3}>3 (Best of 5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Games per Set</label>
                    <input
                      type="number"
                      value={rules.gamesPerSet || 6}
                      onChange={e => updateRule('gamesPerSet', parseInt(e.target.value) || 6)}
                      className="input-field w-full"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Tiebreak At</label>
                    <input
                      type="number"
                      value={rules.tiebreakAt || 6}
                      onChange={e => updateRule('tiebreakAt', parseInt(e.target.value) || 6)}
                      className="input-field w-full"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {/* Badminton settings */}
              {rules.scoringType === 'badminton' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Games to Win</label>
                    <select
                      value={rules.gamesToWin || 2}
                      onChange={e => updateRule('gamesToWin', parseInt(e.target.value))}
                      className="input-field w-full"
                    >
                      <option value={1}>1 (Best of 1)</option>
                      <option value={2}>2 (Best of 3)</option>
                      <option value={3}>3 (Best of 5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Points per Game</label>
                    <input
                      type="number"
                      value={rules.pointsPerGame || 21}
                      onChange={e => updateRule('pointsPerGame', parseInt(e.target.value) || 21)}
                      className="input-field w-full"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {/* Require Score */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requireScore"
                  checked={rules.requireScore}
                  onChange={e => updateRule('requireScore', e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="requireScore" className="text-gray-300 text-sm">
                  Require entering score before selecting winner
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Import Section */}
        <div className="border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Import from Excel</h3>
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn-primary flex items-center gap-2"
            >
              {importing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Excel File
                </>
              )}
            </button>
            <button
              onClick={downloadSampleExcel}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Sample
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Excel file should have columns: "Seed" (number) and "Name" (text)
          </p>
        </div>

        {/* Manual Entry Section */}
        <div className="border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Add Players Manually</h3>
          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              value={newPlayerSeed}
              onChange={e => setNewPlayerSeed(e.target.value)}
              placeholder="Seed #"
              className="input-field w-24"
              min="1"
            />
            <input
              type="text"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="Player Name"
              className="input-field flex-1 min-w-[200px]"
              onKeyPress={e => e.key === 'Enter' && addPlayer()}
            />
            <button onClick={addPlayer} className="btn-success">
              Add Player
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">
              Players ({players.length})
            </h3>
            {players.length > 0 && (
              <button
                onClick={() => updatePlayers([])}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Clear All
              </button>
            )}
          </div>

          {players.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No players added yet. Import from Excel or add manually.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {players.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      player.seed <= 8 ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {player.seed}
                    </span>
                    <span className="text-white">{player.name}</span>
                  </div>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={createNewTournament}
          disabled={players.length < 2 || !tournamentName.trim()}
          className={players.length >= 2 && tournamentName.trim() ? 'btn-success' : 'bg-gray-600 text-gray-400 cursor-not-allowed py-2 px-4 rounded-lg'}
        >
          Create Tournament ({players.length} Players)
        </button>
      </div>
    </div>
  );
};
