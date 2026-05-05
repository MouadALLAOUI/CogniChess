import { useMemo } from 'react';
import classicBoard from '../assets/themes/boards/classic';
import marbleBoard from '../assets/themes/boards/marble';
import woodenPieces from '../assets/themes/pieces/wooden';
import metalPieces from '../assets/themes/pieces/metal';

const BOARDS = {
  classic: classicBoard,
  marble: marbleBoard
};

const PIECES = {
  wooden: woodenPieces,
  metal: metalPieces
};

export const useTheme = (settings, onSettingsChange) => {
  const boardTheme = useMemo(() => BOARDS[settings.boardTheme] || BOARDS.classic, [settings.boardTheme]);
  const pieceTheme = useMemo(() => PIECES[settings.pieceTheme] || PIECES.wooden, [settings.pieceTheme]);

  const setBoardTheme = (themeId) => {
    onSettingsChange(prev => ({ ...prev, boardTheme: themeId }));
  };

  const setPieceTheme = (themeId) => {
    onSettingsChange(prev => ({ ...prev, pieceTheme: themeId }));
  };

  return {
    boardTheme,
    pieceTheme,
    setBoardTheme,
    setPieceTheme,
    allBoards: Object.values(BOARDS),
    allPieces: Object.values(PIECES)
  };
};
