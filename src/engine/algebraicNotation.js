/**
 * Converts move objects to Standard Algebraic Notation (SAN).
 */

export const moveToSAN = (board, move, isCheck, isCheckmate) => {
  if (move.type === 'castleKingside') return 'O-O' + (isCheckmate ? '#' : isCheck ? '+' : '');
  if (move.type === 'castleQueenside') return 'O-O-O' + (isCheckmate ? '#' : isCheck ? '+' : '');

  const piece = board[move.from[0]][move.from[1]];
  const type = piece[1];
  let notation = '';

  if (type !== 'P') {
    notation += type;
  }

  // Handle capture
  const isCapture = move.type === 'capture' || move.type === 'enPassant' || board[move.to[0]][move.to[1]];
  if (isCapture) {
    if (type === 'P') {
      notation += String.fromCharCode(97 + move.from[1]);
    }
    notation += 'x';
  }

  // Target square
  notation += String.fromCharCode(97 + move.to[1]);
  notation += 8 - move.to[0];

  // Promotion
  if (move.promotion) {
    notation += '=' + move.promotion.toUpperCase();
  }

  // Check/Checkmate
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }

  return notation;
};

export const squareToCoords = (square) => {
  const c = square.charCodeAt(0) - 97;
  const r = 8 - parseInt(square[1]);
  return [r, c];
};

export const coordsToSquare = (r, c) => {
  return String.fromCharCode(97 + c) + (8 - r);
};
