/**
 * Temporal Decay System
 * Applies time-based weighting to historical game data
 * so clones adapt to changes in user's playing style over time
 */

/**
 * Calculate temporal weight for a game based on when it was played
 * @param {number} gameTimestamp - Unix timestamp when game was played
 * @param {number} currentTime - Current Unix timestamp
 * @param {string} decayType - Type of decay: 'exponential', 'linear', 'logarithmic'
 * @param {number} halfLife - Half-life in days (for exponential decay)
 * @returns {number} - Weight between 0 and 1
 */
export function calculateTemporalWeight(
  gameTimestamp,
  currentTime = Date.now(),
  decayType = 'exponential',
  halfLife = 30 // Default: 30 days half-life
) {
  const ageInDays = (currentTime - gameTimestamp) / (1000 * 60 * 60 * 24);
  
  if (ageInDays <= 0) return 1.0;
  
  switch (decayType) {
    case 'exponential':
      return exponentialDecay(ageInDays, halfLife);
    case 'linear':
      return linearDecay(ageInDays, halfLife * 2); // Linear decay over 2x half-life
    case 'logarithmic':
      return logarithmicDecay(ageInDays);
    default:
      return exponentialDecay(ageInDays, halfLife);
  }
}

/**
 * Exponential decay: weight = e^(-ln(2) * age / halfLife)
 * Most natural for memory decay
 */
function exponentialDecay(ageInDays, halfLife) {
  return Math.pow(0.5, ageInDays / halfLife);
}

/**
 * Linear decay: weight decreases linearly to 0 at maxAge
 */
function linearDecay(ageInDays, maxAge) {
  return Math.max(0, 1 - ageInDays / maxAge);
}

/**
 * Logarithmic decay: slower decay for old games
 * Good for preserving very old but important patterns
 */
function logarithmicDecay(ageInDays) {
  return 1 / (1 + Math.log1p(ageInDays));
}

/**
 * Apply temporal weights to position memory entries
 * @param {Array} memoryEntries - Array of {position, move, count, timestamp} objects
 * @param {string} decayType 
 * @param {number} halfLife 
 * @returns {Array} - Entries with added weight property
 */
export function applyTemporalWeightsToMemory(
  memoryEntries,
  decayType = 'exponential',
  halfLife = 30
) {
  const currentTime = Date.now();
  
  return memoryEntries.map(entry => ({
    ...entry,
    temporalWeight: calculateTemporalWeight(
      entry.timestamp || currentTime,
      currentTime,
      decayType,
      halfLife
    ),
    weightedCount: (entry.count || 1) * calculateTemporalWeight(
      entry.timestamp || currentTime,
      currentTime,
      decayType,
      halfLife
    )
  }));
}

/**
 * Apply temporal weights to opening book entries
 * @param {Object} openingBook - Opening book object
 * @param {string} decayType 
 * @param {number} halfLife 
 * @returns {Object} - Opening book with weighted frequencies
 */
export function applyTemporalWeightsToOpeningBook(
  openingBook,
  decayType = 'exponential',
  halfLife = 30
) {
  const currentTime = Date.now();
  const weightedBook = {};
  
  for (const [position, moves] of Object.entries(openingBook)) {
    weightedBook[position] = moves.map(move => ({
      ...move,
      temporalWeight: calculateTemporalWeight(
        move.timestamp || currentTime,
        currentTime,
        decayType,
        halfLife
      ),
      weightedFrequency: (move.frequency || 1) * calculateTemporalWeight(
        move.timestamp || currentTime,
        currentTime,
        decayType,
        halfLife
      )
    }));
  }
  
  return weightedBook;
}

/**
 * Get recency bias factor for blending old vs new learning
 * @param {number} gamesPlayed - Total games played by bot
 * @param {number} recentGames - Games in recent period
 * @returns {number} - Bias factor (0-1) toward recent games
 */
export function getRecencyBiasFactor(gamesPlayed, recentGames) {
  if (gamesPlayed === 0) return 0.5;
  
  const recentRatio = recentGames / gamesPlayed;
  
  // More games = more trust in overall pattern, less in recent only
  const experienceFactor = Math.min(1, gamesPlayed / 100);
  
  // Blend: recent ratio adjusted by experience
  return recentRatio * (1 - experienceFactor * 0.5);
}

/**
 * Decay old position memory entries below threshold
 * @param {Array} memoryEntries 
 * @param {number} minWeight - Minimum weight to keep entry
 * @returns {Array} - Filtered entries
 */
export function pruneOldMemories(memoryEntries, minWeight = 0.1) {
  const currentTime = Date.now();
  
  return memoryEntries.filter(entry => {
    const weight = calculateTemporalWeight(
      entry.timestamp || currentTime,
      currentTime
    );
    return weight >= minWeight;
  });
}

/**
 * Calculate effective sample size with temporal weighting
 * @param {Array} entries - Entries with counts and timestamps
 * @returns {number} - Effective sample size
 */
export function calculateEffectiveSampleSize(entries) {
  const currentTime = Date.now();
  let totalWeight = 0;
  
  entries.forEach(entry => {
    const weight = calculateTemporalWeight(entry.timestamp || currentTime, currentTime);
    totalWeight += (entry.count || 1) * weight;
  });
  
  return totalWeight;
}

/**
 * Time-decayed average of a metric
 * @param {Array} values - Array of {value, timestamp} objects
 * @param {string} decayType 
 * @param {number} halfLife 
 * @returns {number} - Weighted average
 */
export function timeDecayedAverage(values, decayType = 'exponential', halfLife = 30) {
  if (values.length === 0) return 0;
  
  const currentTime = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;
  
  values.forEach(item => {
    const weight = calculateTemporalWeight(
      item.timestamp || currentTime,
      currentTime,
      decayType,
      halfLife
    );
    weightedSum += item.value * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Update style profile with temporal awareness
 * @param {Object} currentProfile - Current style profile
 * @param {Object} newObservations - New style observations
 * @param {number} gamesSinceUpdate - Games played since last update
 * @returns {Object} - Updated style profile
 */
export function updateStyleProfileWithDecay(
  currentProfile,
  newObservations,
  gamesSinceUpdate = 1
) {
  // Decay factor based on games since last update
  const decayFactor = Math.pow(0.95, gamesSinceUpdate);
  
  const updatedProfile = {};
  
  for (const key of Object.keys(currentProfile)) {
    const currentValue = currentProfile[key] || 0.5;
    const newValue = newObservations[key] !== undefined ? newObservations[key] : currentValue;
    
    // Blend old and new with decay
    updatedProfile[key] = currentValue * decayFactor + newValue * (1 - decayFactor);
  }
  
  return updatedProfile;
}

export default {
  calculateTemporalWeight,
  applyTemporalWeightsToMemory,
  applyTemporalWeightsToOpeningBook,
  getRecencyBiasFactor,
  pruneOldMemories,
  calculateEffectiveSampleSize,
  timeDecayedAverage,
  updateStyleProfileWithDecay
};
