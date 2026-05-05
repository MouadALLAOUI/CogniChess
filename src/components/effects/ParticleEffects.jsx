import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './ParticleEffects.scss';

/**
 * Capture sparkles effect - shows brief particle burst on capture
 */
export const CaptureSparkles = ({ x, y, enabled = true }) => {
  useEffect(() => {
    if (!enabled || !x || !y) return;

    // Create a small burst of particles
    const particleCount = 8;
    const colors = ['#FFD700', '#FFA500', '#FF6347'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 30;
      
      const sparkle = document.createElement('div');
      sparkle.className = 'capture-sparkle';
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      sparkle.style.setProperty('--tx', `${Math.cos(angle) * velocity}px`);
      sparkle.style.setProperty('--ty', `${Math.sin(angle) * velocity}px`);
      
      document.body.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 400);
    }
  }, [x, y, enabled]);

  return null;
};

/**
 * King glow effect - applied when king is in check
 */
export const KingGlow = ({ isActive }) => {
  if (!isActive) return null;
  
  return <div className="king-glow-overlay" />;
};

/**
 * Confetti explosion for checkmate
 */
export const ConfettiExplosion = ({ trigger = false, enabled = true }) => {
  useEffect(() => {
    if (!trigger || !enabled) return;

    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst in the center after a delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
        gravity: 0.8,
        scalar: 1.2
      });
    }, 300);

  }, [trigger, enabled]);

  return null;
};

/**
 * Particle container component for managing all effects
 */
const ParticleEffects = ({ 
  showCaptureSparkles = false,
  capturePosition = null,
  showKingGlow = false,
  showConfetti = false,
  effectsEnabled = true
}) => {
  return (
    <>
      {showCaptureSparkles && capturePosition && (
        <CaptureSparkles 
          x={capturePosition.x} 
          y={capturePosition.y} 
          enabled={effectsEnabled}
        />
      )}
      <KingGlow isActive={showKingGlow} />
      <ConfettiExplosion trigger={showConfetti} enabled={effectsEnabled} />
    </>
  );
};

export default ParticleEffects;
