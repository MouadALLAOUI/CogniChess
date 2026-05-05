import { useState, useCallback, useEffect } from 'react';
import { createInitialBoard, COLORS } from '../engine/chessRules';
import { getLegalMoves, getGameState, simulateMove, isInCheck } from '../engine/moveValidator';
import { moveToSAN } from '../engine/algebraicNotation';
import { createChess960Board } from '../utils/chess960';
import { triggerHaptic } from '../utils/haptics';

export const useChessGame = () => {
  const [gameMode, setGameMode] = useState('standard'); // 'standard' or 'chess960'
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
  // State stack for undo functionality (keeps last 50 states)
  const [stateStack, setStateStack] = useState([]);

  const resetGame = useCallback((mode = gameMode) => {
    setPlayerColor(prev => prev === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE);
    setGameMode(mode);
    setBoard(mode === 'chess960' ? createChess960Board() : createInitialBoard());
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
    setStateStack([]);
  }, [gameMode]);

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

    // Save current state for undo (keep last 50 states)
    setStateStack(prev => [...prev.slice(-49), {
      board: JSON.parse(JSON.stringify(board)),
      turn,
      castling: { ...castling },
      enPassant: enPassant ? [...enPassant] : null,
      capturedPieces: JSON.parse(JSON.stringify(capturedPieces)),
      history: [...history],
      gameStatus,
      lastMove,
      pendingPromotion
    }]);

    const newBoard = simulateMove(board, move);

    // Update captured pieces
    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [captured[0]]: [...prev[captured[0]], captured]
      }));
      triggerHaptic('capture');
    } else if (move.type === 'enPassant') {
      const epCaptured = piece[0] === COLORS.WHITE ? 'bP' : 'wP';
      setCapturedPieces(prev => ({
        ...prev,
        [epCaptured[0]]: [...prev[epCaptured[0]], epCaptured]
      }));
      triggerHaptic('capture');
    } else {
      triggerHaptic('move');
    }

    // Update castling rights
    const newCastling = { ...castling };
    if (piece === 'wK') newCastling.w = { kingside: false, queenside: false };
    if (piece === 'bK') newCastling.b = { kingside: false, queenside: false };
    if (piece === 'wR' && fromC === 0) newCastling.w.queenside = false;
    if (piece === 'wR' && fromC === 7) newCastling.w.kingside = false;
    if (piece === 'bR' && fromC === 0) newCastling.b.queenside = false;
    if (piece === 'bR' && fromC === 7) newCastling.b.kingside = false;

    // Handle castling move haptic
    if (move.type === 'castleKingside' || move.type === 'castleQueenside') {
      triggerHaptic('castle');
    }

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

    // Trigger check/gameover haptics
    if (nextStatus === 'check') {
      triggerHaptic('check');
    } else if (nextStatus === 'checkmate' || nextStatus === 'stalemate') {
      triggerHaptic('gameover');
    }
  }, [board, turn, castling, enPassant, capturedPieces, history, gameStatus, lastMove, pendingPromotion]);

  const promotePawn = useCallback((promotionPiece) => {
    if (!pendingPromotion) return;

    const moveWithPromotion = { ...pendingPromotion, promotion: promotionPiece };
    const [fromR, fromC] = moveWithPromotion.from;
    const [toR, toC] = moveWithPromotion.to;
    const piece = board[fromR][fromC];

    // Save current state for undo before promotion
    setStateStack(prev => [...prev.slice(-49), {
      board: JSON.parse(JSON.stringify(board)),
      turn,
      castling: { ...castling },
      enPassant: enPassant ? [...enPassant] : null,
      capturedPieces: JSON.parse(JSON.stringify(capturedPieces)),
      history: [...history],
      gameStatus,
      lastMove,
      pendingPromotion
    }]);

    const newBoard = simulateMove(board, moveWithPromotion);
    newBoard[toR][toC] = piece[0] + promotionPiece.toUpperCase();

    // Update castling rights (pawn promotion doesn't affect castling, but be explicit)
    const newCastling = { ...castling };

    const nextTurn = turn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    const nextStatus = getGameState(newBoard, nextTurn, { turn: nextTurn, castling: newCastling, enPassant: null });
    const moveNotation = moveToSAN(board, moveWithPromotion, nextStatus === 'check', nextStatus === 'checkmate');

    setHistory(prev => [...prev, { notation: moveNotation, turn }]);
    setBoard(newBoard);
    setTurn(nextTurn);
    setCastling(newCastling);
    setEnPassant(null);
    setGameStatus(nextStatus);
    setLastMove(moveWithPromotion);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [board, turn, castling, enPassant, capturedPieces, history, gameStatus, lastMove, pendingPromotion]);

  const undoMove = useCallback(() => {
    if (stateStack.length === 0) return;
    
    const previousState = stateStack[stateStack.length - 1];
    setStateStack(prev => prev.slice(0, -1));
    
    setBoard(previousState.board);
    setTurn(previousState.turn);
    setCastling(previousState.castling);
    setEnPassant(previousState.enPassant);
    setCapturedPieces(previousState.capturedPieces);
    setHistory(previousState.history);
    setGameStatus(previousState.gameStatus);
    setLastMove(previousState.lastMove);
    setPendingPromotion(previousState.pendingPromotion);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [stateStack]);

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
    playerColor,
    gameMode
  };
};
