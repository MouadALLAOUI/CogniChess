// src/utils/chess960.js

import { COLORS } from '../engine/constants';

/**
 * Generates a random Chess960 (Fischer Random) starting position.
 * Rules:
 * 1. Bishops must be on opposite colored squares.
 * 2. King must be between the two Rooks.
 * 3. Pawns are on rank 2/7 as usual.
 */
export const generateChess960Setup = () => {
  const pieces = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  let setup = new Array(8).fill(null);

  // 1. Place Bishops on opposite colors
  // Even indices (0, 2, 4, 6) are dark squares in row 0/7 context? 
  // Actually in array index: 0 is A (dark), 1 is B (light), etc.
  // Let's strictly use indices: 0,2,4,6 for one color, 1,3,5,7 for other
  
  const bishop1Pos = Math.floor(Math.random() * 4) * 2; // 0, 2, 4, or 6
  const bishop2Pos = (Math.floor(Math.random() * 4) * 2) + 1; // 1, 3, 5, or 7
  
  setup[bishop1Pos] = 'B';
  setup[bishop2Pos] = 'B';

  // 2. Place Queen and Knights in remaining spots
  const remainingIndices = setup.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
  
  // Pick spot for Queen
  const qRandomIndex = Math.floor(Math.random() * remainingIndices.length);
  const queenPos = remainingIndices[qRandomIndex];
  setup[queenPos] = 'Q';
  remainingIndices.splice(qRandomIndex, 1);

  // Pick spots for two Knights
  const n1RandomIndex = Math.floor(Math.random() * remainingIndices.length);
  const knight1Pos = remainingIndices[n1RandomIndex];
  setup[knight1Pos] = 'N';
  remainingIndices.splice(n1RandomIndex, 1);

  const n2RandomIndex = Math.floor(Math.random() * remainingIndices.length);
  const knight2Pos = remainingIndices[n2RandomIndex];
  setup[knight2Pos] = 'N';
  remainingIndices.splice(n2RandomIndex, 1);

  // 3. Place King and Rooks in the last 3 spots
  // Rule: King must be in the middle of the two Rooks
  // The remaining 3 indices are sorted, so we just place R, K, R in that order
  remainingIndices.sort((a, b) => a - b);
  
  setup[remainingIndices[0]] = 'R';
  setup[remainingIndices[1]] = 'K';
  setup[remainingIndices[2]] = 'R';

  return setup;
};

/**
 * Creates the initial board state for Chess960.
 * Returns an 8x8 board array with pieces placed according to Chess960 rules.
 */
export const createChess960Board = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  const whiteBackRank = generateChess960Setup();
  const blackBackRank = whiteBackRank.map(p => p); // Same pattern for black

  // Place White pieces (Row 7)
  for (let c = 0; c < 8; c++) {
    board[7][c] = COLORS.WHITE + whiteBackRank[c];
  }
  // Place White pawns (Row 6)
  for (let c = 0; c < 8; c++) {
    board[6][c] = COLORS.WHITE + 'P';
  }

  // Place Black pieces (Row 0)
  for (let c = 0; c < 8; c++) {
    board[0][c] = COLORS.BLACK + blackBackRank[c];
  }
  // Place Black pawns (Row 1)
  for (let c = 0; c < 8; c++) {
    board[1][c] = COLORS.BLACK + 'P';
  }

  return board;
};

/**
 * Generates a unique ID for the Chess960 starting position (0-959)
 * This is optional but useful for sharing specific setups.
 */
export const getChess960Id = (setup) => {
  // Simplified: In a real impl, we'd map the permutation to 0-959
  // For now, we just return the string representation
  return setup.join('');
};
