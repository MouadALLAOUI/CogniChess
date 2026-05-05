import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faPlus, faFlag, faRotate } from '@fortawesome/free-solid-svg-icons';
import './GameControls.scss';

const GameControls = ({ onUndo, onNewGame, onResign, onFlipBoard }) => {
  return (
    <div className="game-controls">
      <button className="control-btn undo" onClick={onUndo} title="Undo Move">
        <FontAwesomeIcon icon={faRotateLeft} />
        <span>Undo</span>
      </button>

      <button className="control-btn new-game" onClick={onNewGame} title="New Game">
        <FontAwesomeIcon icon={faPlus} />
        <span>New</span>
      </button>

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
