/**
 * FEN Parser for Chess Board State
 */

const PIECE_TO_CHAR = {
  wP: 'P', wN: 'N', wB: 'B', wR: 'R', wQ: 'Q', wK: 'K',
  bP: 'p', bN: 'n', bB: 'b', bR: 'r', bQ: 'q', bK: 'k'
};

const CHAR_TO_PIECE = Object.fromEntries(
  Object.entries(PIECE_TO_CHAR).map(([k, v]) => [v, k])
);

export const boardToFen = (board, turn, castling, enPassant, halfMoveClock, fullMoveNumber) => {
  let fen = '';

  // 1. Piece placement
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += PIECE_TO_CHAR[piece];
      } else {
        empty++;
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += '/';
  }

  // 2. Active color
  fen += ` ${turn}`;

  // 3. Castling availability
  let castlingStr = '';
  if (castling.w.kingside) castlingStr += 'K';
  if (castling.w.queenside) castlingStr += 'Q';
  if (castling.b.kingside) castlingStr += 'k';
  if (castling.b.queenside) castlingStr += 'q';
  fen += ` ${castlingStr || '-'}`;

  // 4. En passant target square
  if (enPassant) {
    const square = `${String.fromCharCode(97 + enPassant[1])}${8 - enPassant[0]}`;
    fen += ` ${square}`;
  } else {
    fen += ' -';
  }

  // 5. Halfmove clock
  fen += ` ${halfMoveClock}`;

  // 6. Fullmove number
  fen += ` ${fullMoveNumber}`;

  return fen;
};

export const fenToBoard = (fen) => {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const char of rows[r]) {
      if (isNaN(char)) {
        board[r][c] = CHAR_TO_PIECE[char];
        c++;
      } else {
        c += parseInt(char);
      }
    }
  }

  const turn = parts[1];
  
  const castlingStr = parts[2];
  const castling = {
    w: { kingside: castlingStr.includes('K'), queenside: castlingStr.includes('Q') },
    b: { kingside: castlingStr.includes('k'), queenside: castlingStr.includes('q') }
  };

  const epStr = parts[3];
  let enPassant = null;
  if (epStr !== '-') {
    enPassant = [8 - parseInt(epStr[1]), epStr.charCodeAt(0) - 97];
  }

  const halfMoveClock = parseInt(parts[4]);
  const fullMoveNumber = parseInt(parts[5]);

  return { board, turn, castling, enPassant, halfMoveClock, fullMoveNumber };
};
