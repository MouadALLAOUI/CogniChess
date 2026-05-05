// src/utils/pgn.js

/**
 * Converts board coordinates to algebraic notation (e.g., [6, 0] -> "a2")
 */
const toAlgebraic = (row, col) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  return `${files[col]}${ranks[row]}`;
};

/**
 * Generates a PGN string from game history.
 * @param {Array} history - Array of move objects with properties: piece, from, to, captured, promotion, check, checkmate
 * @param {Object} metadata - Game info like White, Black, Date, Event
 * @returns {string} PGN formatted string
 */
export const generatePGN = (history, metadata = {}) => {
  const tags = {
    Event: metadata.event || 'Casual Game',
    Site: metadata.site || 'Chess Clone App',
    Date: metadata.date || new Date().toISOString().split('T')[0],
    Round: metadata.round || '?',
    White: metadata.white || 'Player',
    Black: metadata.black || 'Opponent',
    Result: metadata.result || '*'
  };

  let pgn = '';
  
  // Add Tags
  for (const [key, value] of Object.entries(tags)) {
    pgn += `[${key} "${value}"]\n`;
  }
  pgn += '\n';

  // Generate Moves
  let moveText = '';
  let moveNumber = 1;
  
  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const isWhite = i % 2 === 0;
    
    if (isWhite) {
      moveText += `${moveNumber}. `;
    } else {
      moveText += ' ';
    }

    let notation = '';
    
    // Piece letter (except pawn)
    if (move.piece[1] !== 'P') {
      notation += move.piece[1];
    }

    // Capture
    if (move.captured || move.type === 'enPassant') {
      if (move.piece[1] === 'P') {
        notation += toAlgebraic(move.from[0], move.from[1])[0]; // File of departure
      }
      notation += 'x';
    }

    // Destination
    notation += toAlgebraic(move.to[0], move.to[1]);

    // Promotion
    if (move.promotion) {
      notation += '=' + move.promotion.toUpperCase();
    }

    // Check / Checkmate
    if (move.checkmate) {
      notation += '#';
    } else if (move.check) {
      notation += '+';
    }

    // Castling special notation
    if (move.type === 'castleKingside') {
      notation = 'O-O';
      if (move.checkmate) notation += '#';
      else if (move.check) notation += '+';
    } else if (move.type === 'castleQueenside') {
      notation = 'O-O-O';
      if (move.checkmate) notation += '#';
      else if (move.check) notation += '+';
    }

    moveText += notation;

    if (!isWhite) {
      moveNumber++;
      // Add new line every 4 full moves for readability
      if (moveNumber % 4 === 1 && i < history.length - 1) {
        moveText += '\n';
      }
    }
  }

  pgn += moveText;
  return pgn;
};

/**
 * Parses a PGN string into a structured object.
 * Note: This is a basic parser. For complex PGNs, consider using a library like 'chess.js'.
 * @param {string} pgn 
 * @returns {Object} { tags: {}, moves: [] }
 */
export const parsePGN = (pgn) => {
  const lines = pgn.split('\n');
  const tags = {};
  const moves = [];
  let moveSection = false;
  let moveBuffer = '';

  // Parse Tags
  for (const line of lines) {
    if (line.startsWith('[') && line.endsWith(']')) {
      const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
      if (match) {
        tags[match[1]] = match[2];
      }
    } else if (line.trim() !== '') {
      moveSection = true;
      moveBuffer += ' ' + line;
    }
  }

  if (!moveSection) return { tags, moves };

  // Parse Moves (Simplified: splits by space and numbers)
  const cleanMoves = moveBuffer.replace(/\d+\./g, '').trim().split(/\s+/);
  
  let turn = 'w'; // Start with white
  
  for (const moveStr of cleanMoves) {
    if (!moveStr || moveStr === '*') break;
    
    moves.push({
      san: moveStr,
      turn: turn
    });
    
    turn = turn === 'w' ? 'b' : 'w';
  }

  return { tags, moves };
};

/**
 * Downloads the PGN as a file
 */
export const downloadPGN = (pgnContent, filename = 'game.pgn') => {
  const blob = new Blob([pgnContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
