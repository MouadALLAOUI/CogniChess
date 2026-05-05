import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import { createBot } from '../../store/botsStore';
import './AddBotModal.scss';

const AddBotModal = ({ isOpen, onClose, onAddBot }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('♟');

  const emojis = ['♟', '♜', '♞', '♝', '♛', '♚'];

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newBot = createBot(uuidv4(), name.trim(), selectedEmoji);
    onAddBot(newBot);
    setName('');
    setSelectedEmoji('♟');
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="add-bot-modal animate-slide-up">
        <header className="modal-header">
          <h3>Create New Bot</h3>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="modal-body">
          <div className="form-group">
            <label>Bot Name</label>
            <input
              type="text"
              placeholder="Enter bot name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Choose Avatar</label>
            <div className="emoji-grid">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  className={`emoji-btn ${selectedEmoji === emoji ? 'active' : ''}`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button className="create-btn" onClick={handleSubmit} disabled={!name.trim()}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Create Bot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBotModal;
