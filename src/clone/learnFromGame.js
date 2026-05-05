/**
 * Layer 0: Data Collection
 * Records every move made by the player to build the learning dataset.
 */

const MAX_MOVE_HISTORY_SIZE = 1000;

export const recordMove = (bot, moveData, maxHistorySize = MAX_MOVE_HISTORY_SIZE) => {
  const updatedBot = { ...bot };
  
  if (!updatedBot.cloneData) {
    updatedBot.cloneData = {
      openingBook: {},
      styleProfile: {},
      positionMemory: {},
      moveHistory: []
    };
  }

  // Append move to history
  updatedBot.cloneData.moveHistory.push({
    ...moveData,
    timestamp: Date.now()
  });

  // Prune old entries if exceeding limit to prevent localStorage overflow
  if (updatedBot.cloneData.moveHistory.length > maxHistorySize) {
    updatedBot.cloneData.moveHistory = 
      updatedBot.cloneData.moveHistory.slice(-maxHistorySize);
  }

  return updatedBot;
};
