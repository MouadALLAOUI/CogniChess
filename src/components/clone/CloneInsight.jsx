import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faBook, faUser, faRobot } from '@fortawesome/free-solid-svg-icons';
import './CloneInsight.scss';

const CloneInsight = ({ decision, isThinking, botName }) => {
  if (isThinking) {
    return (
      <div className="clone-insight thinking animate-pulse">
        <FontAwesomeIcon icon={faRobot} className="insight-icon" />
        <span>{botName} is thinking...</span>
      </div>
    );
  }

  if (!decision) return null;

  const insights = {
    memory: {
      icon: faBrain,
      text: "Playing from memory",
      className: "memory"
    },
    'fuzzy-memory': {
      icon: faBrain,
      text: `Recognized similar position (${decision.similarity}%)`,
      className: "fuzzy-memory"
    },
    opening: {
      icon: faBook,
      text: "Following learned opening",
      className: "opening"
    },
    style: {
      icon: faUser,
      text: `Playing in ${botName}'s style`,
      className: "style"
    }
  };

  const { icon, text, className } = insights[decision.label] || insights.style;

  return (
    <div className={`clone-insight ${className} animate-slide-up`}>
      <FontAwesomeIcon icon={icon} className="insight-icon" />
      <span>{text}</span>
    </div>
  );
};

export default CloneInsight;
