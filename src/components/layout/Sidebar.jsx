import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faHistory, faChessKnight, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.scss';

const Sidebar = () => {
  const [expanded, setExpanded] = useState({
    progress: true,
    history: true,
    captured: true
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <header className="section-header" onClick={() => toggleSection('progress')}>
          <div className="title">
            <FontAwesomeIcon icon={faChartLine} className="icon" />
            <span>Clone Progress</span>
          </div>
          <FontAwesomeIcon icon={expanded.progress ? faChevronUp : faChevronDown} />
        </header>
        {expanded.progress && (
          <div className="section-content animate-slide-up">
            <div className="progress-stats">
              <div className="stat-item">
                <span>Openings</span>
                <div className="mini-bar"><div className="fill" style={{width: '75%'}}></div></div>
              </div>
              <div className="stat-item">
                <span>Endgame</span>
                <div className="mini-bar"><div className="fill" style={{width: '30%'}}></div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar__section">
        <header className="section-header" onClick={() => toggleSection('history')}>
          <div className="title">
            <FontAwesomeIcon icon={faHistory} className="icon" />
            <span>Move History</span>
          </div>
          <FontAwesomeIcon icon={expanded.history ? faChevronUp : faChevronDown} />
        </header>
        {expanded.history && (
          <div className="section-content animate-slide-up">
            <div className="history-list">
              <div className="move-row">1. e4 e5</div>
              <div className="move-row">2. Nf3 Nc6</div>
              <div className="move-row">3. Bb5 a6</div>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar__section">
        <header className="section-header" onClick={() => toggleSection('captured')}>
          <div className="title">
            <FontAwesomeIcon icon={faChessKnight} className="icon" />
            <span>Captured Pieces</span>
          </div>
          <FontAwesomeIcon icon={expanded.captured ? faChevronUp : faChevronDown} />
        </header>
        {expanded.captured && (
          <div className="section-content animate-slide-up">
            <div className="captured-grid">
              <div className="captured-side white">
                <span>♟♟</span>
              </div>
              <div className="captured-side black">
                <span>♙</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
