import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faHouse } from '@fortawesome/free-solid-svg-icons';
import './GameOverModal.scss';

const GameOverModal = ({ isOpen, result, winner, footerText }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="game-over-modal animate-slide-up">
        <div className="modal-body">
          <h2 className="result-title">{result}</h2>
          <p className="winner-text">{winner ? `${winner} wins!` : 'It\'s a draw'}</p>

          {footerText && <p className="footer-stats">{footerText}</p>}

          <div className="modal-actions">
            <button className="action-btn restart">
              <FontAwesomeIcon icon={faRotateLeft} />
              <span>Play Again</span>
            </button>
            <button className="action-btn home">
              <FontAwesomeIcon icon={faHouse} />
              <span>Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
