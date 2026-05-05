/**
 * Bot storage configuration and utilities.
 */

export const BOTS_STORAGE_KEY = 'chess_clone_bots';

/**
 * Creates a new bot object with the required structure.
 * @param {string} id - UUID v4
 * @param {string} name - Bot name
 * @param {string} avatar - Emoji avatar
 */
export const createBot = (id, name, avatar) => ({
  id,
  name,
  avatar,
  createdAt: Date.now(),
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  cloneData: {
    openingBook: {},
    styleProfile: {},
    positionMemory: {},
    moveHistory: []
  }
});
