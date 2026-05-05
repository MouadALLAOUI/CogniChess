import { getPseudoLegalMoves, COLORS } from './chessRules';

/**
 * Validates if a move is truly legal by checking if it leaves the king in check.
 */
export const getLegalMoves = (board, r, c, gameState) => {
  const piece = board[r][c];
  if (!piece) return [];

  const pseudoLegalMoves = getPseudoLegalMoves(board, r, c, gameState);
  return pseudoLegalMoves.filter(move => !leavesKingInCheck(board, move, piece[0], gameState));
};

export const leavesKingInCheck = (board, move, color, gameState) => {
  const newBoard = simulateMove(board, move);
  return isInCheck(newBoard, color, gameState);
};

export const isInCheck = (board, color, gameState) => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponentColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === opponentColor) {
        const moves = getPseudoLegalMoves(board, r, c, gameState);
        if (moves.some(m => m.to[0] === kingPos[0] && m.to[1] === kingPos[1])) {
          return true;
        }
      }
    }
  }

  return false;
};

export const findKing = (board, color) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === color + 'K') return [r, c];
    }
  }
  return null;
};

export const simulateMove = (board, move) => {
  const newBoard = board.map(row => [...row]);
  const [fromR, fromC] = move.from;
  const [toR, toC] = move.to;
  const piece = newBoard[fromR][fromC];

  if (!piece) return newBoard; // Guard clause for null piece

  newBoard[toR][toC] = piece;
  newBoard[fromR][fromC] = null;

  // Handle special moves in simulation
  if (move.type === 'enPassant') {
    const direction = piece[0] === COLORS.WHITE ? 1 : -1;
    newBoard[toR + direction][toC] = null;
  } else if (move.type === 'castleKingside') {
    const rook = newBoard[toR][7];
    newBoard[toR][5] = rook;
    newBoard[toR][7] = null;
  } else if (move.type === 'castleQueenside') {
    const rook = newBoard[toR][0];
    newBoard[toR][3] = rook;
    newBoard[toR][0] = null;
  }
  
  // Handle promotion in simulation
  if (move.promotion) {
    newBoard[toR][toC] = piece[0] + move.promotion.toUpperCase();
  }

  return newBoard;
};

export const getGameState = (board, color, gameState) => {
  const allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece[0] === color) {
        allMoves.push(...getLegalMoves(board, r, c, gameState));
      }
    }
  }

  const inCheck = isInCheck(board, color, gameState);

  if (allMoves.length === 0) {
    return inCheck ? 'checkmate' : 'stalemate';
  }

  return inCheck ? 'check' : 'active';
};
