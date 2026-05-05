import React, { useState } from 'react';
import Piece from './Piece';
import { findKing } from '../../engine/moveValidator';
import './Board.scss';

const Board = ({ 
  board, 
  turn, 
  selectedSquare, 
  legalMoves, 
  lastMove, 
  gameStatus,
  onSquareClick,
  boardTheme,
  pieceTheme,
  isFlipped = false
}) => {
  const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  const [shakingSquare, setShakingSquare] = useState(null);

  const isSelected = (r, c) => selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
  const isLegalMove = (r, c) => legalMoves.some(m => m.to[0] === r && m.to[1] === c);
  const isLastMove = (r, c) => {
    if (!lastMove) return false;
    return (lastMove.from[0] === r && lastMove.from[1] === c) || 
           (lastMove.to[0] === r && lastMove.to[1] === c);
  };

  const isKingInCheck = (r, c) => {
    if (gameStatus !== 'check' && gameStatus !== 'checkmate') return false;
    const kingPos = findKing(board, turn);
    return kingPos && kingPos[0] === r && kingPos[1] === c;
  };

  const handleSquareClick = (r, c) => {
    const move = legalMoves.find(m => m.to[0] === r && m.to[1] === c);
    if (move) {
      onSquareClick(r, c, move);
      return;
    }

    const piece = board[r][c];
    if (piece && piece[0] === turn) {
      onSquareClick(r, c);
    } else {
      if (piece || selectedSquare) {
        setShakingSquare([r, c]);
        setTimeout(() => setShakingSquare(null), 400);
      }
      onSquareClick(r, c);
    }
  };

  // Map logical indices to visual indices based on flip
  const renderBoard = () => {
    const visualRows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const visualCols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    return visualRows.map((r, vrIdx) => (
      <div key={r} className="board-row">
        {visualCols.map((c, vcIdx) => {
          const isLight = (r + c) % 2 === 0;
          const isShaking = shakingSquare && shakingSquare[0] === r && shakingSquare[1] === c;
          const piece = board[r][c];
          
          return (
            <div 
              key={`${r}-${c}`} 
              className={`
                square 
                ${isSelected(r, c) ? 'selected' : ''}
                ${isLastMove(r, c) ? 'last-move' : ''}
                ${isKingInCheck(r, c) ? 'in-check' : ''}
                ${isShaking ? 'animate-shake' : ''}
              `}
              style={{ backgroundColor: isLight ? boardTheme.light : boardTheme.dark }}
              onClick={() => handleSquareClick(r, c)}
            >
              {/* Rank labels */}
              {vcIdx === 0 && (
                <span className="label rank" style={{ color: isLight ? boardTheme.dark : boardTheme.light }}>
                  {ranks[vrIdx]}
                </span>
              )}
              {/* File labels */}
              {vrIdx === 7 && (
                <span className="label file" style={{ color: isLight ? boardTheme.dark : boardTheme.light }}>
                  {files[vcIdx]}
                </span>
              )}
              
              {isLegalMove(r, c) && (
                <div className={`legal-dot ${piece ? 'capture' : ''}`}></div>
              )}
              
              {piece && <Piece type={piece} theme={pieceTheme} />}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="board-container">
      <div className="chess-board" style={{ borderColor: boardTheme.border }}>
        {renderBoard()}
      </div>
    </div>
  );
};

export default Board;
