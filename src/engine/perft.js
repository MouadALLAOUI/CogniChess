/**
 * Perft (Performance Test) Suite
 * Validates move generation correctness against known positions
 */

import { generateAllMoves } from './chessRules.js';
import { makeMove } from './chessRules.js';

// Standard test positions
export const TEST_POSITIONS = {
  startpos: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    depths: [1, 2, 3, 4, 5],
    expected: [20, 400, 8902, 197281, 4865609]
  },
  kiwipete: {
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    depths: [1, 2, 3, 4],
    expected: [48, 2039, 97862, 4085603]
  },
  position3: {
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    depths: [1, 2, 3, 4, 5],
    expected: [14, 191, 2812, 43238, 674624]
  }
};

/**
 * Count legal moves at a given depth
 * @param {Object} gameState - Current game state
 * @param {number} depth - Search depth
 * @returns {number} Number of leaf nodes
 */
export function perft(gameState, depth) {
  if (depth === 0) return 1;
  
  const moves = generateAllMoves(
    gameState.board,
    gameState.turn,
    gameState.castling,
    gameState.enPassant
  );
  
  let nodes = 0;
  
  for (const move of moves) {
    const newGameState = makeMove(gameState, move);
    nodes += perft(newGameState, depth - 1);
  }
  
  return nodes;
}

/**
 * Perft with move details (for debugging)
 * @param {Object} gameState - Current game state
 * @param {number} depth - Search depth
 * @returns {Object} { total, moves: [{ move, count }] }
 */
export function perftDetailed(gameState, depth) {
  if (depth === 0) return { total: 1, moves: [] };
  
  const moves = generateAllMoves(
    gameState.board,
    gameState.turn,
    gameState.castling,
    gameState.enPassant
  );
  
  let total = 0;
  const moveDetails = [];
  
  for (const move of moves) {
    const newGameState = makeMove(gameState, move);
    const count = perft(newGameState, depth - 1);
    total += count;
    moveDetails.push({ move, count });
  }
  
  return { total, moves: moveDetails };
}

/**
 * Run all test positions
 * @param {boolean} detailed - Show detailed move breakdown
 * @returns {Array} Results for each position
 */
export function runAllTests(detailed = false) {
  const results = [];
  
  for (const [name, test] of Object.entries(TEST_POSITIONS)) {
    console.log(`\n=== Testing ${name} ===`);
    console.log(`FEN: ${test.fen}`);
    
    // Parse FEN to get initial state (simplified - you'd use your fenParser)
    // For now, we'll skip actual execution and show expected values
    const result = {
      name,
      fen: test.fen,
      depths: test.depths.map((depth, i) => ({
        depth,
        expected: test.expected[i],
        actual: null, // Would be filled by actual perft call
        match: false,
        time: null
      }))
    };
    
    results.push(result);
  }
  
  return results;
}

/**
 * Verify a single position at a specific depth
 * @param {Object} gameState - Game state
 * @param {number} depth - Depth to test
 * @param {number} expected - Expected node count
 * @returns {Object} { passed, actual, time, error }
 */
export function verifyPosition(gameState, depth, expected) {
  const startTime = performance.now();
  
  try {
    const actual = perft(gameState, depth);
    const endTime = performance.now();
    const time = endTime - startTime;
    
    return {
      passed: actual === expected,
      actual,
      expected,
      time: time.toFixed(2) + 'ms'
    };
  } catch (error) {
    return {
      passed: false,
      actual: null,
      expected,
      error: error.message
    };
  }
}

// Export for browser console access
if (typeof window !== 'undefined') {
  window.runPerftTests = () => runAllTests(false);
  window.perft = perft;
  window.perftDetailed = perftDetailed;
}
