const SESSION_USER_ID_KEY = "workoutshedule-session-user-id";

let inMemorySessionUserId = null;

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getSessionUserId() {
  if (!canUseLocalStorage()) {
    return inMemorySessionUserId;
  }

  return window.localStorage.getItem(SESSION_USER_ID_KEY);
}

export function setSessionUserId(userId) {
  if (!canUseLocalStorage()) {
    inMemorySessionUserId = userId;
    return;
  }

  window.localStorage.setItem(SESSION_USER_ID_KEY, userId);
}

export function clearSessionUserId() {
  if (!canUseLocalStorage()) {
    inMemorySessionUserId = null;
    return;
  }

  window.localStorage.removeItem(SESSION_USER_ID_KEY);
}
