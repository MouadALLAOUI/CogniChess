import React, { useMemo } from 'react';
import { getHeatmapColor } from '../../utils/gameAnalysis';
import './GameAnalysisModal.scss';

const GameAnalysisModal = ({ isOpen, analysis, onClose, onRestart, onHome }) => {
  const heatmapColors = useMemo(() => {
    if (!analysis?.heatmap) return null;
    
    const maxValue = Math.max(...analysis.heatmap.flat());
    return analysis.heatmap.map(row => 
      row.map(value => getHeatmapColor(value, maxValue))
    );
  }, [analysis]);

  if (!isOpen || !analysis) return null;

  const accuracyPercent = analysis.accuracy || 0;
  const accuracyColor = accuracyPercent >= 80 ? '#4CAF50' : 
                        accuracyPercent >= 60 ? '#FF9800' : '#f44336';

  return (
    <div className="game-analysis-modal">
      <div className="game-analysis-modal__overlay" onClick={onClose}></div>
      <div className="game-analysis-modal__content">
        <div className="game-analysis-modal__header">
          <h2 className="game-analysis-modal__title">Game Analysis</h2>
          <button className="game-analysis-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="game-analysis-modal__body">
          {/* Accuracy Gauge */}
          <div className="analysis-section">
            <h3 className="analysis-section__title">Accuracy</h3>
            <div className="accuracy-gauge">
              <div className="accuracy-gauge__circle" style={{ '--accuracy': accuracyPercent }}>
                <svg viewBox="0 0 100 100">
                  <circle className="accuracy-gauge__bg" cx="50" cy="50" r="45" />
                  <circle 
                    className="accuracy-gauge__fill" 
                    cx="50" 
                    cy="50" 
                    r="45"
                    stroke={accuracyColor}
                  />
                </svg>
                <div className="accuracy-gauge__value" style={{ color: accuracyColor }}>
                  {accuracyPercent}%
                </div>
              </div>
              <p className="accuracy-gauge__label">
                {accuracyPercent >= 80 ? 'Excellent!' : 
                 accuracyPercent >= 60 ? 'Good effort' : 'Keep practicing'}
              </p>
            </div>
          </div>

          {/* Best Move */}
          {analysis.bestMove && (
            <div className="analysis-section">
              <h3 className="analysis-section__title">Best Move</h3>
              <div className="move-highlight">
                <span className="move-highlight__notation">{analysis.bestMove.notation}</span>
                <span className="move-highlight__desc">
                  Move {analysis.bestMove.moveNumber} - Gained {analysis.bestMove.score} material
                </span>
              </div>
            </div>
          )}

          {/* Biggest Mistake */}
          {analysis.biggestMistake && (
            <div className="analysis-section">
              <h3 className="analysis-section__title">Biggest Mistake</h3>
              <div className="move-highlight move-highlight--mistake">
                <span className="move-highlight__notation">{analysis.biggestMistake.notation}</span>
                <span className="move-highlight__desc">
                  Move {analysis.biggestMistake.moveNumber} - Lost {analysis.biggestMistake.materialLost} material
                </span>
              </div>
            </div>
          )}

          {/* Heatmap */}
          {heatmapColors && (
            <div className="analysis-section">
              <h3 className="analysis-section__title">Piece Activity Heatmap</h3>
              <div className="activity-heatmap">
                {heatmapColors.map((row, rIndex) => (
                  <div key={rIndex} className="heatmap-row">
                    {row.map((color, cIndex) => (
                      <div 
                        key={cIndex} 
                        className="heatmap-square"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="game-analysis-modal__footer">
          <button className="action-btn restart" onClick={onRestart}>
            Play Again
          </button>
          <button className="action-btn home" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameAnalysisModal;
