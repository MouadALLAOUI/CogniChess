import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChessQueen, faChessRook, faChessBishop, faChessKnight } from '@fortawesome/free-solid-svg-icons';
import './PromotionModal.scss';

const PromotionModal = ({ isOpen, color, onPromote }) => {
  if (!isOpen) return null;

  const options = [
    { type: 'Q', icon: faChessQueen },
    { type: 'R', icon: faChessRook },
    { type: 'B', icon: faChessBishop },
    { type: 'N', icon: faChessKnight }
  ];

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="promotion-modal animate-slide-up">
        <h3>Promote Pawn</h3>
        <div className="promotion-options">
          {options.map(opt => (
            <button 
              key={opt.type} 
              className={`promo-btn ${color}`}
              onClick={() => onPromote(opt.type)}
            >
              <FontAwesomeIcon icon={opt.icon} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
