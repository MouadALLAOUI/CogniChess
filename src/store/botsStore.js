/**
 * Bot storage configuration and utilities.
 */
import LZString from 'lz-string';

export const BOTS_STORAGE_KEY = 'chess_clone_bots';

// Compression helpers to prevent localStorage overflow
const compressData = (data) => LZString.compress(JSON.stringify(data));
const decompressData = (str) => {
  if (!str) return null;
  try {
    const decompressed = LZString.decompress(str);
    return decompressed ? JSON.parse(decompressed) : null;
  } catch (e) {
    console.error('Failed to decompress bot data:', e);
    return null;
  }
};

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

/**
 * Saves bots to localStorage with compression.
 * Implements "keep last N games" policy to prevent overflow.
 */
export const saveBots = (bots, maxHistoryPerBot = 500) => {
  try {
    // Prune old move history to prevent bloat
    const prunedBots = { ...bots };
    for (const botId in prunedBots) {
      const bot = prunedBots[botId];
      if (bot.cloneData?.moveHistory?.length > maxHistoryPerBot) {
        bot.cloneData.moveHistory = bot.cloneData.moveHistory.slice(-maxHistoryPerBot);
      }
    }
    
    const compressed = compressData(prunedBots);
    localStorage.setItem(BOTS_STORAGE_KEY, compressed);
  } catch (e) {
    console.error('Failed to save bots (storage full?):', e);
    // Try to save without compression as fallback
    try {
      localStorage.setItem(BOTS_STORAGE_KEY, JSON.stringify(bots));
    } catch (e2) {
      console.error('Critical: Cannot save bots at all. Storage quota exceeded.');
    }
  }
};

/**
 * Loads bots from localStorage with decompression.
 */
export const loadBots = () => {
  try {
    const stored = localStorage.getItem(BOTS_STORAGE_KEY);
    if (!stored) return {};
    
    // Try compressed format first
    const data = decompressData(stored);
    if (data) return data;
    
    // Fallback to uncompressed (legacy)
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse legacy bot data:', e);
      return {};
    }
  } catch (e) {
    console.error('Failed to load bots:', e);
    return {};
  }
};
