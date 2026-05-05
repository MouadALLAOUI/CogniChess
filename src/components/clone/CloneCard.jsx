import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faChessBoard } from '@fortawesome/free-solid-svg-icons';
import './CloneCard.scss';

const CloneCard = ({ name, emoji, maturity, games, onTrain, onChallenge }) => {
  return (
    <div className="clone-card animate-slide-up">
      <div className="clone-card__avatar">
        {emoji}
      </div>

      <div className="clone-card__info">
        <h3 className="clone-name">{name}</h3>

        <div className="maturity-section">
          <div className="label">
            <span>Maturity</span>
            <span>{maturity}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${maturity}%` }}
            ></div>
          </div>
        </div>

        <div className="games-played">
          <span className="count">{games}</span>
          <span className="label">Games Played</span>
        </div>
      </div>

      <div className="clone-card__actions">
        <button className="action-btn train" onClick={onTrain}>
          <FontAwesomeIcon icon={faGraduationCap} />
          <span>Train</span>
        </button>
        <button className="action-btn challenge" onClick={onChallenge}>
          <FontAwesomeIcon icon={faChessBoard} />
          <span>Challenge</span>
        </button>
      </div>
    </div>
  );
};

export default CloneCard;
