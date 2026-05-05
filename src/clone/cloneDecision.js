/**
 * The Brain: Clone Decision Engine
 * Combines memory, opening book, and style profile to decide the best move.
 */

import { getMemoryMove, getTopKFuzzyMoves } from './positionMemory';
import { getOpeningMove } from './openingBook';
import { coordsToSquare, moveToSAN } from '../engine/algebraicNotation';

export const decideMove = (board, fen, legalMoves, cloneData, gamesPlayed) => {
  if (legalMoves.length === 0) return null;

  // Layer 3: Position Memory (Requires at least 10 games for confidence)
  if (gamesPlayed >= 10) {
    // 3a. Exact match
    const memoryMoveStr = getMemoryMove(cloneData.positionMemory, fen);
    if (memoryMoveStr) {
      const move = findMoveBySAN(board, legalMoves, memoryMoveStr);
      if (move) return { ...move, label: 'memory' };
    }

    // 3b. Fuzzy match (Top-K with style blending)
    const fuzzyMatches = getTopKFuzzyMoves(cloneData.positionMemory, fen, 0.85, 3);
    if (fuzzyMatches.length > 0) {
      const bestFuzzyMove = blendFuzzyWithStyle(board, legalMoves, fuzzyMatches, cloneData.styleProfile);
      if (bestFuzzyMove) {
        return {
          ...bestFuzzyMove.move,
          label: 'fuzzy-memory',
          similarity: Math.round(bestFuzzyMove.similarity * 100)
        };
      }
    }
  }

  // Layer 1: Opening Book (Requires at least 1 game)
  if (gamesPlayed >= 1) {
    const openingMoveStr = getOpeningMove(cloneData.openingBook, fen);
    if (openingMoveStr) {
      const move = findMoveBySAN(board, legalMoves, openingMoveStr);
      if (move) return { ...move, label: 'opening' };
    }
  }

  // Layer 2: Style Weighted Move
  const weightedMove = styleWeightedMove(board, legalMoves, cloneData.styleProfile);
  return { ...weightedMove, label: 'style' };
};

const styleWeightedMove = (board, legalMoves, styleProfile) => {
  const scoredMoves = scoreMovesByStyle(board, legalMoves, styleProfile);
  // Sort by score descending and pick the best one
  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
};

/**
 * Blends fuzzy memory matches with the style profile.
 * Final move score = 70% fuzzy similarity + 30% style score.
 */
const blendFuzzyWithStyle = (board, legalMoves, fuzzyMatches, styleProfile) => {
  const scoredStyleMoves = scoreMovesByStyle(board, legalMoves, styleProfile);

  const blendedResults = fuzzyMatches.map(match => {
    const move = findMoveBySAN(board, legalMoves, match.moveStr);
    if (!move) return null;

    const styleResult = scoredStyleMoves.find(s => s.move === move);
    const styleScore = styleResult ? styleResult.score : 0;

    // Normalize style score (roughly 0-1 range based on heuristic max)
    const normalizedStyle = Math.min(styleScore / 10, 1);

    // Final score calculation
    const finalScore = (match.similarity * 0.7) + (normalizedStyle * 0.3);

    return { move, similarity: match.similarity, finalScore };
  }).filter(Boolean);

  if (blendedResults.length === 0) return null;

  // Select move based on weighted randomness or just the top score
  blendedResults.sort((a, b) => b.finalScore - a.finalScore);
  return blendedResults[0];
};

const scoreMovesByStyle = (board, legalMoves, styleProfile) => {
  return legalMoves.map(move => {
    let score = 0;
    const [tr, tc] = move.to;
    const [fr, fc] = move.from;
    const piece = board[fr][fc];
    const targetPiece = board[tr][tc];
    const toStr = coordsToSquare(tr, tc);
    const pieceType = piece[1];

    // +3 destination is a favorite square
    if (styleProfile.favoriteSquares && styleProfile.favoriteSquares[toStr]) {
      score += 3;
    }

    // +2 piece matches favorite piece type
    if (styleProfile.favoritePieces && styleProfile.favoritePieces[pieceType] > 0.2) {
      score += 2;
    }

    // +2 capture when aggressionScore > 0.6
    if (targetPiece && styleProfile.aggressionScore > 0.6) {
      score += 2;
    }

    // +1 targets center (d4/d5/e4/e5) when centerControlScore > 0.5
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    if (centerSquares.includes(toStr) && styleProfile.centerControlScore > 0.5) {
      score += 1;
    }

    // Small random noise (±0.5) to avoid robotic repetition
    score += (Math.random() - 0.5);

    return { move, score };
  });
};

// Helper to find a move object from a SAN string
const findMoveBySAN = (board, legalMoves, san) => {
  // Strip check and checkmate symbols for easier matching
  const cleanSan = san.replace(/[+#]/g, '');

  return legalMoves.find(m => {
    const moveSAN = moveToSAN(board, m, false, false);
    const cleanMoveSAN = moveSAN.replace(/[+#]/g, '');
    return cleanMoveSAN === cleanSan;
  });
};
