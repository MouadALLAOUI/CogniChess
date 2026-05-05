/**
 * Piece utility functions for chess operations
 */

const PIECE_VALUES = {
  'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
};

/**
 * Get the material value of a piece
 * @param {string} piece - Piece notation (e.g., 'wP', 'bQ')
 * @returns {number} Material value
 */
export const getPieceValue = (piece) => {
  if (!piece) return 0;
  return PIECE_VALUES[piece] || 0;
};

/**
 * Get piece type from notation
 * @param {string} piece - Piece notation (e.g., 'wP')
 * @returns {string} Piece type (e.g., 'P')
 */
export const getPieceType = (piece) => {
  if (!piece) return null;
  return piece[1].toUpperCase();
};

/**
 * Get piece color from notation
 * @param {string} piece - Piece notation (e.g., 'wP')
 * @returns {string} Color ('w' or 'b')
 */
export const getPieceColor = (piece) => {
  if (!piece) return null;
  return piece[0];
};

/**
 * Check if piece is enemy
 * @param {string} piece - Piece notation
 * @param {string} color - Current player color
 * @returns {boolean} True if enemy piece
 */
export const isEnemy = (piece, color) => {
  if (!piece) return false;
  return piece[0] !== color;
};

/**
 * Check if piece is friendly
 * @param {string} piece - Piece notation
 * @param {string} color - Current player color
 * @returns {boolean} True if friendly piece
 */
export const isFriendly = (piece, color) => {
  if (!piece) return false;
  return piece[0] === color;
};

export default {
  getPieceValue,
  getPieceType,
  getPieceColor,
  isEnemy,
  isFriendly
};
