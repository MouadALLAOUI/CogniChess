/**
 * Settings storage configuration.
 */

export const SETTINGS_STORAGE_KEY = 'chess_clone_settings';

export const DEFAULT_SETTINGS = {
  boardTheme: "classic",     // "classic" | "marble" | "green" | "blue" | "grey"
  pieceTheme: "wooden",      // "wooden" | "metal" | "neo" | "pixel"
  soundEnabled: true,
  soundVolume: 0.5,          // 0.0 to 1.0
  showCoordinates: true,     // Show rank/file labels
  lastActiveBotId: null
};
