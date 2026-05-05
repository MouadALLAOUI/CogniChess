/**
 * PGN (Portable Game Notation) Manager for Chess
 * Handles import/export of chess games in PGN format
 */

import { algebraicToCoords, coordsToAlgebraic } from '../engine/algebraicNotation';

/**
 * Convert game state to PGN string
 */
export const exportToPGN = (history, gameStatus, whitePlayer = '', blackPlayer = '', event = 'Chess Clone Game', site = '', date = new Date().toISOString().split('T')[0], round = '1') => {
  const moves = [];
  let currentMove = '';
  let moveNumber = 1;
  
  history.forEach((move, index) => {
    const isWhite = index % 2 === 0;
    
    if (isWhite) {
      currentMove = `${moveNumber}. ${move.notation}`;
    } else {
      currentMove += ` ${move.notation}`;
      moves.push(currentMove);
      currentMove = '';
      moveNumber++;
    }
  });
  
  // Add last move if incomplete
  if (currentMove) {
    moves.push(currentMove);
  }
  
  // Build PGN header
  const headers = [
    `[Event "${event}"]`,
    `[Site "${site}"]`,
    `[Date "${date}"]`,
    `[Round "${round}"]`,
    `[White "${whitePlayer}"]`,
    `[Black "${blackPlayer}"]`,
    `[Result "${gameStatus === 'checkmate' ? (history.length % 2 === 0 ? '0-1' : '1-0') : gameStatus === 'stalemate' ? '1/2-1/2' : '*'}"]`
  ];
  
  // Combine headers and moves
  return headers.join('\n') + '\n\n' + moves.join(' ');
};

/**
 * Parse PGN string and extract moves and metadata
 */
export const importFromPGN = (pgnString) => {
  const lines = pgnString.trim().split('\n');
  const headers = {};
  const movesText = [];
  let inMoves = false;
  
  // Parse headers and moves
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      inMoves = true;
      return;
    }
    
    if (!inMoves) {
      // Parse header: [Key "Value"]
      const headerMatch = trimmed.match(/^\[(\w+)\s+"([^"]*)"\]$/);
      if (headerMatch) {
        headers[headerMatch[1]] = headerMatch[2];
      }
    } else {
      movesText.push(trimmed);
    }
  });
  
  // Parse moves
  const movesTextCombined = movesText.join(' ');
  const moves = [];
  
  // Remove move numbers and split
  const moveTokens = movesTextCombined
    .replace(/\d+\./g, '') // Remove move numbers
    .replace(/\{[^}]*\}/g, '') // Remove comments
    .replace(/\$[0-9]+/g, '') // Remove NAG symbols
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(token => token && !['*', '1-0', '0-1', '1/2-1/2'].includes(token));
  
  // Convert to move objects
  moveTokens.forEach((notation, index) => {
    moves.push({
      notation,
      isWhite: index % 2 === 0
    });
  });
  
  return {
    headers,
    moves,
    whitePlayer: headers.White || '',
    blackPlayer: headers.Black || '',
    event: headers.Event || '',
    site: headers.Site || '',
    date: headers.Date || '',
    result: headers.Result || '*'
  };
};

/**
 * Validate PGN string format
 */
export const validatePGN = (pgnString) => {
  try {
    const result = importFromPGN(pgnString);
    return {
      valid: true,
      moveCount: result.moves.length,
      headers: result.headers
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Download PGN as file
 */
export const downloadPGN = (pgnString, filename = 'chess_game.pgn') => {
  const blob = new Blob([pgnString], { type: 'application/x-chess-pgn' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Read PGN from file input
 */
export const readPGNFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = importFromPGN(e.target.result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export default {
  exportToPGN,
  importFromPGN,
  validatePGN,
  downloadPGN,
  readPGNFromFile
};
