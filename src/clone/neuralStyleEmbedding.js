/**
 * Neural Style Embedding System
 * Converts style profiles into low-dimensional vectors and scores moves
 * using a lightweight neural-network-inspired approach
 */

// Style dimensions for embedding vector
const STYLE_DIMENSIONS = [
  'aggression',      // 0-1: tendency to capture/attack
  'centerControl',   // 0-1: preference for center squares
  'kingSafety',      // 0-1: castling early, king shelter
  'materialism',     // 0-1: value material over position
  'activity',        // 0-1: piece mobility focus
  'pawnStructure',   // 0-1: pawn advance/maintenance
  'pieceCoordination',// 0-1: pieces working together
  'tempo',           // 0-1: speed of development
  'endgameSkill',    // 0-1: endgame technique
  'openings'         // 0-1: opening variety vs repetition
];

/**
 * Convert style profile to embedding vector
 * @param {Object} styleProfile - The bot's style profile
 * @returns {Float32Array} - Normalized embedding vector
 */
export function styleToEmbedding(styleProfile) {
  const vector = new Float32Array(STYLE_DIMENSIONS.length);
  
  // Map style profile properties to embedding dimensions
  vector[0] = normalizeValue(styleProfile.aggression || 0.5);
  vector[1] = normalizeValue(styleProfile.centerControl || 0.5);
  vector[2] = normalizeValue(styleProfile.kingSafety || 0.5);
  vector[3] = normalizeValue(styleProfile.materialism || 0.5);
  vector[4] = normalizeValue(styleProfile.activity || 0.5);
  vector[5] = normalizeValue(styleProfile.pawnStructure || 0.5);
  vector[6] = normalizeValue(styleProfile.pieceCoordination || 0.5);
  vector[7] = normalizeValue(styleProfile.tempo || 0.5);
  vector[8] = normalizeValue(styleProfile.endgameSkill || 0.5);
  vector[9] = normalizeValue(styleProfile.openingVariety !== undefined ? styleProfile.openingVariety : 0.5);
  
  return vector;
}

/**
 * Normalize a value to 0-1 range
 */
function normalizeValue(value) {
  if (typeof value === 'number') {
    return Math.max(0, Math.min(1, value));
  }
  return 0.5;
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {Float32Array} vec1 
 * @param {Float32Array} vec2 
 * @returns {number} - Similarity score (0-1)
 */
export function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return (dotProduct / (norm1 * norm2) + 1) / 2; // Normalize to 0-1
}

/**
 * Simple neural network-inspired move scorer
 * Uses weighted combination of style factors and position evaluation
 */
class MoveScorer {
  constructor(weights = null) {
    // Initialize weights for each style dimension
    this.weights = weights || new Float32Array(STYLE_DIMENSIONS.length).fill(1);
    this.bias = 0;
  }

  /**
   * Score a move based on style embedding and position features
   * @param {Object} move - The move to score
   * @param {Float32Array} styleEmbedding - User's style embedding
   * @param {Object} boardState - Current board state
   * @param {Object} positionFeatures - Extracted position features
   * @returns {number} - Move score
   */
  scoreMove(move, styleEmbedding, boardState, positionFeatures) {
    let score = this.bias;
    
    // Calculate feature vector for this move
    const features = this.extractMoveFeatures(move, boardState, positionFeatures);
    
    // Weighted sum (linear layer)
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      score += features[i] * this.weights[i] * styleEmbedding[i];
    }
    
    // Apply activation (sigmoid-like)
    score = 1 / (1 + Math.exp(-score));
    
    return score;
  }

  /**
   * Extract features from a move for scoring
   */
  extractMoveFeatures(move, boardState, positionFeatures) {
    const features = new Float32Array(STYLE_DIMENSIONS.length);
    
    // Aggression: does move capture or threaten?
    features[0] = move.captured ? 1.0 : (positionFeatures.threatensCapture ? 0.7 : 0.3);
    
    // Center control: does move occupy/control center?
    const centerSquares = ['d4', 'e4', 'd5', 'e5'];
    const targetSquare = algebraicNotation(move.to);
    features[1] = centerSquares.includes(targetSquare) ? 1.0 : 0.5;
    
    // King safety: castling or king shelter
    features[2] = move.castling ? 1.0 : (positionFeatures.improvesKingSafety ? 0.8 : 0.4);
    
    // Materialism: captures valuable pieces
    if (move.captured) {
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
      features[3] = Math.min(1, (pieceValues[move.captured.toLowerCase()] || 1) / 9);
    } else {
      features[3] = 0.3;
    }
    
    // Activity: improves piece mobility
    features[4] = positionFeatures.improvesMobility ? 0.9 : 0.5;
    
    // Pawn structure: pawn moves that improve structure
    features[5] = positionFeatures.improvesPawnStructure ? 0.8 : 0.4;
    
    // Piece coordination: works with other pieces
    features[6] = positionFeatures.coordinatesWithPieces ? 0.85 : 0.5;
    
    // Tempo: develops pieces quickly
    features[7] = positionFeatures.developsPiece ? 0.9 : 0.4;
    
    // Endgame skill: simplifies when ahead, complicates when behind
    const phase = detectGamePhase(boardState);
    if (phase === 'endgame') {
      features[8] = positionFeatures.simplifiesWhenAhead ? 0.9 : 0.5;
    } else {
      features[8] = 0.5;
    }
    
    // Openings: follows opening principles
    features[9] = positionFeatures.followsOpeningPrinciples ? 0.85 : 0.5;
    
    return features;
  }

  /**
   * Update weights based on game outcomes (simple reinforcement)
   * @param {Array} successfulMoves - Moves that led to good outcomes
   * @param {Array} failedMoves - Moves that led to bad outcomes
   * @param {Float32Array} styleEmbedding 
   * @param {number} learningRate 
   */
  updateWeights(successfulMoves, failedMoves, styleEmbedding, learningRate = 0.01) {
    // Reinforce weights for successful moves
    successfulMoves.forEach(moveData => {
      const features = moveData.features;
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i] += learningRate * features[i] * styleEmbedding[i];
      }
    });
    
    // Penalize weights for failed moves
    failedMoves.forEach(moveData => {
      const features = moveData.features;
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i] -= learningRate * features[i] * styleEmbedding[i];
      }
    });
    
    // Clamp weights to prevent explosion
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = Math.max(-2, Math.min(2, this.weights[i]));
    }
  }
}

// Helper: convert coordinates to algebraic notation
function algebraicNotation(square) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = files[square[1]];
  const rank = 8 - square[0];
  return `${file}${rank}`;
}

// Helper: detect game phase
function detectGamePhase(boardState) {
  // Simplified phase detection
  let material = 0;
  for (let row of boardState) {
    for (let square of row) {
      if (square && square.type !== 'k' && square.type !== 'K') {
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, P: 1, N: 3, B: 3, R: 5, Q: 9 };
        material += values[square.type] || 0;
      }
    }
  }
  
  if (material < 13) return 'endgame';
  if (material > 26) return 'opening';
  return 'middlegame';
}

export { MoveScorer, STYLE_DIMENSIONS };
