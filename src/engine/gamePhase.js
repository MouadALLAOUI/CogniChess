/**
 * Detects the current phase of the chess game.
 */

export const getGamePhase = (board, fullMoveNumber) => {
  if (fullMoveNumber <= 10) return 'opening';

  let totalPieces = 0;
  let queensCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        totalPieces++;
        if (piece[1] === 'Q') queensCount++;
      }
    }
  }

  // End game if no queens, or if only a few pieces remain
  if (queensCount === 0 || totalPieces <= 10) {
    return 'endgame';
  }

  return 'middlegame';
};
