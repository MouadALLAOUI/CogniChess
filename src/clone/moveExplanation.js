/**
 * Move Explanation System
 * Generates human-readable explanations for why the clone played a specific move
 */

import { styleToEmbedding } from './neuralStyleEmbedding.js';

/**
 * Generate explanation for a move
 * @param {Object} move - The move that was played
 * @param {Object} bot - The bot clone data
 * @param {Object} boardState - Current board state before move
 * @param {Array} allLegalMoves - All legal moves available
 * @returns {Object} - Explanation object with reasoning
 */
export function explainMove(move, bot, boardState, allLegalMoves) {
  const { cloneData } = bot;
  const explanation = {
    move: move.san || formatMove(move),
    reasons: [],
    confidence: 0,
    alternativeConsidered: null,
    styleFactors: []
  };
  
  // Check position memory
  const memoryMatch = checkPositionMemory(cloneData.positionMemory, boardState, move);
  if (memoryMatch) {
    explanation.reasons.push({
      type: 'memory',
      text: `I've seen this position ${memoryMatch.count} times before`,
      weight: memoryMatch.weight,
      detail: `In ${memoryMatch.similarity > 0.9 ? 'exact' : 'similar'} positions, you played ${move.san} ${Math.round(memoryMatch.frequency * 100)}% of the time`
    });
    explanation.confidence += memoryMatch.weight * 0.4;
  }
  
  // Check opening book
  const openingMatch = checkOpeningBook(cloneData.openingBook, boardState, move);
  if (openingMatch) {
    explanation.reasons.push({
      type: 'opening',
      text: `This is part of your opening repertoire`,
      weight: openingMatch.weight,
      detail: `You've played ${move.san} here ${openingMatch.frequency} times in the first 15 moves`
    });
    explanation.confidence += openingMatch.weight * 0.3;
  }
  
  // Analyze style factors
  const styleReasons = analyzeStyleFactors(move, boardState, cloneData.styleProfile, allLegalMoves);
  if (styleReasons.length > 0) {
    explanation.reasons.push(...styleReasons);
    explanation.styleFactors = styleReasons.map(r => r.type);
    explanation.confidence += styleReasons.reduce((sum, r) => sum + r.weight, 0) * 0.3;
  }
  
  // Find best alternative
  const alternative = findBestAlternative(move, allLegalMoves, boardState, cloneData);
  if (alternative) {
    explanation.alternativeConsidered = {
      move: alternative.san || formatMove(alternative),
      reason: `Also considered ${alternative.san} because ${getAlternativeReason(alternative, boardState)}`
    };
  }
  
  // Normalize confidence to 0-100
  explanation.confidence = Math.min(100, Math.round(explanation.confidence * 100));
  
  // Generate summary
  explanation.summary = generateSummary(explanation);
  
  return explanation;
}

/**
 * Check position memory for this move
 */
function checkPositionMemory(positionMemory, boardState, move) {
  if (!positionMemory || Object.keys(positionMemory).length === 0) {
    return null;
  }
  
  const positionKey = generatePositionKey(boardState);
  const entry = positionMemory[positionKey];
  
  if (!entry) {
    // Try fuzzy match (simplified)
    return findFuzzyMatch(positionMemory, boardState, move);
  }
  
  const moveEntry = entry.moves.find(m => m.san === move.san || m.to === move.to);
  if (!moveEntry) return null;
  
  const totalMoves = entry.moves.reduce((sum, m) => sum + (m.count || 1), 0);
  const frequency = (moveEntry.count || 1) / totalMoves;
  
  return {
    count: moveEntry.count || 1,
    frequency,
    similarity: 1.0,
    weight: Math.min(1, frequency * (moveEntry.count || 1) / 10)
  };
}

/**
 * Find fuzzy match in position memory
 */
function findFuzzyMatch(positionMemory, boardState, move) {
  // Simplified fuzzy matching
  const entries = Object.entries(positionMemory);
  if (entries.length === 0) return null;
  
  for (const [key, entry] of entries) {
    const moveEntry = entry.moves.find(m => m.san === move.san || m.to === move.to);
    if (moveEntry && (moveEntry.count || 0) >= 2) {
      const totalMoves = entry.moves.reduce((sum, m) => sum + (m.count || 1), 0);
      return {
        count: moveEntry.count || 1,
        frequency: (moveEntry.count || 1) / totalMoves,
        similarity: 0.7, // Approximate similarity
        weight: 0.5
      };
    }
  }
  
  return null;
}

/**
 * Check opening book
 */
function checkOpeningBook(openingBook, boardState, move) {
  if (!openingBook || Object.keys(openingBook).length === 0) {
    return null;
  }
  
  const positionKey = generatePositionKey(boardState);
  const entry = openingBook[positionKey];
  
  if (!entry) return null;
  
  const moveEntry = entry.find(m => m.san === move.san || m.to === move.to);
  if (!moveEntry) return null;
  
  const totalFrequency = entry.reduce((sum, m) => sum + (m.frequency || 1), 0);
  const frequency = (moveEntry.frequency || 1) / totalFrequency;
  
  return {
    frequency: moveEntry.frequency || 1,
    weight: Math.min(1, frequency)
  };
}

/**
 * Analyze style factors that influenced the move
 */
function analyzeStyleFactors(move, boardState, styleProfile, allLegalMoves) {
  const reasons = [];
  const features = extractMoveFeatures(move, boardState, allLegalMoves);
  
  // Aggression
  if (features.capturesPiece && (styleProfile.aggression || 0.5) > 0.6) {
    reasons.push({
      type: 'aggression',
      text: 'Captures opponent piece',
      weight: 0.3,
      detail: `You tend to play aggressively (${Math.round((styleProfile.aggression || 0.5) * 100)}% aggression score)`
    });
  }
  
  // Center control
  if (features.controlsCenter && (styleProfile.centerControl || 0.5) > 0.6) {
    reasons.push({
      type: 'centerControl',
      text: 'Controls the center',
      weight: 0.25,
      detail: `You prioritize center control (${Math.round((styleProfile.centerControl || 0.5) * 100)}% importance)`
    });
  }
  
  // King safety
  if (features.improvesKingSafety && (styleProfile.kingSafety || 0.5) > 0.6) {
    reasons.push({
      type: 'kingSafety',
      text: 'Improves king safety',
      weight: 0.25,
      detail: `You value king safety (${Math.round((styleProfile.kingSafety || 0.5) * 100)}% priority)`
    });
  }
  
  // Development
  if (features.developsPiece && (styleProfile.tempo || 0.5) > 0.6) {
    reasons.push({
      type: 'tempo',
      text: 'Develops a piece quickly',
      weight: 0.2,
      detail: `You prefer fast development (${Math.round((styleProfile.tempo || 0.5) * 100)}% tempo focus)`
    });
  }
  
  // Material
  if (features.winsMaterial && (styleProfile.materialism || 0.5) > 0.6) {
    reasons.push({
      type: 'materialism',
      text: 'Wins material advantage',
      weight: 0.3,
      detail: `You value material gain (${Math.round((styleProfile.materialism || 0.5) * 100)}% materialism)`
    });
  }
  
  // Activity
  if (features.improvesActivity && (styleProfile.activity || 0.5) > 0.6) {
    reasons.push({
      type: 'activity',
      text: 'Improves piece activity',
      weight: 0.2,
      detail: `You prefer active pieces (${Math.round((styleProfile.activity || 0.5) * 100)}% activity focus)`
    });
  }
  
  return reasons;
}

/**
 * Extract features from a move
 */
function extractMoveFeatures(move, boardState, allLegalMoves) {
  return {
    capturesPiece: !!move.captured,
    controlsCenter: isCenterSquare(move.to),
    improvesKingSafety: move.castling || isKingShelter(move, boardState),
    developsPiece: isDevelopmentMove(move, boardState),
    winsMaterial: move.captured && getPieceValue(move.captured) > 1,
    improvesActivity: improvesMobility(move, boardState, allLegalMoves)
  };
}

function isCenterSquare(square) {
  const centerFiles = ['d', 'e'];
  const centerRanks = [4, 5];
  const file = square.charAt(0);
  const rank = parseInt(square.charAt(1));
  return centerFiles.includes(file) && centerRanks.includes(rank);
}

function isKingShelter(move, boardState) {
  // Simplified king shelter detection
  return false;
}

function isDevelopmentMove(move, boardState) {
  // Check if move develops minor piece from starting position
  const developingPieces = ['n', 'b'];
  return developingPieces.includes(move.piece?.toLowerCase());
}

function getPieceValue(pieceType) {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return values[pieceType?.toLowerCase()] || 0;
}

function improvesMobility(move, boardState, allLegalMoves) {
  // Simplified mobility improvement check
  return true;
}

/**
 * Find best alternative move that was considered
 */
function findBestAlternative(selectedMove, allLegalMoves, boardState, cloneData) {
  const alternatives = allLegalMoves.filter(m => 
    (m.to !== selectedMove.to || m.from !== selectedMove.from) &&
    !m.castling
  );
  
  if (alternatives.length === 0) return null;
  
  // Score alternatives
  const scored = alternatives.map(move => {
    const features = extractMoveFeatures(move, boardState, allLegalMoves);
    let score = 0;
    
    if (features.capturesPiece) score += 0.3;
    if (features.controlsCenter) score += 0.25;
    if (features.developsPiece) score += 0.2;
    
    return { move, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0]?.move || null;
}

function getAlternativeReason(move, boardState) {
  if (move.captured) return 'it captures material';
  if (isCenterSquare(move.to)) return 'it controls the center';
  return 'it improves position';
}

/**
 * Generate human-readable summary
 */
function generateSummary(explanation) {
  if (explanation.reasons.length === 0) {
    return "I played this move based on general positional principles.";
  }
  
  const primaryReason = explanation.reasons[0];
  
  if (primaryReason.type === 'memory') {
    return `I played ${explanation.move} because that's what you typically do in this position.`;
  } else if (primaryReason.type === 'opening') {
    return `I played ${explanation.move} as it's part of your opening repertoire.`;
  } else {
    return `I played ${explanation.move} because ${primaryReason.text.toLowerCase()}.`;
  }
}

/**
 * Generate position key for lookup
 */
function generatePositionKey(boardState) {
  // Simplified position key generation
  return JSON.stringify(boardState);
}

/**
 * Format move to SAN notation
 */
function formatMove(move) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fromFile = files[move.from[1]];
  const fromRank = 8 - move.from[0];
  const toFile = files[move.to[1]];
  const toRank = 8 - move.to[0];
  
  return `${fromFile}${fromRank}-${toFile}${toRank}`;
}

/**
 * Get tooltip content for UI display
 */
export function getMoveTooltip(explanation) {
  return {
    title: `Why ${explanation.move}?`,
    summary: explanation.summary,
    confidence: explanation.confidence,
    reasons: explanation.reasons.map(r => ({
      icon: getReasonIcon(r.type),
      text: r.detail || r.text
    })),
    alternative: explanation.alternativeConsidered
  };
}

function getReasonIcon(type) {
  const icons = {
    memory: '🧠',
    opening: '📚',
    aggression: '⚔️',
    centerControl: '🎯',
    kingSafety: '🛡️',
    tempo: '⚡',
    materialism: '💰',
    activity: '🏃'
  };
  return icons[type] || '💡';
}

export default {
  explainMove,
  getMoveTooltip
};
