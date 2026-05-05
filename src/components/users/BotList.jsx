import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPlus } from '@fortawesome/free-solid-svg-icons';
import CloneCard from '../clone/CloneCard';
import './BotList.scss';

const BotList = ({ bots, onAddClick, onTrainClick, onChallengeClick }) => {
  if (bots.length === 0) {
    return (
      <div className="bot-list-empty">
        <div className="empty-content">
          <FontAwesomeIcon icon={faRobot} className="empty-icon" />
          <h3>No Clones Yet</h3>
          <p>Create your first bot to start training it with your chess style.</p>
          <button className="add-first-bot-btn" onClick={onAddClick}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Your First Bot</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-grid">
      {bots.map(bot => (
        <CloneCard 
          key={bot.id} 
          name={bot.name}
          emoji={bot.avatar}
          maturity={calculateMaturity(bot)}
          games={bot.gamesPlayed}
          onTrain={() => onTrainClick(bot.id)}
          onChallenge={() => onChallengeClick(bot.id)}
        />
      ))}
      
      <button className="add-bot-card" onClick={onAddClick}>
        <div className="add-bot-card__content">
          <FontAwesomeIcon icon={faPlus} className="plus-icon" />
          <span>Add Bot</span>
        </div>
      </button>
    </div>
  );
};

// Helper to calculate maturity percentage based on games played or data collected
const calculateMaturity = (bot) => {
  const games = bot.gamesPlayed || 0;
  // Let's say 100 games is 100% maturity for now
  return Math.min(Math.round((games / 100) * 100), 100);
};

export default BotList;
