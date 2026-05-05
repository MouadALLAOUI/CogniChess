import { getLegalMoves } from '../engine/chessRules';
import { simulateMove } from '../engine/moveValidator';

/**
 * Detects if a human move was a blunder compared to clone's recommendation
 * @param {Object} humanMove - The move the human made
 * @param {Object} cloneRecommendedMove - The move clone would have played
 * @param {Object} positionMemory - Clone's memory of this position
 * @param {Object} styleProfile - Clone's style profile
 * @param {Array} board - Current board state
 * @returns {Object|null} Blunder info or null if no blunder
 */
export const detectBlunder = (humanMove, cloneRecommendedMove, positionMemory, styleProfile, board) => {
  if (!humanMove || !cloneRecommendedMove) return null;

  // Check if moves match
  const isSameMove = 
    humanMove.from[0] === cloneRecommendedMove.from[0] &&
    humanMove.from[1] === cloneRecommendedMove.from[1] &&
    humanMove.to[0] === cloneRecommendedMove.to[0] &&
    humanMove.to[1] === cloneRecommendedMove.to[1];

  if (isSameMove) return null;

  // Check position memory - if human move is very uncommon
  const fenKey = generateFenKey(board);
  const memoryEntry = positionMemory[fenKey];
  
  let severity = 'info';
  let message = 'Alternative move suggested';
  let tacticalPattern = null;

  // Calculate material difference
  const humanMaterialGain = calculateMaterialGain(humanMove, board);
  const recommendedMaterialGain = calculateMaterialGain(cloneRecommendedMove, board);

  if (recommendedMaterialGain > humanMaterialGain + 2) {
    severity = 'error';
    message = `Missed opportunity! Gaining ${recommendedMaterialGain - humanMaterialGain} more material was possible.`;
  } else if (humanMaterialGain < 0 && recommendedMaterialGain >= 0) {
    severity = 'error';
    message = 'This move loses material. Consider the safer alternative.';
  }

  // Detect tactical patterns
  const pattern = detectTacticalPattern(humanMove, board);
  if (pattern) {
    tacticalPattern = pattern;
    if (pattern.type === 'fork') {
      severity = 'warning';
      message = `Watch out! You might be walking into a ${pattern.name}.`;
    }
  }

  // Check if move is in position memory
  if (memoryEntry) {
    const moveNotation = `${humanMove.from[0]},${humanMove.from[1]}-${humanMove.to[0]},${humanMove.to[1]}`;
    const moveStats = memoryEntry[moveNotation];
    
    if (!moveStats || moveStats.count < 2) {
      severity = severity === 'info' ? 'warning' : severity;
      message = 'This is an uncommon move in this position based on previous games.';
    }
  }

  return {
    severity,
    message,
    recommendedMove: cloneRecommendedMove,
    tacticalPattern
  };
};

/**
 * Calculate material gain from a move
 */
const calculateMaterialGain = (move, board) => {
  if (!move || !board) return 0;
  
  const [toR, toC] = move.to;
  const capturedPiece = board[toR][toC];
  
  if (!capturedPiece) return 0;
  
  const pieceValues = {
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
  };
  
  return pieceValues[capturedPiece] || 0;
};

/**
 * Detect simple tactical patterns (fork, pin, discovered attack)
 */
export const detectTacticalPattern = (move, board) => {
  if (!move || !board) return null;

  // Simulate the move
  const newBoard = simulateMove(board, move);
  const [toR, toC] = move.to;
  const piece = board[move.from[0]][move.from[1]];
  
  if (!piece) return null;

  // Knight fork detection
  if (piece[1] === 'N') {
    const attackedHighValue = [];
    const knightMoves = getKnightAttackSquares(toR, toC);
    
    for (const [r, c] of knightMoves) {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = newBoard[r][c];
        if (target && target[0] !== piece[0]) {
          const value = getPieceValue(target);
          if (value >= 3) { // Knight, Bishop, Rook, Queen
            attackedHighValue.push({ square: [r, c], piece: target, value });
          }
        }
      }
    }
    
    if (attackedHighValue.length >= 2) {
      return {
        type: 'fork',
        name: 'Knight Fork',
        description: `Knight attacks ${attackedHighValue.length} high-value pieces`,
        targets: attackedHighValue
      };
    }
  }

  // Pawn fork detection (simplified)
  if (piece[1] === 'P') {
    const direction = piece[0] === 'w' ? -1 : 1;
    const attacked = [];
    
    for (const dc of [-1, 1]) {
      const r = toR + direction;
      const c = toC + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = newBoard[r][c];
        if (target && target[0] !== piece[0]) {
          const value = getPieceValue(target);
          if (value >= 3) {
            attacked.push({ square: [r, c], piece: target, value });
          }
        }
      }
    }
    
    if (attacked.length >= 2) {
      return {
        type: 'fork',
        name: 'Pawn Fork',
        description: 'Pawn attacks multiple pieces',
        targets: attacked
      };
    }
  }

  return null;
};

const getKnightAttackSquares = (r, c) => {
  const offsets = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];
  return offsets.map(([dr, dc]) => [r + dr, c + dc]);
};

const getPieceValue = (piece) => {
  const values = {
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
  };
  return values[piece] || 0;
};

const generateFenKey = (board) => {
  // Simplified FEN generation for position memory lookup
  return board.map(row => 
    row.map(piece => piece || '1').join('')
  ).join('/');
};

export default { detectBlunder, detectTacticalPattern };
