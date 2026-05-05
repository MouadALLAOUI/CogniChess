/**
 * Layer 1: Opening Book
 * Learns the player's favorite openings.
 */

export const buildOpeningBook = (moveHistory) => {
  const book = {};

  // Group moves by game (if moveHistory contains multiple games)
  // For simplicity, we assume moveHistory is a flat list of moves with moveNumber
  moveHistory.forEach(move => {
    if (move.moveNumber <= 15) {
      const fen = move.fen;
      const moveStr = move.notation;

      if (!book[fen]) {
        book[fen] = {};
      }

      book[fen][moveStr] = (book[fen][moveStr] || 0) + 1;
    }
  });

  return book;
};

export const getOpeningMove = (book, fen) => {
  if (!book || !book[fen]) return null;

  const moves = book[fen];
  let bestMove = null;
  let maxCount = -1;

  for (const [moveStr, count] of Object.entries(moves)) {
    if (count > maxCount) {
      maxCount = count;
      bestMove = moveStr;
    }
  }

  return bestMove;
};
