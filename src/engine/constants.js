/**
 * Chess Constants
 * Common constants used throughout the chess engine
 */

export const COLORS = {
  WHITE: 'w',
  BLACK: 'b'
};

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const PIECE_TYPES = ['P', 'N', 'B', 'R', 'Q', 'K'];

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const DIRECTIONS = {
  // Orthogonal (for Rook, Queen)
  ORTHOGONAL: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  // Diagonal (for Bishop, Queen)
  DIAGONAL: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  // Knight L-shapes
  KNIGHT: [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
  // King (all adjacent squares)
  KING: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
};

export const PIECE_VALUES = {
  'P': 1,
  'N': 3,
  'B': 3,
  'R': 5,
  'Q': 9,
  'K': 0 // King is invaluable
};

export default {
  COLORS,
  FILES,
  RANKS,
  PIECE_TYPES,
  START_FEN,
  DIRECTIONS,
  PIECE_VALUES
};
