import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Board from '../components/board/Board';
import Sidebar from '../components/layout/Sidebar';
import MoveHistory from '../components/game/MoveHistory';
import CapturedPieces from '../components/game/CapturedPieces';
import GameControls from '../components/game/GameControls';
import PromotionModal from '../components/board/PromotionModal';
import GameOverModal from '../components/game/GameOverModal';
import CloneInsight from '../components/clone/CloneInsight';
import CloneProgress from '../components/clone/CloneProgress';
import { useChessGame } from '../hooks/useChessGame';
import { useCloneBot } from '../hooks/useCloneBot';
import { recordMove } from '../clone/learnFromGame';
import { computeStyleProfile } from '../clone/styleProfiler';
import { buildOpeningBook } from '../clone/openingBook';
import { buildPositionMemory } from '../clone/positionMemory';
import { boardToFen } from '../engine/fenParser';
import { getGamePhase } from '../engine/gamePhase';
import { coordsToSquare } from '../engine/algebraicNotation';
import { useTheme } from '../hooks/useTheme';
import './TrainingPage.scss';

const TrainingPage = ({ bot, onBack, onUpdateBot, settings, onSettingsChange }) => {
  const {
    board,
    turn,
    selectedSquare,
    legalMoves,
    history,
    capturedPieces,
    gameStatus,
    lastMove,
    pendingPromotion,
    selectPiece,
    executeMove,
    promotePawn,
    undoMove,
    resetGame,
    playerColor
  } = useChessGame();

  const [isFlipped, setIsFlipped] = useState(playerColor === 'b');
  const lastRecordedMoveRef = useRef(null);
  const gameCompletedRef = useRef(false);
  const { boardTheme, pieceTheme } = useTheme(settings, onSettingsChange);

  // Sync flip state with player color changes
  useEffect(() => {
    setIsFlipped(playerColor === 'b');
  }, [playerColor]);

  const handleBotMove = useCallback((move) => {
    executeMove({ ...move, isBot: true });
  }, [executeMove]);

  const { lastBotDecision, isThinking } = useCloneBot(
    board,
    turn,
    gameStatus,
    bot,
    handleBotMove,
    playerColor
  );

  // Effect to handle learning when player moves (opposite of bot turn)
  useEffect(() => {
    if (turn !== playerColor && lastMove && !lastMove.isBot) {
      // Player just moved, now bot's turn starts
      const moveKey = `${lastMove.from}-${lastMove.to}-${history.length}`;
      if (lastRecordedMoveRef.current === moveKey) return;
      lastRecordedMoveRef.current = moveKey;

      const moveData = {
        moveNumber: Math.ceil(history.length / 2),
        phase: getGamePhase(board, Math.ceil(history.length / 2)),
        piece: board[lastMove.to[0]][lastMove.to[1]],
        from: lastMove.from,
        to: lastMove.to,
        toStr: coordsToSquare(lastMove.to[0], lastMove.to[1]),
        fen: boardToFen(board, playerColor, { w: { kingside: true, queenside: true }, b: { kingside: true, queenside: true } }, null, 0, 1),
        notation: history[history.length - 1].notation,
        capturedPiece: lastMove.capturedPiece,
        wasCheck: gameStatus === 'check',
      };

      const updatedBot = recordMove(bot, moveData);
      onUpdateBot(updatedBot);
    }
  }, [turn, lastMove, history, bot, onUpdateBot, board, gameStatus]);

  // Effect to handle end of game learning
  useEffect(() => {
    if ((gameStatus === 'checkmate' || gameStatus === 'stalemate') && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      const updatedBot = { ...bot };
      updatedBot.gamesPlayed += 1;

      if (gameStatus === 'checkmate') {
        if (turn === playerColor) updatedBot.wins += 1;
        else updatedBot.losses += 1;
      } else {
        updatedBot.draws += 1;
      }

      const historyData = updatedBot.cloneData.moveHistory;
      updatedBot.cloneData.styleProfile = computeStyleProfile(historyData);
      updatedBot.cloneData.openingBook = buildOpeningBook(historyData);
      updatedBot.cloneData.positionMemory = buildPositionMemory(historyData);

      onUpdateBot(updatedBot);
    }

    if (gameStatus === 'active') {
      gameCompletedRef.current = false;
    }
  }, [gameStatus, bot, onUpdateBot, turn]);

  const handleSquareClick = (r, c, move) => {
    if (move) {
      executeMove(move);
    } else {
      selectPiece(r, c);
    }
  };

  return (
    <div className="training-page">
      <div className="game-layout">
        <div className="game-area">
          <div className="game-area-header">
            <button className="back-btn" onClick={onBack}>← Back to Home</button>
            <div className="training-info">Training: <strong>{bot.name}</strong></div>
          </div>

          <CloneInsight
            decision={lastBotDecision}
            isThinking={isThinking}
            botName={bot.name}
          />

          <Board
            board={board}
            turn={turn}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            gameStatus={gameStatus}
            onSquareClick={handleSquareClick}
            boardTheme={boardTheme}
            pieceTheme={pieceTheme}
            isFlipped={isFlipped}
            showCoordinates={settings.showCoordinates}
            moveArrow={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
          />
        </div>

        <aside className="game-sidebar">
          <div className="sidebar-top">
            <CloneProgress gamesPlayed={bot.gamesPlayed} />
          </div>
          <div className="sidebar-top">
            <CapturedPieces captured={capturedPieces} />
          </div>
          <div className="sidebar-middle">
            <MoveHistory history={history} />
          </div>
          <div className="sidebar-bottom">
            <GameControls
              onUndo={undoMove}
              onNewGame={resetGame}
              onResign={onBack}
              onFlipBoard={() => setIsFlipped(!isFlipped)}
            />
          </div>
        </aside>
      </div>

      <PromotionModal
        isOpen={!!pendingPromotion}
        color={turn}
        onPromote={promotePawn}
      />

      <GameOverModal
        isOpen={gameStatus === 'checkmate' || gameStatus === 'stalemate'}
        result={gameStatus === 'checkmate' ? 'Checkmate' : 'Stalemate'}
        winner={gameStatus === 'checkmate' ? (turn === 'w' ? 'Black' : 'White') : null}
      />
    </div>
  );
};

export default TrainingPage;
