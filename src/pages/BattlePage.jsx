import React, { useState, useEffect, useCallback } from 'react';
import { runCloneBattle, runCloneTournament } from '../clone/cloneBattle';
import './BattlePage.scss';

const BattlePage = ({ bots, onBack }) => {
  const [bot1, setBot1] = useState(null);
  const [bot2, setBot2] = useState(null);
  const [numGames, setNumGames] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [battleResults, setBattleResults] = useState(null);
  const [currentGame, setCurrentGame] = useState(0);
  const [logs, setLogs] = useState([]);
  const [standings, setStandings] = useState(null);

  const addLog = useCallback((message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const handleRunBattle = async () => {
    if (!bot1 || !bot2) {
      addLog('Please select two bots');
      return;
    }

    if (bot1.id === bot2.id) {
      addLog('Warning: Same bot selected for both sides');
    }

    setIsRunning(true);
    setBattleResults(null);
    setStandings(null);
    setLogs([]);
    setCurrentGame(0);

    addLog(`Starting battle: ${bot1.name} vs ${bot2.name}`);
    addLog(`Number of games: ${numGames}`);

    try {
      if (numGames === 1) {
        // Single battle
        const result = await runCloneBattle(bot1, bot2);
        if (result.success) {
          setBattleResults(result);
          addLog(`Battle complete: ${result.summary.result}`);
          addLog(`Duration: ${result.summary.duration}`);
        } else {
          addLog(`Battle failed: ${result.reason}`);
        }
      } else {
        // Tournament mode
        addLog('Starting tournament...');
        const tournamentResult = await runCloneTournament([bot1, bot2], { rounds: numGames });
        if (tournamentResult.success) {
          setStandings(tournamentResult.standings);
          setBattleResults({ summary: { title: 'Tournament Complete', winner: tournamentResult.winner?.name } });
          addLog(`Tournament complete! Winner: ${tournamentResult.winner?.name}`);
          addLog(`Total games: ${tournamentResult.games.length}`);
        }
      }
    } catch (error) {
      addLog(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportResults = () => {
    if (!battleResults) return;
    
    const dataStr = JSON.stringify(battleResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle-${bot1?.name}-vs-${bot2?.name}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('Results exported');
  };

  return (
    <div className="battle-page">
      <div className="battle-header">
        <button className="back-btn" onClick={onBack}>← Back to Home</button>
        <h1>⚔️ Clone Battle Arena</h1>
      </div>

      <div className="battle-setup">
        <div className="bot-selection">
          <div className="selection-box">
            <label>White Bot</label>
            <select 
              value={bot1?.id || ''} 
              onChange={(e) => setBot1(bots.find(b => b.id === e.target.value))}
              disabled={isRunning}
            >
              <option value="">Select White Bot</option>
              {bots.map(bot => (
                <option key={bot.id} value={bot.id}>{bot.name} ({bot.gamesPlayed} games)</option>
              ))}
            </select>
          </div>

          <div className="selection-box">
            <label>Black Bot</label>
            <select 
              value={bot2?.id || ''} 
              onChange={(e) => setBot2(bots.find(b => b.id === e.target.value))}
              disabled={isRunning}
            >
              <option value="">Select Black Bot</option>
              {bots.map(bot => (
                <option key={bot.id} value={bot.id}>{bot.name} ({bot.gamesPlayed} games)</option>
              ))}
            </select>
          </div>

          <div className="selection-box">
            <label>Number of Games</label>
            <select 
              value={numGames} 
              onChange={(e) => setNumGames(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={1}>1 (Single Battle)</option>
              <option value={3}>3 (Best of 3)</option>
              <option value={5}>5 (Best of 5)</option>
              <option value={10}>10 (Tournament)</option>
            </select>
          </div>
        </div>

        <button 
          className="start-battle-btn"
          onClick={handleRunBattle}
          disabled={isRunning || !bot1 || !bot2}
        >
          {isRunning ? '⏳ Running...' : '🎮 Start Battle'}
        </button>
      </div>

      {isRunning && (
        <div className="battle-progress">
          <div className="progress-indicator">
            <div className="spinner"></div>
            <span>Game {currentGame + 1} of {numGames}</span>
          </div>
        </div>
      )}

      {standings && (
        <div className="tournament-standings">
          <h3>🏆 Tournament Standings</h3>
          <table>
            <thead>
              <tr>
                <th>Bot</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, idx) => (
                <tr key={standing.bot.id} className={idx === 0 ? 'winner' : ''}>
                  <td>{standing.bot.name}</td>
                  <td>{standing.wins}</td>
                  <td>{standing.losses}</td>
                  <td>{standing.draws}</td>
                  <td><strong>{standing.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {battleResults && !standings && (
        <div className="battle-results">
          <h3>📊 Battle Results</h3>
          <div className="result-summary">
            <p><strong>Match:</strong> {battleResults.summary?.title}</p>
            <p><strong>Result:</strong> {battleResults.summary?.result}</p>
            <p><strong>Moves:</strong> {battleResults.summary?.moves}</p>
            <p><strong>Duration:</strong> {battleResults.summary?.duration}</p>
          </div>
          
          {battleResults.battle?.keyMoments && battleResults.battle.keyMoments.length > 0 && (
            <div className="key-moments">
              <h4>Key Moments</h4>
              <ul>
                {battleResults.battle.keyMoments.map((moment, idx) => (
                  <li key={idx}>
                    <strong>{moment.type}:</strong> {moment.description || moment.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="export-btn" onClick={handleExportResults}>
            📥 Export Results (JSON)
          </button>
        </div>
      )}

      {logs.length > 0 && (
        <div className="battle-logs">
          <h4>Battle Log</h4>
          <div className="log-container">
            {logs.map((log, idx) => (
              <div key={idx} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BattlePage;
