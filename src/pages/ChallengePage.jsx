import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from '../components/board/Board';
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

const LEARNING_ENABLED = false;

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

  const [isFlipped, setIsFlipped] = useState(playerColor === 'b');
  const gameCompletedRef = useRef(false);
  const { boardTheme, pieceTheme } = useTheme(settings, onSettingsChange);

  const handleBotMove = useCallback((move) => {
    executeMove({ ...move, isBot: true });
  }, [executeMove]);

  const { lastBotDecision, isThinking, learningEnabled } = useCloneBot(
    board,
    turn,
    gameStatus,
    bot,
    handleBotMove,
    playerColor,
    LEARNING_ENABLED
  );

  // Update bot stats at end of game (no learning in Challenge mode)
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

      // No style profile recomputation in Challenge mode
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
    
    // Analyze moves by source (memory, opening, style)
    const memoryMoves = history.filter(m => m.source === 'memory').length;
    const openingMoves = history.filter(m => m.source === 'opening').length;
    const styleMoves = history.filter(m => m.source === 'style').length;
    
    return `${bot.name} analyzed ${botMoves} positions. Memory: ${memoryMoves}, Opening: ${openingMoves}, Style: ${styleMoves}`;
  };

  // Calculate estimated ELO based on games played and win rate
  const estimatedElo = React.useMemo(() => {
    if (bot.gamesPlayed === 0) return 'Unrated';
    const winRate = bot.wins / bot.gamesPlayed;
    const baseElo = 800;
    const eloGain = Math.min(400, bot.gamesPlayed * 10);
    const eloFromWins = Math.round(winRate * 400);
    return baseElo + eloGain + eloFromWins;
  }, [bot.gamesPlayed, bot.wins]);

  return (
    <div className="challenge-page">
      <div className="game-layout">
        <div className="game-area">
          <div className="game-area-header">
            <button className="back-btn" onClick={onBack}>← Back to Home</button>
            <div className="challenge-info">
              <span className="mode-badge challenge-badge">⚔️ Challenge Mode</span>
              <strong>{bot.name}</strong>
              {estimatedElo !== 'Unrated' && (
                <span className="elo-rating">ELO: ~{estimatedElo}</span>
              )}
            </div>
          </div>

          <CloneInsight
            decision={lastBotDecision}
            isThinking={isThinking}
            botName={bot.name}
            showExplanation={false}
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
          <div className="sidebar-section">
            <CapturedPieces captured={capturedPieces} />
          </div>
          <div className="sidebar-section sidebar-middle">
            <MoveHistory history={history} />
          </div>
          <div className="sidebar-section sidebar-bottom">
            <GameControls
              onUndo={undoMove}
              onNewGame={resetGame}
              onResign={onBack}
              onFlipBoard={() => setIsFlipped(!isFlipped)}
              onExportPGN={() => {}}
            />
            <PGNModal
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
