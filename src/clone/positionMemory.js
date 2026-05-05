import { getPositionSimilarity, normalizeFen } from './fuzzyMatcher';

/**
 * Layer 3: Position Memory
 * Memorizes exact moves for specific positions.
 */

export const buildPositionMemory = (moveHistory) => {
  const memory = {};

  moveHistory.forEach(move => {
    const fen = normalizeFen(move.fen);
    const moveStr = move.notation;

    // In position memory, we just store the most recent or most frequent move
    // For now, let's store move frequencies per position
    if (!memory[fen]) {
      memory[fen] = {};
    }
    memory[fen][moveStr] = (memory[fen][moveStr] || 0) + 1;
  });

  // Convert frequencies to a single preferred move per FEN
  const consolidatedMemory = {};
  for (const fen in memory) {
    let bestMove = null;
    let maxCount = -1;
    for (const moveStr in memory[fen]) {
      if (memory[fen][moveStr] > maxCount) {
        maxCount = memory[fen][moveStr];
        bestMove = moveStr;
      }
    }
    consolidatedMemory[fen] = bestMove;
  }

  return consolidatedMemory;
};

export const getMemoryMove = (memory, fen) => {
  return memory[normalizeFen(fen)] || null;
};

/**
 * Finds top K moves based on visual similarity of positions.
 * @param {Object} memory - Position memory store
 * @param {string} fen - Current FEN
 * @param {number} threshold - Similarity threshold
 * @param {number} k - Number of top matches to return
 */
export const getTopKFuzzyMoves = (memory, fen, threshold = 0.85, k = 3) => {
  const normalizedTarget = normalizeFen(fen);
  const matches = [];

  for (const storedFen in memory) {
    const similarity = getPositionSimilarity(normalizedTarget, storedFen);
    if (similarity >= threshold) {
      matches.push({
        moveStr: memory[storedFen],
        similarity: similarity
      });
    }
  }

  // Sort by similarity descending and take top K
  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
};
