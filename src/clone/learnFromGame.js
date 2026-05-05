/**
 * Layer 0: Data Collection
 * Records every move made by the player to build the learning dataset.
 */

export const recordMove = (bot, moveData) => {
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

  return updatedBot;
};
