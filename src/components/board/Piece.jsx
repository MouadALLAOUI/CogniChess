import React from 'react';
import SvgPiece from './SvgPiece';
import './Piece.scss';

const Piece = ({ type, theme }) => {
  if (!type) return null;

  const color = type[0]; // 'w' or 'b'
  
  // If theme has id property (SVG theme), use SvgPiece component
  if (theme && theme.id) {
    return <SvgPiece type={type} theme={theme.id} className="piece-unicode" />;
  }

  // Fallback to Unicode rendering
  const pieceMap = {
    'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
    'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
  };

  const filter = color === 'w' ? theme?.whiteFilter : theme?.blackFilter;

  return (
    <div 
      className={`piece ${color === 'w' ? 'white' : 'black'} piece-unicode`}
      style={{ filter }}
    >
      {pieceMap[type]}
    </div>
  );
};

export default Piece;
