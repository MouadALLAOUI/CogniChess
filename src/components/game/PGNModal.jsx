import React, { useState } from 'react';
import { faDownload, faUpload, faCopy, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './PGNModal.scss';

const PGNModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  onImport,
  pgnData = '' 
}) => {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('export');

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pgnData);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    if (onExport) onExport();
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setError('Please enter PGN data');
      return;
    }
    
    if (onImport) {
      const success = onImport(importText);
      if (success) {
        setImportText('');
        setError('');
        onClose();
      } else {
        setError('Invalid PGN format');
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  return (
    <div className="pgn-modal-overlay" onClick={onClose}>
      <div className="pgn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pgn-modal-header">
          <h2>PGN Import/Export</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="pgn-tabs">
          <button 
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button 
            className={`tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>

        {activeTab === 'export' && (
          <div className="pgn-export-content">
            <div className="pgn-textarea-container">
              <textarea 
                className="pgn-textarea" 
                value={pgnData} 
                readOnly 
                rows={12}
              />
            </div>
            <div className="pgn-actions">
              <button className="action-btn copy" onClick={handleCopy}>
                <FontAwesomeIcon icon={faCopy} />
                <span>Copy</span>
              </button>
              <button className="action-btn download" onClick={handleDownload}>
                <FontAwesomeIcon icon={faDownload} />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="pgn-import-content">
            <div className="pgn-textarea-container">
              <textarea 
                className="pgn-textarea" 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste PGN here or upload a file..."
                rows={12}
              />
            </div>
            <div className="pgn-actions">
              <label className="action-btn upload">
                <FontAwesomeIcon icon={faUpload} />
                <span>Upload File</span>
                <input 
                  type="file" 
                  accept=".pgn,.txt" 
                  onChange={handleFileUpload}
                  hidden
                />
              </label>
              <button className="action-btn import" onClick={handleImport}>
                <span>Import Game</span>
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PGNModal;
