import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in localStorage.
 * @param {string} key - The key under which the data is stored.
 * @param {any} defaultValue - The initial value if no data exists in localStorage.
 */
export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn(`localStorage quota exceeded for ${key}. Consider clearing old data.`);
        // Optionally notify user or implement fallback storage strategy
      } else {
        console.error(`Error saving ${key} to localStorage:`, e);
      }
    }
  }, [key, value]);

  return [value, setValue];
};
