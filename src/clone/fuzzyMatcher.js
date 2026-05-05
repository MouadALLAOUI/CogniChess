/**
 * Fuzzy Position Matcher
 * Calculates similarity between two chess positions based on FEN with piece and positional weights.
 */

const PIECE_WEIGHTS = {
  'p': 1, 'P': 1,
  'n': 3, 'N': 3,
  'b': 3, 'B': 3,
  'r': 5, 'R': 5,
  'q': 9, 'Q': 9,
  'k': 100, 'K': 100,
  '.': 0
};

const CENTER_SQUARES = [27, 28, 35, 36]; // d4, d5, e4, e5 in 0-63 index

/**
 * Normalizes a FEN string for comparison (removes clock and move number).
 */
export const normalizeFen = (fen) => {
  if (!fen) return '';
  const parts = fen.split(' ');
  return parts.slice(0, 4).join(' ');
};

/**
 * Expands the piece placement part of a FEN to a 64-character string.
 */
const expandPlacement = (placement) => {
  let expanded = '';
  const rows = placement.split('/');
  for (const row of rows) {
    for (const char of row) {
      if (isNaN(char)) {
        expanded += char;
      } else {
        expanded += '.'.repeat(parseInt(char));
      }
    }
  }
  return expanded;
};

/**
 * Finds the king position in the expanded placement string.
 */
const findKing = (expanded, isWhite) => {
  const kingChar = isWhite ? 'K' : 'k';
  return expanded.indexOf(kingChar);
};

/**
 * Calculates similarity score (0 to 1) between two FENs with weighting.
 */
export const getPositionSimilarity = (fen1, fen2) => {
  const p1 = expandPlacement(fen1.split(' ')[0]);
  const p2 = expandPlacement(fen2.split(' ')[0]);

  if (p1.length !== 64 || p2.length !== 64) return 0;

  const k1w = findKing(p1, true);
  const k1b = findKing(p1, false);

  let totalWeight = 0;
  let matchedWeight = 0;

  for (let i = 0; i < 64; i++) {
    const char1 = p1[i];
    const char2 = p2[i];

    // Base piece weight
    let weight = PIECE_WEIGHTS[char1] || 1;

    // Positional weight: Boost center
    if (CENTER_SQUARES.includes(i)) {
      weight *= 1.5;
    }

    // Positional weight: Penalty for mismatches near kings
    const distToK1W = Math.abs(Math.floor(i / 8) - Math.floor(k1w / 8)) + Math.abs((i % 8) - (k1w % 8));
    const distToK1B = Math.abs(Math.floor(i / 8) - Math.floor(k1b / 8)) + Math.abs((i % 8) - (k1b % 8));

    if (distToK1W <= 1 || distToK1B <= 1) {
      weight *= 1.2;
    }

    totalWeight += weight;
    if (char1 === char2) {
      matchedWeight += weight;
    }
  }

  return matchedWeight / totalWeight;
};
