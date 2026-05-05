import React, { useState } from 'react';
import '../styles/AiSettings.scss';

const AiSettings = ({ onDifficultyChange, currentDifficulty, aiEnabled, onToggleAI }) => {
  const [isOpen, setIsOpen] = useState(false);

  const difficulties = [
    { value: 1, label: 'Easy', description: 'Depth 1 - Random moves' },
    { value: 2, label: 'Medium', description: 'Depth 2 - Basic strategy' },
    { value: 3, label: 'Hard', description: 'Depth 3 - Good play' },
    { value: 4, label: 'Expert', description: 'Depth 4 - Strong opponent' }
  ];

  return (
    <div className="ai-settings">
      <button 
        className="ai-toggle-btn" 
        onClick={onToggleAI}
        aria-label={aiEnabled ? 'Disable AI opponent' : 'Enable AI opponent'}
      >
        <i className={`fas ${aiEnabled ? 'fa-robot' : 'fa-user'}`}></i>
        <span>{aiEnabled ? 'AI Opponent' : 'vs Human'}</span>
      </button>

      {aiEnabled && (
        <div className="ai-settings-panel">
          <button 
            className="settings-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <i className="fas fa-cog"></i>
            <span>Difficulty</span>
          </button>

          {isOpen && (
            <div className="difficulty-selector">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  className={`difficulty-option ${currentDifficulty === diff.value ? 'active' : ''}`}
                  onClick={() => {
                    onDifficultyChange(diff.value);
                    setIsOpen(false);
                  }}
                  aria-pressed={currentDifficulty === diff.value}
                >
                  <div className="difficulty-label">{diff.label}</div>
                  <div className="difficulty-description">{diff.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiSettings;
