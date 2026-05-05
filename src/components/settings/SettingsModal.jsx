import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faVolumeHigh, faVolumeXmark, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../hooks/useTheme';
import soundManager from '../../utils/soundManager';
import './SettingsModal.scss';

const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange, onResetBot }) => {
  const { allBoards, allPieces, boardTheme, pieceTheme, setBoardTheme, setPieceTheme } = useTheme(settings, onSettingsChange);

  if (!isOpen) return null;

  const updateSetting = (key, value) => {
    onSettingsChange(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset this clone's memory? This cannot be undone.")) {
      onResetBot();
    }
  };

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    updateSetting('soundVolume', volume);
    soundManager.setVolume(volume);
  };

  // Initialize sound manager on first open
  React.useEffect(() => {
    if (!isOpen) return;
    
    soundManager.init();
    soundManager.setEnabled(settings.soundEnabled);
    soundManager.setVolume(settings.soundVolume);
  }, [isOpen, settings.soundEnabled, settings.soundVolume]);

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="settings-modal animate-slide-up">
        <header className="modal-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="modal-body">
          <section className="settings-section">
            <h4>Board Theme</h4>
            <div className="theme-grid">
              {allBoards.map(theme => (
                <div 
                  key={theme.id} 
                  className={`theme-card ${settings.boardTheme === theme.id ? 'active' : ''}`}
                  onClick={() => setBoardTheme(theme.id)}
                >
                  <div className="preview-board">
                    {[0, 1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className="sq" 
                        style={{ backgroundColor: (i + Math.floor(i/2)) % 2 === 0 ? theme.light : theme.dark }}
                      ></div>
                    ))}
                  </div>
                  <span className="label">{theme.label}</span>
                  {settings.boardTheme === theme.id && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h4>Piece Theme</h4>
            <div className="theme-grid">
              {allPieces.map(theme => (
                <div 
                  key={theme.id} 
                  className={`theme-card ${settings.pieceTheme === theme.id ? 'active' : ''}`}
                  onClick={() => setPieceTheme(theme.id)}
                >
                  <div className="preview-pieces">
                    <span style={{ filter: theme.whiteFilter }}>♘</span>
                    <span style={{ filter: theme.blackFilter }}>♞</span>
                  </div>
                  <span className="label">{theme.label}</span>
                  {settings.pieceTheme === theme.id && <FontAwesomeIcon icon={faCheck} className="check-icon" />}
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="setting-row">
              <div className="label-with-icon">
                <FontAwesomeIcon icon={settings.soundEnabled ? faVolumeHigh : faVolumeXmark} />
                <span>Sound Effects</span>
              </div>
              <button 
                className={`toggle-btn ${settings.soundEnabled ? 'on' : 'off'}`}
                onClick={() => {
                  const newValue = !settings.soundEnabled;
                  updateSetting('soundEnabled', newValue);
                  soundManager.setEnabled(newValue);
                }}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
            
            <div className="setting-row volume-control">
              <label htmlFor="volume-slider">Volume</label>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={handleVolumeChange}
                disabled={!settings.soundEnabled}
              />
              <span className="volume-value">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
          </section>

          <section className="settings-section">
            <div className="setting-row">
              <div className="label-with-icon">
                <span>Show Board Coordinates</span>
              </div>
              <button 
                className={`toggle-btn ${settings.showCoordinates ? 'on' : 'off'}`}
                onClick={() => updateSetting('showCoordinates', !settings.showCoordinates)}
              >
                <div className="toggle-thumb"></div>
              </button>
            </div>
          </section>

          <section className="settings-section danger-zone">
            <button className="reset-btn" onClick={handleReset}>
              <FontAwesomeIcon icon={faTrash} />
              <span>Reset Clone Memory</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
