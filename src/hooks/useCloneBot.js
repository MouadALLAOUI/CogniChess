import { useState, useEffect, useCallback } from 'react';
import { decideMove } from '../clone/cloneDecision';
import { boardToFen } from '../engine/fenParser';
import { getLegalMoves } from '../engine/moveValidator';
import { COLORS } from '../engine/chessRules';

export const useCloneBot = (board, turn, gameStatus, bot, onMove, playerColor, learningEnabled = true) => {
  const [lastBotDecision, setLastBotDecision] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    // Only move if it's the bot's turn (opposite of playerColor) and the game is active
    if (turn !== playerColor && gameStatus !== 'checkmate' && gameStatus !== 'stalemate' && bot) {
      setIsThinking(true);

      const timer = setTimeout(() => {
        const fen = boardToFen(board, turn, { w: { kingside: true, queenside: true }, b: { kingside: true, queenside: true } }, null, 0, 1);

        // Get all legal moves for the current turn (Bot's color)
        const allLegalMoves = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === turn) {
              allLegalMoves.push(...getLegalMoves(board, r, c, { turn, castling: { w: { kingside: true, queenside: true }, b: { kingside: true, queenside: true } } }));
            }
          }
        }

        const decision = decideMove(board, fen, allLegalMoves, bot.cloneData, bot.gamesPlayed);

        if (decision) {
          setLastBotDecision({ move: decision, label: decision.label });
          onMove(decision);
        }

        setIsThinking(false);
      }, 600); // 600ms delay for "thinking" effect

      return () => clearTimeout(timer);
    }
  }, [turn, gameStatus, bot, board, onMove, playerColor]);

  return { lastBotDecision, isThinking, learningEnabled };
};
