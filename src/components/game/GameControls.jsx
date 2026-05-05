import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faPlus, faFlag, faRotate, faDice, faDrawPolygon } from '@fortawesome/free-solid-svg-icons';
import './GameControls.scss';

const GameControls = ({ onUndo, onNewGame, onResign, onFlipBoard, onToggleAnnotation, annotationMode }) => {
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

  const toggleAnnotationMode = (mode) => {
    if (onToggleAnnotation) {
      // If clicking the same mode, turn it off
      onToggleAnnotation(annotationMode === mode ? null : mode);
    }
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

      <div className="control-btn-wrapper">
        <button 
          className={`control-btn annotate ${annotationMode ? 'active' : ''}`} 
          onClick={() => toggleAnnotationMode('arrow')} 
          title="Draw Arrows"
        >
          <FontAwesomeIcon icon={faDrawPolygon} />
          <span>Annotate</span>
        </button>
        
        {annotationMode && (
          <div className="annotation-mode-dropdown">
            <button 
              className={annotationMode === 'arrow' ? 'active' : ''}
              onClick={() => toggleAnnotationMode('arrow')}
            >
              ➔ Arrow
            </button>
            <button 
              className={annotationMode === 'circle' ? 'active' : ''}
              onClick={() => toggleAnnotationMode('circle')}
            >
              ○ Circle
            </button>
            <button 
              className={annotationMode === 'eraser' ? 'active' : ''}
              onClick={() => toggleAnnotationMode('eraser')}
            >
              ⌫ Eraser
            </button>
            <button 
              className="annotation-close"
              onClick={() => toggleAnnotationMode(null)}
            >
              ✕ Close
            </button>
          </div>
        )}
      </div>

      <button className="control-btn resign" onClick={onResign} title="Resign">
        <FontAwesomeIcon icon={faFlag} />
        <span>Resign</span>
      </button>
    </div>
  );
};

export default GameControls;
