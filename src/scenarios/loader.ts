import { getScenario } from './index';

const STORAGE_KEY = '__scenario_name__';

export function loadScenario(name: string): void {
  const keysToKeep = new Set(['__scenario_name__']);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.has(key)) {
      localStorage.removeItem(key);
    }
  }

  const data = getScenario(name);
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  localStorage.setItem(STORAGE_KEY, name);
  window.location.reload();
}

export function getCurrentScenarioName(): string {
  // Production is locked to the 'empty' scenario so first-time visitors see the
  // clean onboarding state, and a developer's localStorage can't leak dev data.
  if (import.meta.env.PROD) return 'empty';
  return localStorage.getItem(STORAGE_KEY) || 'empty';
}
