const STORAGE_KEY = "workoutshedule-gamification-celebrations";
const RECENT_CELEBRATION_TTL_MS = 2 * 60 * 1000;

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function readStore() {
  const storage = getStorage();

  if (!storage) {
    return {};
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage write failures.
  }
}

function pruneStore(store, nowTimestamp = Date.now()) {
  return Object.fromEntries(
    Object.entries(store).filter(([, timestamp]) => {
      return (
        typeof timestamp === "number" &&
        nowTimestamp - timestamp <= RECENT_CELEBRATION_TTL_MS
      );
    }),
  );
}

export function markGamificationCelebrationShown(key) {
  if (!key) {
    return;
  }

  const nowTimestamp = Date.now();
  const store = pruneStore(readStore(), nowTimestamp);
  store[key] = nowTimestamp;
  writeStore(store);
}

export function wasGamificationCelebrationShownRecently(key) {
  if (!key) {
    return false;
  }

  const nowTimestamp = Date.now();
  const store = pruneStore(readStore(), nowTimestamp);
  writeStore(store);

  const timestamp = store[key];
  return typeof timestamp === "number";
}
