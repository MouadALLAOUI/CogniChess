import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faChartLine, faDatabase, faDna, faTrophy } from '@fortawesome/free-solid-svg-icons';
import './CloneProgress.scss';

const CloneProgress = ({ gamesPlayed }) => {
  const getMilestone = () => {
    if (gamesPlayed >= 50) return { icon: faTrophy, text: "Clone ready to face challengers", level: 5 };
    if (gamesPlayed >= 20) return { icon: faDna, text: "Your clone is taking shape", level: 4 };
    if (gamesPlayed >= 10) return { icon: faDatabase, text: "Memorizing your positions", level: 3 };
    if (gamesPlayed >= 5) return { icon: faChartLine, text: "Recognizing your style", level: 2 };
    return { icon: faEye, text: "Watching your first game...", level: 1 };
  };

  const { icon, text, level } = getMilestone();

  return (
    <div className="clone-progress">
      <div className="milestone-current">
        <FontAwesomeIcon icon={icon} className="milestone-icon" />
        <span className="milestone-text">{text}</span>
      </div>
      
      <div className="progress-steps">
        {[1, 2, 3, 4, 5].map(step => (
          <div 
            key={step} 
            className={`step ${step <= level ? 'active' : ''}`}
          ></div>
        ))}
      </div>
      
      <div className="games-count">
        <strong>{gamesPlayed}</strong> games played
      </div>
    </div>
  );
};

export default CloneProgress;
