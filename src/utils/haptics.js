// src/utils/haptics.js

/**
 * Triggers haptic feedback based on the event type.
 * Falls back gracefully if navigator.vibrate is not supported.
 */
export const triggerHaptic = (type) => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  switch (type) {
    case 'move':
      // Light tap for normal move
      navigator.vibrate(15);
      break;
    case 'capture':
      // Stronger double tap for capture
      navigator.vibrate([30, 10, 30]);
      break;
    case 'check':
      // Sharp warning buzz
      navigator.vibrate([50, 20, 50]);
      break;
    case 'illegal':
      // Error shake
      navigator.vibrate(40);
      break;
    case 'gameover':
      // Victory/Defeat sequence
      navigator.vibrate([100, 50, 100, 50, 200]);
      break;
    case 'castle':
      // Distinctive slide feel
      navigator.vibrate([20, 30, 20]);
      break;
    default:
      navigator.vibrate(10);
  }
};
