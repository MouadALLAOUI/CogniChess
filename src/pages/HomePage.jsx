import React from 'react';
import BotList from '../components/users/BotList';
import './HomePage.scss';

const HomePage = ({ bots, onAddBotClick, onTrainClick, onChallengeClick }) => {
  return (
    <div className="home-page">
      <div className="container">
        <header className="home-page__header">
          <h2 className="section-title">Your Clones</h2>
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
