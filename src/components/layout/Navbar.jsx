import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import './Navbar.scss';

const Navbar = ({ botName = "My Clone", onSettingsClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar__left">
        <h1 className="logo">CogniChess</h1>
      </div>

      <div className="navbar__center">
        <div className="mode-toggle">
          <button className="mode-btn active">Training</button>
          <button className="mode-btn">Challenge</button>
        </div>
      </div>

      <div className="navbar__right">
        <div className="bot-info">
          <span className="bot-name">{botName}</span>
          <button className="settings-btn" onClick={onSettingsClick}>
            <FontAwesomeIcon icon={faGear} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
