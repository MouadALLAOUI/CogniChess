import React, { useState, useRef, useEffect } from 'react';
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
  isFlipped = false,
  showCoordinates = true,
  moveArrow = null
}) => {
  const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  const [shakingSquare, setShakingSquare] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const boardRef = useRef(null);

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

  // Drag and Drop handlers
  const handleDragStart = (e, r, c, piece) => {
    if (piece[0] !== turn) {
      e.preventDefault();
      return;
    }
    setDraggedPiece({ piece, from: [r, c] });
    e.dataTransfer.setData('text/plain', JSON.stringify({ r, c, piece }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleDrop = (e, toR, toC) => {
    e.preventDefault();
    if (!draggedPiece) return;

    const move = legalMoves.find(m => 
      m.from[0] === draggedPiece.from[0] && 
      m.from[1] === draggedPiece.from[1] && 
      m.to[0] === toR && 
      m.to[1] === toC
    );

    if (move) {
      onSquareClick(toR, toC, move);
    }
    setDraggedPiece(null);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
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
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, r, c)}
              draggable={piece && piece[0] === turn}
              onDragStart={(e) => handleDragStart(e, r, c, piece)}
              onDragEnd={handleDragEnd}
            >
              {/* Rank labels */}
              {showCoordinates && vcIdx === 0 && (
                <span className="label rank" style={{ color: isLight ? boardTheme.dark : boardTheme.light }}>
                  {ranks[vrIdx]}
                </span>
              )}
              {/* File labels */}
              {showCoordinates && vrIdx === 7 && (
                <span className="label file" style={{ color: isLight ? boardTheme.dark : boardTheme.light }}>
                  {files[vcIdx]}
                </span>
              )}
              
              {isLegalMove(r, c) && (
                <div className={`legal-dot ${piece ? 'capture' : ''}`}></div>
              )}
              
              {piece && !draggedPiece && <Piece type={piece} theme={pieceTheme} />}
              {piece && draggedPiece && draggedPiece.from[0] === r && draggedPiece.from[1] === c && (
                <Piece type={piece} theme={pieceTheme} className="dragging" />
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  // Render move arrow
  const renderMoveArrow = () => {
    if (!moveArrow) return null;
    
    const { from, to } = moveArrow;
    // Calculate positions (simplified - would need actual square dimensions)
    return (
      <svg className="move-arrow-overlay" viewBox="0 0 600 600" preserveAspectRatio="none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff9800" opacity="0.8" />
          </marker>
        </defs>
        <line
          x1={from[1] * 75 + 37.5}
          y1={from[0] * 75 + 37.5}
          x2={to[1] * 75 + 37.5}
          y2={to[0] * 75 + 37.5}
          stroke="#ff9800"
          strokeWidth="6"
          strokeOpacity="0.8"
          markerEnd="url(#arrowhead)"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="board-container">
      <div className="chess-board" style={{ borderColor: boardTheme.border }} ref={boardRef}>
        {renderBoard()}
        {renderMoveArrow()}
      </div>
    </div>
  );
};

export default Board;
