import React from 'react';
import './Piece.scss';

const Piece = ({ type, theme }) => {
  if (!type) return null;

  const color = type[0]; // 'w' or 'b'
  const pieceMap = {
    'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
    'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
  };

  const filter = color === 'w' ? theme.whiteFilter : theme.blackFilter;

  return (
    <div 
      className={`piece ${color === 'w' ? 'white' : 'black'}`}
      style={{ filter }}
    >
      {pieceMap[type]}
    </div>
  );
};

export default Piece;
