import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import './CapturedPieces.scss';

const PIECE_VALUES = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

const CapturedPieces = ({ captured }) => {
  const renderCaptured = (pieces, color) => {
    const unicodeMap = {
      'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
      'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
    };
    
    // Group and sort by value
    const sorted = [...pieces].sort((a, b) => PIECE_VALUES[b[1]] - PIECE_VALUES[a[1]]);
    
    return sorted.map((p, i) => (
      <span key={i} className={`captured-piece ${color}`}>{unicodeMap[p]}</span>
    ));
  };

  const calculateAdvantage = () => {
    let whiteScore = captured.w.reduce((sum, p) => sum + PIECE_VALUES[p[1]], 0);
    let blackScore = captured.b.reduce((sum, p) => sum + PIECE_VALUES[p[1]], 0);
    
    // Advantage is for the side that HAS captured more (meaning the other side lost more)
    // Wait, usually advantage is score of pieces on board. 
    // If white has captured black's queen, white has +9.
    const advantage = whiteScore - blackScore;
    if (advantage === 0) return null;
    return advantage > 0 ? `+${advantage}` : advantage;
  };

  return (
    <div className="captured-pieces">
      <header className="section-header">
        <FontAwesomeIcon icon={faScaleBalanced} />
        <span>Material Advantage</span>
        <span className="advantage-count">{calculateAdvantage()}</span>
      </header>
      
      <div className="captured-rows">
        <div className="captured-row white">
          {renderCaptured(captured.b, 'black')}
        </div>
        <div className="captured-row black">
          {renderCaptured(captured.w, 'white')}
        </div>
      </div>
    </div>
  );
};

export default CapturedPieces;
