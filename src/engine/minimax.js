/**
 * Minimax AI with Alpha-Beta Pruning
 * Basic chess AI opponent for CogniChess
 */

import { generateAllMoves, makeMove } from './chessRules.js';
import { getGameState } from './moveValidator.js';
import { transpositionTable } from './transpositionTable.js';

// Piece values for evaluation
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Position bonus tables (simplified)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

/**
 * Evaluate a board position
 * @param {Array} board - Board array
 * @param {string} color - Color to evaluate for ('w' or 'b')
 * @returns {number} Evaluation score (positive = good for color)
 */
export function evaluatePosition(board, color) {
  let score = 0;
  
  for (let square = 0; square < 64; square++) {
    const piece = board[square];
    if (!piece) continue;
    
    const pieceValue = PIECE_VALUES[piece.type];
    const isFriendly = piece.color === color;
    const multiplier = isFriendly ? 1 : -1;
    
    score += pieceValue * multiplier;
    
    // Add positional bonus
    const table = piece.type === 'p' ? PAWN_TABLE : 
                  piece.type === 'n' ? KNIGHT_TABLE : null;
    
    if (table) {
      const index = piece.color === 'w' ? square : 63 - square;
      score += table[index] * multiplier;
    }
  }
  
  return score;
}

// Alias for backward compatibility
export const evaluateBoard = evaluatePosition;

/**
 * Minimax with Alpha-Beta pruning
 * @param {Object} gameState - Current game state
 * @param {number} depth - Search depth
 * @param {number} alpha - Alpha value
 * @param {number} beta - Beta value
 * @param {boolean} maximizingPlayer - True if maximizing
 * @param {string} aiColor - AI's color
 * @returns {Object} { score, move }
 */
export function minimax(gameState, depth, alpha, beta, maximizingPlayer, aiColor) {
  const hash = transpositionTable.generateHash(
    gameState.board,
    gameState.turn,
    gameState.castling,
    gameState.enPassant
  );
  
  // Check transposition table
  const cached = transpositionTable.retrieve(hash, depth, alpha, beta);
  if (cached && depth === gameState.depth) {
    return cached;
  }
  
  // Base case: depth reached or game over
  if (depth === 0) {
    const score = evaluatePosition(gameState.board, aiColor);
    transpositionTable.store(hash, depth, score, 'exact', null);
    return { score };
  }
  
  const moves = generateAllMoves(gameState.board, gameState.turn, gameState.castling, gameState.enPassant);
  
  if (moves.length === 0) {
    // Checkmate or stalemate
    const state = getGameState(gameState.board, gameState.turn, gameState.castling, gameState.enPassant);
    if (state.isCheckmate) {
      const score = maximizingPlayer ? -100000 + (gameState.depth - depth) : 100000 - (gameState.depth - depth);
      return { score };
    }
    return { score: 0 }; // Stalemate
  }
  
  let bestMove = null;
  
  if (maximizingPlayer) {
    let maxScore = -Infinity;
    
    for (const move of moves) {
      const newGameState = makeMove(gameState, move);
      const result = minimax(newGameState, depth - 1, alpha, beta, false, aiColor);
      
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break; // Beta cutoff
    }
    
    transpositionTable.store(hash, depth, maxScore, 'lowerbound', bestMove);
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    
    for (const move of moves) {
      const newGameState = makeMove(gameState, move);
      const result = minimax(newGameState, depth - 1, alpha, beta, true, aiColor);
      
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break; // Alpha cutoff
    }
    
    transpositionTable.store(hash, depth, minScore, 'upperbound', bestMove);
    return { score: minScore, move: bestMove };
  }
}

/**
 * Get the best move for the AI
 * @param {Object} gameState - Current game state
 * @param {number} depth - Search depth (difficulty)
 * @param {string} aiColor - AI's color
 * @returns {Object|null} Best move or null
 */
export function getBestMove(gameState, depth = 3, aiColor) {
  const result = minimax(gameState, depth, -Infinity, Infinity, true, aiColor);
  console.log('AI Stats:', transpositionTable.getStats());
  return result.move;
}

/**
 * Simple random move selector (fallback)
 * @param {Array} moves - Available moves
 * @returns {Object|null} Random move
 */
export function getRandomMove(moves) {
  if (moves.length === 0) return null;
  const index = Math.floor(Math.random() * moves.length);
  return moves[index];
}
