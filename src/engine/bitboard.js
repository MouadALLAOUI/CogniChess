/**
 * Bitboard Utilities for CogniChess
 * Uses BigInt for 64-bit board representation
 */

// Constants for bitboards
export const EMPTY = 0n;
export const FULL = 0xFFFFFFFFFFFFFFFFn;

// File masks
export const FILE_A = 0x0101010101010101n;
export const FILE_B = 0x0202020202020202n;
export const FILE_C = 0x0404040404040404n;
export const FILE_D = 0x0808080808080808n;
export const FILE_E = 0x1010101010101010n;
export const FILE_F = 0x2020202020202020n;
export const FILE_G = 0x4040404040404040n;
export const FILE_H = 0x8080808080808080n;

// Rank masks
export const RANK_1 = 0xFFn;
export const RANK_2 = 0xFF00n;
export const RANK_3 = 0xFF0000n;
export const RANK_4 = 0xFF000000n;
export const RANK_5 = 0xFF00000000n;
export const RANK_6 = 0xFF0000000000n;
export const RANK_7 = 0xFF000000000000n;
export const RANK_8 = 0xFF00000000000000n;

// Not masks
export const NOT_FILE_A = ~FILE_A;
export const NOT_FILE_H = ~FILE_H;
export const NOT_FILE_AB = ~(FILE_A | FILE_B);
export const NOT_FILE_GH = ~(FILE_G | FILE_H);
export const NOT_RANK_1 = ~RANK_1;
export const NOT_RANK_8 = ~RANK_8;

// Square helpers
export const getSquare = (file, rank) => 1n << BigInt(file + rank * 8);
export const getFile = (square) => Math.log2(Number(square & 0x0101010101010101n * 0x0102040810204080n >> 56n));
export const getRank = (square) => Math.log2(Number(square & RANK_8)) - 3; // Simplified

// Population count (number of set bits)
export const popCount = (bb) => {
  let count = 0n;
  while (bb > 0n) {
    bb &= bb - 1n;
    count++;
  }
  return Number(count);
};

// Get least significant bit index
export const lsb = (bb) => {
  if (bb === 0n) return -1;
  return Math.log2(Number(bb & -bb));
};

// Shift operations
export const shiftNorth = (bb) => bb << 8n;
export const shiftSouth = (bb) => bb >> 8n;
export const shiftEast = (bb) => (bb << 1n) & NOT_FILE_A;
export const shiftWest = (bb) => (bb >> 1n) & NOT_FILE_H;
export const shiftNorthEast = (bb) => (bb << 9n) & NOT_FILE_A;
export const shiftNorthWest = (bb) => (bb << 7n) & NOT_FILE_H;
export const shiftSouthEast = (bb) => (bb >> 7n) & NOT_FILE_A;
export const shiftSouthWest = (bb) => (bb >> 9n) & NOT_FILE_H;

// Initialize magic bitboards data would go here in a full implementation
// For now, we export utility functions for sliding piece attacks using ray casting
export const generateRayAttacks = (square, direction) => {
  let attacks = 0n;
  let sq = 1n << BigInt(square);
  
  while (true) {
    sq = direction === 'N' ? shiftNorth(sq) :
         direction === 'S' ? shiftSouth(sq) :
         direction === 'E' ? shiftEast(sq) :
         direction === 'W' ? shiftWest(sq) :
         direction === 'NE' ? shiftNorthEast(sq) :
         direction === 'NW' ? shiftNorthWest(sq) :
         direction === 'SE' ? shiftSouthEast(sq) :
         direction === 'SW' ? shiftSouthWest(sq) : 0n;
    
    if (sq === 0n) break;
    attacks |= sq;
    if ((sq & FILE_A) && direction.includes('W')) break;
    if ((sq & FILE_H) && direction.includes('E')) break;
  }
  return attacks;
};
