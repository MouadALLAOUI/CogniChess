import React, { useEffect, useState } from 'react';
import './BlunderToast.scss';

const BlunderToast = ({ blunder, onShow, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible || !blunder) return null;

  const getIcon = () => {
    switch (blunder.severity) {
      case 'error': return '⚠️';
      case 'warning': return '⚡';
      default: return '💡';
    }
  };

  const getClassNames = () => {
    return `blunder-toast blunder-toast--${blunder.severity} ${isExiting ? 'blunder-toast--exiting' : ''}`;
  };

  return (
    <div className={getClassNames()}>
      <div className="blunder-toast__icon">{getIcon()}</div>
      <div className="blunder-toast__content">
        <h4 className="blunder-toast__title">
          {blunder.severity === 'error' ? 'Blunder Detected' : 
           blunder.severity === 'warning' ? 'Tactical Alert' : 'Suggestion'}
        </h4>
        <p className="blunder-toast__message">{blunder.message}</p>
        {blunder.tacticalPattern && (
          <p className="blunder-toast__pattern">
            Pattern: {blunder.tacticalPattern.name} - {blunder.tacticalPattern.description}
          </p>
        )}
      </div>
      <div className="blunder-toast__actions">
        {blunder.recommendedMove && (
          <button 
            className="blunder-toast__btn blunder-toast__btn--show"
            onClick={() => {
              onShow?.(blunder.recommendedMove);
              setIsExiting(true);
              setTimeout(() => {
                setIsVisible(false);
                onClose?.();
              }, 300);
            }}
          >
            Show
          </button>
        )}
        <button 
          className="blunder-toast__btn blunder-toast__btn--dismiss"
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              onClose?.();
            }, 300);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default BlunderToast;
