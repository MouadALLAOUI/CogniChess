import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Board from '../components/board/Board';
import MoveHistory from '../components/game/MoveHistory';
import CapturedPieces from '../components/game/CapturedPieces';
import GameControls from '../components/game/GameControls';
import PromotionModal from '../components/board/PromotionModal';
import GameOverModal from '../components/game/GameOverModal';
import GameAnalysisModal from '../components/game/GameAnalysisModal';
import BlunderToast from '../components/game/BlunderToast';
import PGNModal from '../components/game/PGNModal';
import CloneInsight from '../components/clone/CloneInsight';
import CloneProgress from '../components/clone/CloneProgress';
import StyleDNA from '../components/clone/StyleDNA';
import ParticleEffects from '../components/effects/ParticleEffects';
import BoardAnnotations from '../components/board/BoardAnnotations';
import { useChessGame } from '../hooks/useChessGame';
import { useCloneBot } from '../hooks/useCloneBot';
import { recordMove } from '../clone/learnFromGame';
import { computeStyleProfile } from '../clone/styleProfiler';
import { buildOpeningBook } from '../clone/openingBook';
import { buildPositionMemory } from '../clone/positionMemory';
import { boardToFen } from '../engine/fenParser';
import { getGamePhase } from '../engine/gamePhase';
import { coordsToSquare } from '../engine/algebraicNotation';
import { exportToPGN, downloadPGN, validatePGN, importFromPGN } from '../utils/pgnManager';
import { useTheme } from '../hooks/useTheme';
import { detectBlunder } from '../clone/blunderDetector';
import { computeAccuracy, findBestMove, findBiggestMistake, generateHeatmapData } from '../utils/gameAnalysis';
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
    playerColor,
    gameMode
  } = useChessGame();

  const [isFlipped, setIsFlipped] = useState(playerColor === 'b');
  const [isPGNModalOpen, setIsPGNModalOpen] = useState(false);
  const [blunder, setBlunder] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [gameAnalysis, setGameAnalysis] = useState(null);
  const [annotationMode, setAnnotationMode] = useState(null);
  const [annotations, setAnnotations] = useState({ arrows: [], circles: [] });
  const [lastRecordedMoveKey, setLastRecordedMoveKey] = useState(null);
  const [cloneRecommendedMove, setCloneRecommendedMove] = useState(null);
  const [captureEffect, setCaptureEffect] = useState({ show: false, position: null });
  const [showCinematic, setShowCinematic] = useState(false);
  
  const lastRecordedMoveRef = useRef(null);
  const gameCompletedRef = useRef(false);
  const boardRef = useRef(null);
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

  // Store clone's recommended move for blunder detection
  useEffect(() => {
    if (lastBotDecision?.move) {
      setCloneRecommendedMove(lastBotDecision.move);
    }
  }, [lastBotDecision]);

  // Blunder detection after player moves
  useEffect(() => {
    if (turn !== playerColor && lastMove && !lastMove.isBot && cloneRecommendedMove) {
      const moveKey = `${lastMove.from}-${lastMove.to}-${history.length}`;
      if (lastRecordedMoveRef.current === moveKey) return;
      lastRecordedMoveRef.current = moveKey;

      // Detect blunder
      const positionMemory = bot.cloneData?.positionMemory || {};
      const styleProfile = bot.cloneData?.styleProfile || {};
      
      const blunderResult = detectBlunder(
        lastMove,
        cloneRecommendedMove,
        positionMemory,
        styleProfile,
        board
      );

      if (blunderResult) {
        setBlunder(blunderResult);
      }

      // Learning logic
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

  // Game analysis on game end
  useEffect(() => {
    if ((gameStatus === 'checkmate' || gameStatus === 'stalemate') && !showAnalysis) {
      const accuracy = computeAccuracy(history, gameStatus === 'checkmate' ? (turn !== playerColor ? 'win' : 'loss') : 'draw');
      const bestMove = findBestMove(history);
      const biggestMistake = findBiggestMistake(history);
      const heatmap = generateHeatmapData(history, playerColor);

      setGameAnalysis({
        accuracy,
        bestMove,
        biggestMistake,
        heatmap
      });
      
      // Trigger cinematic effect for checkmate
      if (gameStatus === 'checkmate') {
        setShowCinematic(true);
        setTimeout(() => {
          setShowAnalysis(true);
        }, 2000);
      } else {
        setShowAnalysis(true);
      }
    }

    if (gameStatus === 'active') {
      setShowAnalysis(false);
      setShowCinematic(false);
      gameCompletedRef.current = false;
    }
  }, [gameStatus, history, playerColor, turn]);

  // Capture effect detection
  useEffect(() => {
    if (lastMove && lastMove.capturedPiece) {
      const [toR, toC] = lastMove.to;
      const squareSize = 600 / 8; // Assuming 600px board
      setCaptureEffect({
        show: true,
        position: {
          x: toC * squareSize + squareSize / 2,
          y: toR * squareSize + squareSize / 2
        }
      });

      setTimeout(() => {
        setCaptureEffect({ show: false, position: null });
      }, 400);
    }
  }, [lastMove]);

  const handleSquareClick = (r, c, move) => {
    if (move) {
      executeMove(move);
    } else {
      selectPiece(r, c);
    }
  };

  const handleShowRecommendedMove = (recommendedMove) => {
    // Highlight the recommended move square
    const square = document.querySelector(`[data-square="${recommendedMove.to[0]}-${recommendedMove.to[1]}"]`);
    if (square) {
      square.classList.add('recommended-move');
      setTimeout(() => {
        square.classList.remove('recommended-move');
      }, 2000);
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
            ref={boardRef}
          />
          
          {/* Board Annotations Overlay */}
          <BoardAnnotations
            boardRef={boardRef}
            isActive={annotationMode !== null}
            mode={annotationMode}
            onAnnotationsChange={(newAnnotations) => setAnnotations(newAnnotations)}
          />
        </div>

        <aside className="game-sidebar">
          <div className="sidebar-top">
            <CloneProgress gamesPlayed={bot.gamesPlayed} />
          </div>
          <div className="sidebar-top">
            <StyleDNA 
              styleProfile={bot.cloneData?.styleProfile || {}} 
              gamesPlayed={bot.gamesPlayed} 
            />
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
              onExportPGN={() => setIsPGNModalOpen(true)}
              onToggleAnnotation={(mode) => setAnnotationMode(mode)}
              annotationMode={annotationMode}
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
        onRestart={resetGame}
        onHome={onBack}
      />

      <GameAnalysisModal
        isOpen={showAnalysis}
        analysis={gameAnalysis}
        onClose={() => setShowAnalysis(false)}
        onRestart={resetGame}
        onHome={onBack}
      />

      <BlunderToast
        blunder={blunder}
        onShow={handleShowRecommendedMove}
        onClose={() => setBlunder(null)}
      />

      <PGNModal
        isOpen={isPGNModalOpen}
        onClose={() => setIsPGNModalOpen(false)}
        pgnData={exportToPGN(history, gameStatus, 'Player', bot?.name || 'Bot')}
        onExport={() => downloadPGN(exportToPGN(history, gameStatus, 'Player', bot?.name || 'Bot'))}
        onImport={(pgnText) => {
          const validation = validatePGN(pgnText);
          if (validation.valid) {
            const imported = importFromPGN(pgnText);
            console.log('Imported PGN:', imported);
            return true;
          } else {
            console.error('Invalid PGN:', validation.error);
            return false;
          }
        }}
      />

      {/* Particle Effects */}
      <ParticleEffects
        showCaptureSparkles={captureEffect.show}
        capturePosition={captureEffect.position}
        showKingGlow={gameStatus === 'check'}
        showConfetti={gameStatus === 'checkmate'}
        effectsEnabled={settings.effectsEnabled !== false}
      />

      {/* Cinematic Overlay */}
      <div className={`cinematic-overlay ${showCinematic ? 'active' : ''}`} />
    </div>
  );
};

export default TrainingPage;
