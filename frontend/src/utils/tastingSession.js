const TASTING_STARTED_KEY = "tastingStarted";
const TASTING_SCORE_KEY = "tastingScore";

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function hasStartedTasting() {
  if (!canUseSessionStorage()) {
    return false;
  }

  return window.sessionStorage.getItem(TASTING_STARTED_KEY) === "true";
}

export function startTastingSession() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(TASTING_STARTED_KEY, "true");
  window.sessionStorage.removeItem(TASTING_SCORE_KEY);
}

export function clearTastingStart() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(TASTING_STARTED_KEY);
}

export function saveTastingScore(score) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(TASTING_SCORE_KEY, String(score));
}

export function getTastingScore() {
  if (!canUseSessionStorage()) {
    return null;
  }

  const value = window.sessionStorage.getItem(TASTING_SCORE_KEY);

  if (value === null) {
    return null;
  }

  const parsedScore = Number(value);
  return Number.isNaN(parsedScore) ? null : parsedScore;
}
