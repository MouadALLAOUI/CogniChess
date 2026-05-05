import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from '../components/board/Board';
import Sidebar from '../components/layout/Sidebar';
import MoveHistory from '../components/game/MoveHistory';
import CapturedPieces from '../components/game/CapturedPieces';
import GameControls from '../components/game/GameControls';
import PromotionModal from '../components/board/PromotionModal';
import GameOverModal from '../components/game/GameOverModal';
import CloneInsight from '../components/clone/CloneInsight';
import PGNModal from '../components/game/PGNModal';
import { exportToPGN, downloadPGN } from '../utils/pgnManager';
import { useChessGame } from '../hooks/useChessGame';
import { useCloneBot } from '../hooks/useCloneBot';
import { useTheme } from '../hooks/useTheme';
import './ChallengePage.scss';

const ChallengePage = ({ bot, onBack, onUpdateBot, settings, onSettingsChange }) => {
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
    playerColor,
    gameMode
  } = useChessGame();

  const isFlipped = playerColor === 'b';
  const gameCompletedRef = useRef(false);
  const { boardTheme, pieceTheme } = useTheme(settings, onSettingsChange);

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

  // Update bot stats at end of game
  useEffect(() => {
    if ((gameStatus === 'checkmate' || gameStatus === 'stalemate') && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      const updatedBot = { ...bot };

      if (gameStatus === 'checkmate') {
        if (turn === playerColor) updatedBot.wins += 1;
        else updatedBot.losses += 1;
      } else {
        updatedBot.draws += 1;
      }

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

  const getEndGameStats = () => {
    if (!history.length) return "";
    const botMoves = history.filter(m => m.turn === 'b').length;
    // In a real scenario, we'd track source per move, for now we can estimate or show total
    return `${bot.name} analyzed ${botMoves} positions during this match.`;
  };

  return (
    <div className="challenge-page">
      <div className="game-layout">
        <div className="game-area">
          <div className="game-area-header">
            <button className="back-btn" onClick={onBack}>← Back to Home</button>
            <div className="challenge-info">Challenging: <strong>{bot.name}</strong></div>
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
            <PGNExport 
              history={history} 
              playerColor={playerColor} 
              bot={bot} 
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
        footerText={getEndGameStats()}
        onRestart={resetGame}
        onHome={onBack}
      />
    </div>
  );
};

export default ChallengePage;
