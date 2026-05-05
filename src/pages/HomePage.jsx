import React from 'react';
import BotList from '../components/users/BotList';
import './HomePage.scss';

const HomePage = ({ bots, onAddBotClick, onTrainClick, onChallengeClick, onBattleClick }) => {
  return (
    <div className="home-page">
      <div className="container">
        <header className="home-page__header">
          <h2 className="section-title">Your Clones</h2>
          <button className="battle-btn" onClick={onBattleClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2zM6 21H4a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2zM18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM18 21h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2z"/>
            </svg>
            Bot Battle
          </button>
        </header>

        <BotList 
          bots={bots} 
          onAddClick={onAddBotClick}
          onTrainClick={onTrainClick}
          onChallengeClick={onChallengeClick}
        />
      </div>
    </div>
  );
};

export default HomePage;
