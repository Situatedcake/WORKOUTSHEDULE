const WORKOUT_DRAFT_STORAGE_KEY = "workoutshedule-active-workout-draft";
const WORKOUT_RUNTIME_STORAGE_KEY = "workoutshedule-active-workout-runtime";
const WORKOUT_RESULT_STORAGE_KEY = "workoutshedule-active-workout-result";

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function readJsonValue(storageKey) {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function writeJsonValue(storageKey, value) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(value));
}

function removeValue(storageKey) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(storageKey);
}

export function getActiveWorkoutDraft() {
  return readJsonValue(WORKOUT_DRAFT_STORAGE_KEY);
}

export function saveActiveWorkoutDraft(workoutDraft) {
  writeJsonValue(WORKOUT_DRAFT_STORAGE_KEY, workoutDraft);
}

export function clearActiveWorkoutDraft() {
  removeValue(WORKOUT_DRAFT_STORAGE_KEY);
}

export function getActiveWorkoutRuntime() {
  return readJsonValue(WORKOUT_RUNTIME_STORAGE_KEY);
}

export function saveActiveWorkoutRuntime(runtimeState) {
  writeJsonValue(WORKOUT_RUNTIME_STORAGE_KEY, runtimeState);
}

export function clearActiveWorkoutRuntime() {
  removeValue(WORKOUT_RUNTIME_STORAGE_KEY);
}

export function hasActiveWorkoutInProgress() {
  const draft = getActiveWorkoutDraft();
  const runtime = getActiveWorkoutRuntime();

  return Boolean(
    draft?.scheduledWorkoutId &&
      runtime?.scheduledWorkoutId &&
      draft.scheduledWorkoutId === runtime.scheduledWorkoutId,
  );
}

export function getActiveWorkoutResultDraft() {
  return readJsonValue(WORKOUT_RESULT_STORAGE_KEY);
}

export function saveActiveWorkoutResultDraft(resultDraft) {
  writeJsonValue(WORKOUT_RESULT_STORAGE_KEY, resultDraft);
}

export function clearActiveWorkoutResultDraft() {
  removeValue(WORKOUT_RESULT_STORAGE_KEY);
}

export function clearEntireActiveWorkoutSession() {
  clearActiveWorkoutDraft();
  clearActiveWorkoutRuntime();
  clearActiveWorkoutResultDraft();
}
