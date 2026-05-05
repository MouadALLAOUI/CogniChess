/**
 * Transposition Table using Zobrist Hashing
 * Caches evaluated positions to speed up search
 */

// Zobrist random keys for hashing
class ZobristKeys {
  constructor() {
    this.pieces = [];
    this.castling = [];
    this.enPassant = [];
    this.sideToMove = 0n;
    this.init();
  }

  init() {
    // Initialize random keys for each piece on each square
    // 12 piece types (P, N, B, R, Q, K for both colors) x 64 squares
    for (let i = 0; i < 12 * 64; i++) {
      this.pieces.push(this.randomBigInt());
    }
    
    // Castling rights (4 bits: KQkq)
    for (let i = 0; i < 16; i++) {
      this.castling.push(this.randomBigInt());
    }
    
    // En passant files (8 files + none)
    for (let i = 0; i < 9; i++) {
      this.enPassant.push(this.randomBigInt());
    }
    
    this.sideToMove = this.randomBigInt();
  }

  randomBigInt() {
    // Generate a random 64-bit integer
    const high = Math.floor(Math.random() * 0xFFFFFFFF);
    const low = Math.floor(Math.random() * 0xFFFFFFFF);
    return (BigInt(high) << 32n) | BigInt(low);
  }
}

const zobrist = new ZobristKeys();

export class TranspositionTable {
  constructor(size = 1000000) {
    this.size = size;
    this.table = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate Zobrist hash for a board state
   * @param {Object} board - Board representation
   * @param {string} turn - 'w' or 'b'
   * @param {Object} castling - Castling rights
   * @param {number|null} enPassant - En passant square index
   */
  generateHash(board, turn, castling, enPassant) {
    let hash = 0n;

    // XOR piece positions
    for (let square = 0; square < 64; square++) {
      const piece = board[square];
      if (piece) {
        const pieceIndex = this.getPieceIndex(piece.type, piece.color);
        hash ^= zobrist.pieces[pieceIndex * 64 + square];
      }
    }

    // XOR side to move
    if (turn === 'b') {
      hash ^= zobrist.sideToMove;
    }

    // XOR castling rights
    let castlingIndex = 0;
    if (castling.wK) castlingIndex |= 1;
    if (castling.wQ) castlingIndex |= 2;
    if (castling.bK) castlingIndex |= 4;
    if (castling.bQ) castlingIndex |= 8;
    hash ^= zobrist.castling[castlingIndex];

    // XOR en passant
    const epIndex = enPassant !== null ? (enPassant % 8) + 1 : 0;
    hash ^= zobrist.enPassant[epIndex];

    return hash;
  }

  getPieceIndex(type, color) {
    const pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
    const typeIndex = pieces.indexOf(type.toLowerCase());
    const colorOffset = color === 'w' ? 0 : 6;
    return colorOffset + typeIndex;
  }

  /**
   * Store a position in the transposition table
   * @param {bigint} hash - Zobrist hash
   * @param {number} depth - Search depth
   * @param {number} score - Evaluation score
   * @param {string} flag - 'exact', 'lowerbound', 'upperbound'
   * @param {Object|null} bestMove - Best move found
   */
  store(hash, depth, score, flag, bestMove) {
    // Simple replacement strategy (could be improved with age-based replacement)
    if (this.table.size >= this.size) {
      // Remove oldest entry (first entry in Map)
      const firstKey = this.table.keys().next().value;
      if (firstKey !== undefined) {
        this.table.delete(firstKey);
      }
    }

    this.table.set(hash.toString(), {
      depth,
      score,
      flag,
      bestMove,
      age: Date.now()
    });
  }

  /**
   * Retrieve a position from the transposition table
   * @param {bigint} hash - Zobrist hash
   * @param {number} depth - Current search depth
   * @param {number} alpha - Alpha value
   * @param {number} beta - Beta value
   */
  retrieve(hash, depth, alpha, beta) {
    const key = hash.toString();
    const entry = this.table.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    this.hits++;

    // Only use if stored depth is sufficient
    if (entry.depth < depth) {
      return null;
    }

    // Return appropriate value based on flag
    if (entry.flag === 'exact') {
      return { score: entry.score, move: entry.bestMove };
    } else if (entry.flag === 'lowerbound' && entry.score > alpha) {
      return { score: entry.score, move: entry.bestMove };
    } else if (entry.flag === 'upperbound' && entry.score < beta) {
      return { score: entry.score, move: entry.bestMove };
    }

    return null;
  }

  /**
   * Clear the transposition table
   */
  clear() {
    this.table.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.table.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

// Export singleton instance for convenience
export const transpositionTable = new TranspositionTable();
