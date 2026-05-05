import { useState, useCallback, useEffect } from 'react';
import { createInitialBoard, COLORS } from '../engine/chessRules';
import { getLegalMoves, getGameState, simulateMove, isInCheck } from '../engine/moveValidator';
import { moveToSAN } from '../engine/algebraicNotation';

export const useChessGame = () => {
  const [playerColor, setPlayerColor] = useState(COLORS.WHITE);
  const [board, setBoard] = useState(createInitialBoard());
  const [turn, setTurn] = useState(COLORS.WHITE);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [history, setHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [gameStatus, setGameStatus] = useState('active'); // active, check, checkmate, stalemate
  const [lastMove, setLastMove] = useState(null);
  const [castling, setCastling] = useState({
    w: { kingside: true, queenside: true },
    b: { kingside: true, queenside: true }
  });
  const [enPassant, setEnPassant] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  const resetGame = useCallback(() => {
    setPlayerColor(prev => prev === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
    setBoard(createInitialBoard());
    setTurn(COLORS.WHITE);
    setSelectedSquare(null);
    setLegalMoves([]);
    setHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setGameStatus('active');
    setLastMove(null);
    setCastling({
      w: { kingside: true, queenside: true },
      b: { kingside: true, queenside: true }
    });
    setEnPassant(null);
    setPendingPromotion(null);
  }, []);

  const selectPiece = useCallback((r, c) => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate') return;

    const piece = board[r][c];
    // Ensure player can only move their color and only on their turn
    if (piece && piece[0] === turn && piece[0] === playerColor) {
      setSelectedSquare([r, c]);
      const moves = getLegalMoves(board, r, c, { turn, castling, enPassant, inCheck: gameStatus === 'check' });
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [board, turn, gameStatus, castling, enPassant, playerColor]);

  const executeMove = useCallback((move) => {
    const [fromR, fromC] = move.from;
    const [toR, toC] = move.to;
    const piece = board[fromR][fromC];
    const captured = board[toR][toC];

    // Check for promotion
    if (piece[1] === 'P' && (toR === 0 || toR === 7)) {
      setPendingPromotion(move);
      return;
    }

    const newBoard = simulateMove(board, move);

    // Update captured pieces
    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [captured[0]]: [...prev[captured[0]], captured]
      }));
    } else if (move.type === 'enPassant') {
      const epCaptured = piece[0] === COLORS.WHITE ? 'bP' : 'wP';
      setCapturedPieces(prev => ({
        ...prev,
        [epCaptured[0]]: [...prev[epCaptured[0]], epCaptured]
      }));
    }

    // Update castling rights
    const newCastling = { ...castling };
    if (piece === 'wK') newCastling.w = { kingside: false, queenside: false };
    if (piece === 'bK') newCastling.b = { kingside: false, queenside: false };
    if (piece === 'wR' && fromC === 0) newCastling.w.queenside = false;
    if (piece === 'wR' && fromC === 7) newCastling.w.kingside = false;
    if (piece === 'bR' && fromC === 0) newCastling.b.queenside = false;
    if (piece === 'bR' && fromC === 7) newCastling.b.kingside = false;

    // Update en passant
    const newEnPassant = move.type === 'doublePawnPush' ? [(fromR + toR) / 2, fromC] : null;

    // Update history
    const nextTurn = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    const nextStatus = getGameState(newBoard, nextTurn, { turn: nextTurn, castling: newCastling, enPassant: newEnPassant });

    const moveNotation = moveToSAN(board, move, nextStatus === 'check', nextStatus === 'checkmate');

    setHistory(prev => [...prev, { notation: moveNotation, turn }]);
    setBoard(newBoard);
    setTurn(nextTurn);
    setCastling(newCastling);
    setEnPassant(newEnPassant);
    setGameStatus(nextStatus);
    setLastMove({ ...move, capturedPiece: captured || (move.type === 'enPassant' ? (piece[0] === COLORS.WHITE ? 'bP' : 'wP') : null) });
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [board, turn, castling]);

  const promotePawn = useCallback((promotionPiece) => {
    if (!pendingPromotion) return;

    const moveWithPromotion = { ...pendingPromotion, promotion: promotionPiece };
    const [fromR, fromC] = moveWithPromotion.from;
    const [toR, toC] = moveWithPromotion.to;
    const piece = board[fromR][fromC];

    const newBoard = simulateMove(board, moveWithPromotion);
    newBoard[toR][toC] = piece[0] + promotionPiece.toUpperCase();

    // Re-use logic from executeMove but with promotion
    const nextTurn = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    const nextStatus = getGameState(newBoard, nextTurn, { turn: nextTurn, castling, enPassant: null });
    const moveNotation = moveToSAN(board, moveWithPromotion, nextStatus === 'check', nextStatus === 'checkmate');

    setHistory(prev => [...prev, { notation: moveNotation, turn }]);
    setBoard(newBoard);
    setTurn(nextTurn);
    setEnPassant(null);
    setGameStatus(nextStatus);
    setLastMove(moveWithPromotion);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [board, turn, castling, pendingPromotion]);

  const undoMove = useCallback(() => {
    // Basic undo (could be improved with a full state stack)
    if (history.length === 0) return;
    // For now, let's just reset to initial state if we want simple undo, 
    // but ideally we'd store states in history.
    // Simplifying for now: only allow reset or one-step undo if we add state stack.
  }, [history]);

  return {
    board,
    turn,
    selectedSquare,
    legalMoves,
    history,
    capturedPieces,
    gameStatus,
    lastMove,
    pendingPromotion,
    selectPiece,
    executeMove,
    promotePawn,
    undoMove,
    resetGame,
    playerColor
  };
};
