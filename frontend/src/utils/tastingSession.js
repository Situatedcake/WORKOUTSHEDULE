const TASTING_STARTED_KEY = "tastingStarted";
const TASTING_SCORE_KEY = "tastingScore";
const TASTING_SCORE_MODEL_KEY = "tastingScoreModel";
const TASTING_META_KEY = "tastingMeta";

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function saveJsonValue(key, value) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function getJsonValue(key) {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
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
  window.sessionStorage.removeItem(TASTING_SCORE_MODEL_KEY);
  window.sessionStorage.removeItem(TASTING_META_KEY);
}

export function clearTastingStart() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(TASTING_STARTED_KEY);
}

export function saveTastingScore(score, scoreModel = null) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(TASTING_SCORE_KEY, String(score));

  if (scoreModel) {
    saveJsonValue(TASTING_SCORE_MODEL_KEY, scoreModel);
  }
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

export function saveTastingScoreModel(scoreModel) {
  if (!scoreModel) {
    return;
  }

  saveJsonValue(TASTING_SCORE_MODEL_KEY, scoreModel);
}

export function getTastingScoreModel() {
  return getJsonValue(TASTING_SCORE_MODEL_KEY);
}

export function saveTastingQuestionsMeta(meta) {
  if (!meta) {
    return;
  }

  saveJsonValue(TASTING_META_KEY, meta);

  if (meta.scoreModel) {
    saveTastingScoreModel(meta.scoreModel);
  }
}

export function getTastingQuestionsMeta() {
  return getJsonValue(TASTING_META_KEY);
}
