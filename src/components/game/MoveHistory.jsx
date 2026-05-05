import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import './MoveHistory.scss';

const MoveHistory = ({ history }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1]
    });
  }

  return (
    <div className="move-history">
      <header className="history-header">
        <FontAwesomeIcon icon={faHistory} />
        <span>Move History</span>
      </header>
      <div className="history-list" ref={scrollRef}>
        {rows.map((row, idx) => (
          <div key={idx} className="move-row">
            <span className="move-number">{row.number}.</span>
            <span className="move-white">{row.white.notation}</span>
            <span className="move-black">{row.black ? row.black.notation : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;
