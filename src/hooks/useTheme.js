import { useMemo } from 'react';
import classicBoard from '../assets/themes/boards/classic';
import marbleBoard from '../assets/themes/boards/marble';
import greenBoard from '../assets/themes/boards/green';
import blueBoard from '../assets/themes/boards/blue';
import greyBoard from '../assets/themes/boards/grey';
import woodenPieces from '../assets/themes/pieces/wooden';
import metalPieces from '../assets/themes/pieces/metal';
import neoPieces from '../assets/themes/pieces/neo';
import pixelPieces from '../assets/themes/pieces/pixel';

const BOARDS = {
  classic: classicBoard,
  marble: marbleBoard,
  green: greenBoard,
  blue: blueBoard,
  grey: greyBoard
};

const PIECES = {
  wooden: woodenPieces,
  metal: metalPieces,
  neo: neoPieces,
  pixel: pixelPieces
};

export const useTheme = (settings, onSettingsChange) => {
  const boardTheme = useMemo(() => BOARDS[settings?.boardTheme || 'classic'] || BOARDS.classic, [settings?.boardTheme]);
  const pieceTheme = useMemo(() => PIECES[settings?.pieceTheme || 'wooden'] || PIECES.wooden, [settings?.pieceTheme]);

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
