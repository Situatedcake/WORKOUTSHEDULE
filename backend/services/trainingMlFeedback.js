import { randomUUID } from "node:crypto";

const TRAINING_ML_FEEDBACK_TYPES = new Set([
  "exercise_removed",
  "exercise_replaced",
  "exercise_skipped",
  "sets_decreased",
  "workout_skipped",
  "workout_partial",
]);

const TRAINING_ML_FEEDBACK_SOURCES = new Set([
  "training_plan",
  "workout_plan",
  "workout_result",
  "schedule_sync",
]);

function normalizeString(value, fallbackValue = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
}

function normalizeNullableNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeFeedbackType(type) {
  const normalizedType = normalizeString(type);
  return TRAINING_ML_FEEDBACK_TYPES.has(normalizedType) ? normalizedType : null;
}

function normalizeFeedbackSource(source) {
  const normalizedSource = normalizeString(source, "training_plan");
  return TRAINING_ML_FEEDBACK_SOURCES.has(normalizedSource)
    ? normalizedSource
    : "training_plan";
}

function normalizeFeedbackMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return { ...metadata };
}

export function normalizeTrainingMlFeedbackEntry(entry = {}) {
  const type = normalizeFeedbackType(entry.type);

  if (!type) {
    return null;
  }

  return {
    id: normalizeString(entry.id, `ml_feedback_${randomUUID()}`),
    createdAt: normalizeString(entry.createdAt, new Date().toISOString()),
    type,
    source: normalizeFeedbackSource(entry.source),
    trainingPlanId: normalizeString(entry.trainingPlanId) || null,
    scheduledWorkoutId: normalizeString(entry.scheduledWorkoutId) || null,
    sessionId: normalizeString(entry.sessionId) || null,
    sessionIndex: normalizeNullableNumber(entry.sessionIndex),
    exerciseId: normalizeString(entry.exerciseId) || null,
    sourceExerciseId: normalizeString(entry.sourceExerciseId) || null,
    exerciseName: normalizeString(entry.exerciseName) || null,
    nextExerciseId: normalizeString(entry.nextExerciseId) || null,
    nextSourceExerciseId: normalizeString(entry.nextSourceExerciseId) || null,
    nextExerciseName: normalizeString(entry.nextExerciseName) || null,
    previousSets: normalizeNullableNumber(entry.previousSets),
    nextSets: normalizeNullableNumber(entry.nextSets),
    metadata: normalizeFeedbackMetadata(entry.metadata),
  };
}

export function normalizeTrainingMlFeedbackHistory(history = []) {
  return Array.isArray(history)
    ? history
        .map(normalizeTrainingMlFeedbackEntry)
        .filter(Boolean)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    : [];
}

export function createTrainingMlFeedbackEntry(input = {}) {
  return normalizeTrainingMlFeedbackEntry({
    id: input.id ?? `ml_feedback_${randomUUID()}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  });
}

export function buildWorkoutOutcomeFeedbackEvents(
  workoutHistoryEntry = {},
  source = "workout_result",
) {
  const status = normalizeString(workoutHistoryEntry.status);
  const exerciseSkippedEvents = Array.isArray(workoutHistoryEntry.exerciseSetWeights)
    ? workoutHistoryEntry.exerciseSetWeights
        .filter((exerciseEntry) => {
          const plannedSetsCount = Number(
            exerciseEntry?.plannedSetsCount ?? exerciseEntry?.sets ?? 0,
          );
          const completedSetsCount = Number(exerciseEntry?.completedSetsCount ?? 0);
          return (
            exerciseEntry?.status === "skipped" ||
            (plannedSetsCount > 0 && completedSetsCount < plannedSetsCount)
          );
        })
        .map((exerciseEntry) =>
          createTrainingMlFeedbackEntry({
            type: "exercise_skipped",
            source,
            trainingPlanId: workoutHistoryEntry.trainingPlanId ?? null,
            scheduledWorkoutId: workoutHistoryEntry.scheduledWorkoutId ?? null,
            sessionId: workoutHistoryEntry.sessionId ?? null,
            sessionIndex: workoutHistoryEntry.sessionIndex ?? null,
            exerciseId: exerciseEntry.exerciseId ?? null,
            sourceExerciseId:
              exerciseEntry.sourceExerciseId ?? exerciseEntry.exerciseId ?? null,
            exerciseName: exerciseEntry.exerciseName ?? null,
            metadata: {
              title: workoutHistoryEntry.title ?? null,
              date: workoutHistoryEntry.date ?? null,
              plannedSetsCount: exerciseEntry.plannedSetsCount ?? exerciseEntry.sets ?? 0,
              completedSetsCount: exerciseEntry.completedSetsCount ?? 0,
              skippedSetsCount: Math.max(
                Number(exerciseEntry.plannedSetsCount ?? exerciseEntry.sets ?? 0) -
                  Number(exerciseEntry.completedSetsCount ?? 0),
                0,
              ),
            },
          }),
        )
    : [];

  if (status !== "skipped" && status !== "partial") {
    return exerciseSkippedEvents;
  }

  return [
    ...exerciseSkippedEvents,
    createTrainingMlFeedbackEntry({
      type: status === "skipped" ? "workout_skipped" : "workout_partial",
      source,
      trainingPlanId: workoutHistoryEntry.trainingPlanId ?? null,
      scheduledWorkoutId: workoutHistoryEntry.scheduledWorkoutId ?? null,
      sessionId: workoutHistoryEntry.sessionId ?? null,
      sessionIndex: workoutHistoryEntry.sessionIndex ?? null,
      metadata: {
        title: workoutHistoryEntry.title ?? null,
        date: workoutHistoryEntry.date ?? null,
        completedSetsCount: workoutHistoryEntry.summary?.completedSetsCount ?? 0,
        plannedSetsCount: workoutHistoryEntry.summary?.plannedSetsCount ?? 0,
      },
    }),
  ];
}
