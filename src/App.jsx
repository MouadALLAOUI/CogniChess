import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import ChallengePage from './pages/ChallengePage';
import SettingsModal from './components/settings/SettingsModal';
import AddBotModal from './components/users/AddBotModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BOTS_STORAGE_KEY } from './store/botsStore';
import { SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from './store/settingsStore';
import './App.scss';

function App() {
  const [bots, setBots] = useLocalStorage(BOTS_STORAGE_KEY, []);
  const [settings, setSettings] = useLocalStorage(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddBotOpen, setIsAddBotOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'training' | 'challenge'
  const [activeBotId, setActiveBotId] = useState(settings.lastActiveBotId);

  const handleAddBot = (newBot) => {
    setBots(prev => [...prev, newBot]);
  };

  const handleTrainClick = (botId) => {
    setActiveBotId(botId);
    setSettings(prev => ({ ...prev, lastActiveBotId: botId }));
    setCurrentPage('training');
  };

  const handleChallengeClick = (botId) => {
    setActiveBotId(botId);
    setSettings(prev => ({ ...prev, lastActiveBotId: botId }));
    setCurrentPage('challenge');
  };

  const handleUpdateBot = (updatedBot) => {
    setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));
  };

  const handleResetBot = () => {
    if (!activeBotId) return;
    const bot = bots.find(b => b.id === activeBotId);
    if (!bot) return;

    const resetBot = {
      ...bot,
      gamesPlayed: 0,
      wins: 0, losses: 0, draws: 0,
      cloneData: {
        openingBook: {},
        styleProfile: {},
        positionMemory: {},
        moveHistory: []
      }
    };
    handleUpdateBot(resetBot);
    setIsSettingsOpen(false);
  };

  const activeBot = bots.find(b => b.id === activeBotId);

  return (
    <div className="app">
      <Navbar
        botName={activeBot?.name || "No Bot Selected"}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <main className="main-content">
        {currentPage === 'home' && (
          <HomePage
            bots={bots}
            onAddBotClick={() => setIsAddBotOpen(true)}
            onTrainClick={handleTrainClick}
            onChallengeClick={handleChallengeClick}
          />
        )}

        {currentPage === 'training' && activeBot && (
          <TrainingPage
            bot={activeBot}
            onBack={() => setCurrentPage('home')}
            onUpdateBot={handleUpdateBot}
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}

        {currentPage === 'challenge' && activeBot && (
          <ChallengePage
            bot={activeBot}
            onBack={() => setCurrentPage('home')}
            onUpdateBot={handleUpdateBot}
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onResetBot={handleResetBot}
      />

      <AddBotModal
        isOpen={isAddBotOpen}
        onClose={() => setIsAddBotOpen(false)}
        onAddBot={handleAddBot}
      />
    </div>
  );
}

export default App;
