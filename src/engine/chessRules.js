/**
 * Basic Chess Rules Engine
 * Generates pseudo-legal moves for all pieces.
 */

export const PIECES = {
  wP: 'P', wN: 'N', wB: 'B', wR: 'R', wQ: 'Q', wK: 'K',
  bP: 'p', bN: 'n', bB: 'b', bR: 'r', bQ: 'q', bK: 'k'
};

export const COLORS = {
  WHITE: 'w',
  BLACK: 'b'
};

/**
 * Generates all pseudo-legal moves for a piece at a given position.
 * Does not check if the king is in check after the move.
 */
export const getPseudoLegalMoves = (board, r, c, gameState) => {
  const piece = board[r][c];
  if (!piece) return [];

  const color = piece[0];
  const type = piece[1];
  const moves = [];

  switch (type) {
    case 'P': // Pawn
      getPawnMoves(board, r, c, color, gameState, moves);
      break;
    case 'N': // Knight
      getKnightMoves(board, r, c, color, moves);
      break;
    case 'B': // Bishop
      getSlidingMoves(board, r, c, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]], moves);
      break;
    case 'R': // Rook
      getSlidingMoves(board, r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1]], moves);
      break;
    case 'Q': // Queen
      getSlidingMoves(board, r, c, color, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], moves);
      break;
    case 'K': // King
      getKingMoves(board, r, c, color, gameState, moves);
      break;
  }

  return moves;
};

const getPawnMoves = (board, r, c, color, gameState, moves) => {
  const direction = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;

  // Forward 1
  if (isWithinBoard(r + direction, c) && !board[r + direction][c]) {
    moves.push({ from: [r, c], to: [r + direction, c], type: 'normal' });
    // Forward 2
    if (r === startRow && !board[r + direction * 2][c]) {
      moves.push({ from: [r, c], to: [r + direction * 2, c], type: 'doublePawnPush' });
    }
  }

  // Captures
  for (const dc of [-1, 1]) {
    const nr = r + direction;
    const nc = c + dc;
    if (isWithinBoard(nr, nc)) {
      const target = board[nr][nc];
      if (target && target[0] !== color) {
        moves.push({ from: [r, c], to: [nr, nc], type: 'capture' });
      }
      // En Passant
      if (gameState.enPassant && gameState.enPassant[0] === nr && gameState.enPassant[1] === nc) {
        moves.push({ from: [r, c], to: [nr, nc], type: 'enPassant' });
      }
    }
  }
};

const getKnightMoves = (board, r, c, color, moves) => {
  const knightOffsets = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];

  for (const [dr, dc] of knightOffsets) {
    const nr = r + dr;
    const nc = c + dc;
    if (isWithinBoard(nr, nc)) {
      const target = board[nr][nc];
      if (!target || target[0] !== color) {
        moves.push({ from: [r, c], to: [nr, nc], type: target ? 'capture' : 'normal' });
      }
    }
  }
};

const getSlidingMoves = (board, r, c, color, directions, moves) => {
  for (const [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;
    while (isWithinBoard(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ from: [r, c], to: [nr, nc], type: 'normal' });
      } else {
        if (target[0] !== color) {
          moves.push({ from: [r, c], to: [nr, nc], type: 'capture' });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
};

const getKingMoves = (board, r, c, color, gameState, moves) => {
  const kingOffsets = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  for (const [dr, dc] of kingOffsets) {
    const nr = r + dr;
    const nc = c + dc;
    if (isWithinBoard(nr, nc)) {
      const target = board[nr][nc];
      if (!target || target[0] !== color) {
        moves.push({ from: [r, c], to: [nr, nc], type: target ? 'capture' : 'normal' });
      }
    }
  }

  // Castling - must verify: king not in check, path clear, path not attacked
  if (!gameState.inCheck) {
    const castling = gameState.castling[color];
    const row = color === COLORS.WHITE ? 7 : 0;
    const opponentColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Kingside castling
    if (castling.kingside && !board[row][5] && !board[row][6]) {
      // Verify squares e, f, g are not under attack
      let pathSafe = true;
      for (let col = 4; col <= 6; col++) {
        const testBoard = board.map(r => [...r]);
        testBoard[row][col] = color + 'K';
        const tempGameState = { ...gameState, inCheck: false };
        if (isSquareAttacked(testBoard, row, col, opponentColor, tempGameState)) {
          pathSafe = false;
          break;
        }
      }
      if (pathSafe) {
        moves.push({ from: [r, c], to: [row, 6], type: 'castleKingside' });
      }
    }
    
    // Queenside castling
    if (castling.queenside && !board[row][1] && !board[row][2] && !board[row][3]) {
      // Verify squares e, d, c are not under attack (b doesn't matter for king path)
      let pathSafe = true;
      for (let col of [4, 3, 2]) {
        const testBoard = board.map(r => [...r]);
        testBoard[row][col] = color + 'K';
        const tempGameState = { ...gameState, inCheck: false };
        if (isSquareAttacked(testBoard, row, col, opponentColor, tempGameState)) {
          pathSafe = false;
          break;
        }
      }
      if (pathSafe) {
        moves.push({ from: [r, c], to: [row, 2], type: 'castleQueenside' });
      }
    }
  }
};

/**
 * Checks if a square is attacked by any piece of the given color.
 */
const isSquareAttacked = (board, r, c, attackerColor, gameState) => {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece[0] === attackerColor) {
        const moves = getPseudoLegalMoves(board, i, j, gameState);
        if (moves.some(m => m.to[0] === r && m.to[1] === c)) {
          return true;
        }
      }
    }
  }
  return false;
};

export const isWithinBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

export const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Setup pieces
  const backRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = 'b' + backRow[i];
    board[1][i] = 'bP';
    board[6][i] = 'wP';
    board[7][i] = 'w' + backRow[i];
  }
  
  return board;
};
