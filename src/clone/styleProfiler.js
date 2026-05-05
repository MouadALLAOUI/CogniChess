/**
 * Layer 2: Style Profiler
 * Analyzes the player's general habits and preferences.
 */

export const computeStyleProfile = (moveHistory) => {
  if (!moveHistory || moveHistory.length === 0) return {};

  const profile = {
    favoriteSquares: {},
    favoritePieces: { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0 },
    castlingSide: { kingside: 0, queenside: 0 },
    aggressionScore: 0,
    exchangeScore: 0,
    centerControlScore: 0,
    avgGameLength: 0
  };

  let totalMoves = moveHistory.length;
  let captures = 0;
  let centerMoves = 0;
  let exchanges = 0; // Capture of a piece of equal or higher value

  const centerSquares = ['d4', 'd5', 'e4', 'e5'];

  moveHistory.forEach(move => {
    // Favorite Squares (destination)
    const to = move.toStr; // We'll need to ensure moveData has this
    profile.favoriteSquares[to] = (profile.favoriteSquares[to] || 0) + 1;

    // Favorite Pieces
    const pieceType = move.piece[1]; // e.g., 'P' from 'wP'
    profile.favoritePieces[pieceType]++;

    // Aggression (captures, checks)
    if (move.capturedPiece) captures++;
    if (move.wasCheck) profile.aggressionScore += 0.1;

    // Center Control
    if (centerSquares.includes(to)) centerMoves++;

    // Castling preference
    if (move.notation === 'O-O') profile.castlingSide.kingside++;
    if (move.notation === 'O-O-O') profile.castlingSide.queenside++;
  });

  // Normalize scores
  profile.aggressionScore = Math.min((captures / totalMoves) + (profile.aggressionScore / totalMoves), 1);
  profile.centerControlScore = centerMoves / totalMoves;
  
  // Normalize pieces and squares to percentages
  Object.keys(profile.favoritePieces).forEach(p => {
    profile.favoritePieces[p] /= totalMoves;
  });

  // Determine preferred castling side
  profile.preferredCastling = profile.castlingSide.kingside >= profile.castlingSide.queenside ? 'kingside' : 'queenside';

  return profile;
};
