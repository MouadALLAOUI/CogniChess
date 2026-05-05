import { getPieceValue } from '../engine/pieceUtils';

/**
 * Compute player accuracy based on move comparison with engine recommendations
 */
export const computeAccuracy = (moveHistory, gameResult) => {
  if (!moveHistory || moveHistory.length === 0) return 0;

  let accurateMoves = 0;
  let totalMoves = 0;

  moveHistory.forEach((move, index) => {
    if (!move.isBot) {
      totalMoves++;
      
      // Simple heuristic: if move matches engine recommendation or doesn't lose material
      if (move.accuracyScore >= 80 || !move.materialLost) {
        accurateMoves++;
      } else if (move.accuracyScore >= 50) {
        accurateMoves += 0.5;
      }
    }
  });

  if (totalMoves === 0) return 100;
  
  const baseAccuracy = (accurateMoves / totalMoves) * 100;
  
  // Bonus for winning
  if (gameResult === 'win') {
    return Math.min(100, baseAccuracy + 10);
  }
  
  return Math.round(baseAccuracy);
};

/**
 * Find the best move from history (highest material gain or positional advantage)
 */
export const findBestMove = (moveHistory) => {
  if (!moveHistory || moveHistory.length === 0) return null;

  let bestMove = null;
  let bestScore = -Infinity;

  moveHistory.forEach((move, index) => {
    if (!move.isBot) {
      const score = move.materialGain || 0;
      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          ...move,
          moveNumber: Math.floor(index / 2) + 1,
          score
        };
      }
    }
  });

  return bestMove;
};

/**
 * Find the biggest mistake (most material lost or position turned)
 */
export const findBiggestMistake = (moveHistory) => {
  if (!moveHistory || moveHistory.length === 0) return null;

  let worstMove = null;
  let worstScore = Infinity;

  moveHistory.forEach((move, index) => {
    if (!move.isBot) {
      const materialLost = move.materialLost || 0;
      const accuracyDrop = move.accuracyDrop || 0;
      const score = materialLost + (accuracyDrop / 10);

      if (score > 0 && score < worstScore) {
        worstScore = score;
        worstMove = {
          ...move,
          moveNumber: Math.floor(index / 2) + 1,
          materialLost,
          accuracyDrop
        };
      }
    }
  });

  return worstMove;
};

/**
 * Generate heatmap data showing piece activity across the board
 */
export const generateHeatmapData = (moveHistory, playerColor) => {
  const heatmap = Array(8).fill(null).map(() => Array(8).fill(0));

  if (!moveHistory) return heatmap;

  moveHistory.forEach((move) => {
    if (!move.isBot && move.color === playerColor) {
      const [fromR, fromC] = move.from;
      const [toR, toC] = move.to;

      // Count source square
      if (fromR >= 0 && fromR < 8 && fromC >= 0 && fromC < 8) {
        heatmap[fromR][fromC] += 0.5;
      }

      // Count destination square (more weight)
      if (toR >= 0 && toR < 8 && toC >= 0 && toC < 8) {
        heatmap[toR][toC] += 1;
        
        // Extra weight for captures
        if (move.captured) {
          heatmap[toR][toC] += 1;
        }
      }
    }
  });

  return heatmap;
};

/**
 * Get color intensity for heatmap visualization
 */
export const getHeatmapColor = (value, maxValue) => {
  if (value === 0) return 'transparent';
  
  const intensity = Math.min(1, value / (maxValue || 1));
  
  // Blue to red gradient
  const r = Math.round(255 * intensity);
  const b = Math.round(255 * (1 - intensity));
  const g = Math.round(100 * (1 - intensity));
  
  return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.4})`;
};

export default {
  computeAccuracy,
  findBestMove,
  findBiggestMistake,
  generateHeatmapData,
  getHeatmapColor
};
