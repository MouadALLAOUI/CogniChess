import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faPlus, faFlag, faRotate, faDice } from '@fortawesome/free-solid-svg-icons';
import './GameControls.scss';

const GameControls = ({ onUndo, onNewGame, onResign, onFlipBoard }) => {
  const [showModeSelect, setShowModeSelect] = useState(false);

  const handleNewGameClick = () => {
    setShowModeSelect(!showModeSelect);
  };

  const handleStandardGame = () => {
    onNewGame('standard');
    setShowModeSelect(false);
  };

  const handleChess960Game = () => {
    onNewGame('chess960');
    setShowModeSelect(false);
  };

  return (
    <div className="game-controls">
      <button className="control-btn undo" onClick={onUndo} title="Undo Move">
        <FontAwesomeIcon icon={faRotateLeft} />
        <span>Undo</span>
      </button>

      <div className="control-btn-wrapper">
        <button className="control-btn new-game" onClick={handleNewGameClick} title="New Game">
          <FontAwesomeIcon icon={faPlus} />
          <span>New</span>
        </button>
        
        {showModeSelect && (
          <div className="mode-select-dropdown">
            <button onClick={handleStandardGame}>
              Standard Chess
            </button>
            <button onClick={handleChess960Game}>
              <FontAwesomeIcon icon={faDice} /> Chess960
            </button>
          </div>
        )}
      </div>

      <button className="control-btn flip" onClick={onFlipBoard} title="Flip Board">
        <FontAwesomeIcon icon={faRotate} />
        <span>Flip</span>
      </button>

      <button className="control-btn resign" onClick={onResign} title="Resign">
        <FontAwesomeIcon icon={faFlag} />
        <span>Resign</span>
      </button>
    </div>
  );
};

export default GameControls;
