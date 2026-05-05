/**
 * Self-Play Reinforcement Learning System
 * Allows clones to play against themselves to discover new move patterns
 * while maintaining consistency with the user's style
 */

import { styleToEmbedding, MoveScorer } from './neuralStyleEmbedding.js';
import { calculateTemporalWeight } from './temporalDecay.js';

/**
 * Self-play configuration
 */
const SELF_PLAY_CONFIG = {
  minGamesForSelfPlay: 20,           // Minimum games before enabling self-play
  selfPlayIterations: 10,            // Number of self-play games per session
  explorationRate: 0.3,              // Rate of exploring non-typical moves
  styleConsistencyThreshold: 0.7,    // Minimum style similarity to accept move
  learningRate: 0.05,                // How quickly to incorporate new patterns
  maxNewPatternsPerSession: 5,       // Limit new patterns discovered per session
};

/**
 * Run self-play session for a bot
 * @param {Object} bot - The bot clone data
 * @param {Function} generateLegalMoves - Function to generate legal moves
 * @param {Function} simulateGame - Function to simulate a complete game
 * @returns {Object} - Discovered patterns and updated knowledge
 */
export async function runSelfPlaySession(bot, generateLegalMoves, simulateGame) {
  const { cloneData } = bot;
  
  // Check if bot has enough experience
  if (cloneData.gamesPlayed < SELF_PLAY_CONFIG.minGamesForSelfPlay) {
    return {
      success: false,
      reason: 'Insufficient games played for self-play',
      requiredGames: SELF_PLAY_CONFIG.minGamesForSelfPlay
    };
  }
  
  const styleEmbedding = styleToEmbedding(cloneData.styleProfile);
  const moveScorer = new MoveScorer();
  
  const discoveredPatterns = {
    newMoves: [],
    improvedOpenings: [],
    positionalInsights: [],
    successfulStrategies: []
  };
  
  // Run multiple self-play iterations
  for (let i = 0; i < SELF_PLAY_CONFIG.selfPlayIterations; i++) {
    const gameResult = await simulateSelfPlayGame(
      bot,
      styleEmbedding,
      moveScorer,
      generateLegalMoves,
      simulateGame
    );
    
    // Extract patterns from game
    extractPatternsFromGame(gameResult, discoveredPatterns, styleEmbedding);
  }
  
  // Filter and rank discovered patterns
  const rankedPatterns = rankAndFilterPatterns(discoveredPatterns, styleEmbedding);
  
  return {
    success: true,
    gamesPlayed: SELF_PLAY_CONFIG.selfPlayIterations,
    patternsDiscovered: rankedPatterns,
    recommendations: generateRecommendations(rankedPatterns)
  };
}

/**
 * Simulate a single self-play game
 */
async function simulateSelfPlayGame(bot, styleEmbedding, moveScorer, generateLegalMoves, simulateGame) {
  const moves = [];
  let boardState = getInitialBoardState();
  let turn = 'white';
  let gameOver = false;
  
  while (!gameOver) {
    const legalMoves = generateLegalMoves(boardState, turn);
    
    if (legalMoves.length === 0) {
      gameOver = true;
      break;
    }
    
    // Select move using style-aware exploration
    const selectedMove = selectMoveWithExploration(
      legalMoves,
      boardState,
      styleEmbedding,
      moveScorer,
      SELF_PLAY_CONFIG.explorationRate
    );
    
    moves.push({
      move: selectedMove,
      turn,
      boardState: cloneBoardState(boardState),
      timestamp: Date.now()
    });
    
    // Apply move to board
    boardState = applyMove(boardState, selectedMove);
    
    // Check game end conditions
    const gameState = evaluateGameState(boardState, turn);
    if (gameState.gameOver) {
      gameOver = true;
    } else {
      turn = turn === 'white' ? 'black' : 'white';
    }
  }
  
  return {
    moves,
    result: determineGameResult(boardState, turn),
    duration: moves.length
  };
}

/**
 * Select move with style-aware exploration
 */
function selectMoveWithExploration(legalMoves, boardState, styleEmbedding, moveScorer, explorationRate) {
  // Score all moves
  const scoredMoves = legalMoves.map(move => {
    const positionFeatures = extractPositionFeatures(move, boardState);
    const score = moveScorer.scoreMove(move, styleEmbedding, boardState, positionFeatures);
    return { move, score };
  });
  
  // Sort by score
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // Epsilon-greedy selection
  if (Math.random() < explorationRate) {
    // Explore: choose from top moves with some randomness
    const topMoves = scoredMoves.slice(0, Math.max(3, Math.floor(scoredMoves.length * 0.3)));
    const weightedSelection = weightedRandomSelect(topMoves);
    return weightedSelection.move;
  } else {
    // Exploit: choose best scoring move that matches style
    for (const scoredMove of scoredMoves) {
      if (scoredMove.score >= SELF_PLAY_CONFIG.styleConsistencyThreshold) {
        return scoredMove.move;
      }
    }
    // Fallback to best move
    return scoredMoves[0].move;
  }
}

/**
 * Extract patterns from a completed self-play game
 */
function extractPatternsFromGame(gameResult, discoveredPatterns, styleEmbedding) {
  const { moves, result } = gameResult;
  
  // Analyze opening phase (first 10 moves)
  const openingMoves = moves.slice(0, 10);
  if (openingMoves.length > 0) {
    const openingPattern = analyzeOpeningPattern(openingMoves);
    if (openingPattern && isValidOpeningPattern(openingPattern, styleEmbedding)) {
      discoveredPatterns.improvedOpenings.push(openingPattern);
    }
  }
  
  // Analyze successful strategies
  const winner = result.winner;
  if (winner) {
    const winningMoves = moves.filter(m => m.turn === winner);
    const strategy = extractWinningStrategy(winningMoves, result);
    if (strategy) {
      discoveredPatterns.successfulStrategies.push(strategy);
    }
  }
  
  // Find novel moves (not in current memory)
  const novelMoves = findNovelMoves(moves, styleEmbedding);
  if (novelMoves.length > 0) {
    discoveredPatterns.newMoves.push(...novelMoves);
  }
  
  // Extract positional insights
  const insights = extractPositionalInsights(moves, result);
  if (insights.length > 0) {
    discoveredPatterns.positionalInsights.push(...insights);
  }
}

/**
 * Find moves that are good but not currently in bot's repertoire
 */
function findNovelMoves(moves, styleEmbedding) {
  const novelMoves = [];
  
  moves.forEach((moveData, index) => {
    const { move, boardState } = moveData;
    const positionKey = getPositionKey(boardState);
    
    // Check if this move is already known
    const isKnown = checkIfMoveKnown(positionKey, move);
    
    if (!isKnown) {
      // Evaluate if move is consistent with style
      const positionFeatures = extractPositionFeatures(move, boardState);
      const moveScorer = new MoveScorer();
      const score = moveScorer.scoreMove(move, styleEmbedding, boardState, positionFeatures);
      
      if (score >= SELF_PLAY_CONFIG.styleConsistencyThreshold) {
        novelMoves.push({
          position: positionKey,
          move,
          score,
          context: getContextFromMoves(moves, index),
          timestamp: Date.now()
        });
      }
    }
  });
  
  return novelMoves.slice(0, SELF_PLAY_CONFIG.maxNewPatternsPerSession);
}

/**
 * Rank and filter discovered patterns by quality and style consistency
 */
function rankAndFilterPatterns(discoveredPatterns, styleEmbedding) {
  const ranked = {
    newMoves: rankMovesByQuality(discoveredPatterns.newMoves, styleEmbedding),
    improvedOpenings: rankOpeningsByFrequency(discoveredPatterns.improvedOpenings),
    positionalInsights: rankInsightsByImpact(discoveredPatterns.positionalInsights),
    successfulStrategies: rankStrategiesByEffectiveness(discoveredPatterns.successfulStrategies)
  };
  
  return ranked;
}

function rankMovesByQuality(moves, styleEmbedding) {
  return moves
    .sort((a, b) => b.score - a.score)
    .slice(0, SELF_PLAY_CONFIG.maxNewPatternsPerSession);
}

function rankOpeningsByFrequency(openings) {
  const frequencyMap = {};
  openings.forEach(opening => {
    const key = JSON.stringify(opening.sequence);
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  });
  
  return Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({
      sequence: JSON.parse(key),
      frequency: count
    }));
}

function rankInsightsByImpact(insights) {
  return insights
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10);
}

function rankStrategiesByEffectiveness(strategies) {
  return strategies
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, 5);
}

/**
 * Generate recommendations based on discovered patterns
 */
function generateRecommendations(rankedPatterns) {
  const recommendations = [];
  
  if (rankedPatterns.newMoves.length > 0) {
    recommendations.push({
      type: 'new_moves',
      message: `Discovered ${rankedPatterns.newMoves.length} new moves consistent with your style`,
      priority: 'high'
    });
  }
  
  if (rankedPatterns.improvedOpenings.length > 0) {
    recommendations.push({
      type: 'openings',
      message: `Found ${rankedPatterns.improvedOpenings.length} opening variations to consider`,
      priority: 'medium'
    });
  }
  
  if (rankedPatterns.successfulStrategies.length > 0) {
    recommendations.push({
      type: 'strategy',
      message: 'Identified effective strategic patterns from self-play',
      priority: 'high'
    });
  }
  
  return recommendations;
}

// Helper functions (stubs - would integrate with existing chess engine)
function getInitialBoardState() {
  // Return initial chess board state
  return [];
}

function cloneBoardState(board) {
  return JSON.parse(JSON.stringify(board));
}

function applyMove(board, move) {
  // Apply move to board and return new state
  return board;
}

function evaluateGameState(board, turn) {
  // Check for checkmate, stalemate, etc.
  return { gameOver: false };
}

function determineGameResult(board, turn) {
  // Determine winner/draw
  return { winner: null, result: 'draw' };
}

function getPositionKey(board) {
  // Generate unique key for position
  return JSON.stringify(board);
}

function checkIfMoveKnown(positionKey, move) {
  // Check if move exists in bot's memory
  return false;
}

function extractPositionFeatures(move, board) {
  // Extract features for move scoring
  return {
    threatensCapture: false,
    improvesKingSafety: false,
    improvesMobility: false,
    improvesPawnStructure: false,
    coordinatesWithPieces: false,
    developsPiece: false,
    simplifiesWhenAhead: false,
    followsOpeningPrinciples: false
  };
}

function analyzeOpeningPattern(moves) {
  // Analyze first moves to identify opening pattern
  return {
    sequence: moves.map(m => m.move.san),
    confidence: 0.8
  };
}

function isValidOpeningPattern(pattern, styleEmbedding) {
  // Validate opening against style
  return true;
}

function extractWinningStrategy(winningMoves, result) {
  // Extract strategy from winning moves
  return {
    description: 'Controlled center and developed pieces quickly',
    effectiveness: 0.85,
    keyMoves: winningMoves.slice(0, 5).map(m => m.move.san)
  };
}

function extractPositionalInsights(moves, result) {
  // Extract general positional insights
  return [];
}

function getContextFromMoves(moves, index) {
  // Get context around a move
  return {
    preceding: moves.slice(Math.max(0, index - 3), index),
    following: moves.slice(index + 1, Math.min(moves.length, index + 4))
  };
}

function weightedRandomSelect(items) {
  // Weighted random selection
  const total = items.reduce((sum, item) => sum + item.score, 0);
  let random = Math.random() * total;
  
  for (const item of items) {
    random -= item.score;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

export default {
  runSelfPlaySession,
  SELF_PLAY_CONFIG
};
