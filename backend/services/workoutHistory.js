const PRODUCTIVE_WORKOUT_STATUSES = new Set(["completed", "partial"]);

function normalizeNumber(value, fallbackValue = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function normalizeNullableNumber(value) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeString(value, fallbackValue = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
}

function normalizeExerciseSetWeightEntry(exerciseEntry = {}) {
  const weightsKg = Array.isArray(exerciseEntry.weightsKg)
    ? exerciseEntry.weightsKg.map((value) => normalizeNullableNumber(value))
    : [];
  const plannedSetsCount = Math.max(
    normalizeNumber(exerciseEntry.plannedSetsCount, 0),
    normalizeNumber(exerciseEntry.sets, 0),
    weightsKg.length,
  );
  const completedSetsCount = weightsKg.filter((value) => value != null).length;
  const isSkippedFlag =
    exerciseEntry?.isSkipped === true || exerciseEntry?.status === "skipped";
  const status = isSkippedFlag
    ? "skipped"
    : completedSetsCount >= plannedSetsCount && plannedSetsCount > 0
      ? "completed"
      : completedSetsCount > 0
        ? "partial"
        : "planned";

  return {
    exerciseId: exerciseEntry.exerciseId ?? null,
    sourceExerciseId: exerciseEntry.sourceExerciseId ?? exerciseEntry.exerciseId ?? null,
    exerciseName: normalizeString(exerciseEntry.exerciseName, "РЈРїСЂР°Р¶РЅРµРЅРёРµ"),
    sets: normalizeNumber(exerciseEntry.sets, plannedSetsCount),
    plannedSetsCount,
    completedSetsCount,
    status,
    isSkipped: status === "skipped",
    repRange: normalizeString(exerciseEntry.repRange),
    restSeconds: normalizeNumber(exerciseEntry.restSeconds, 0),
    weightsKg,
  };
}

function calculatePlannedSetsCount(exerciseSetWeights = []) {
  return exerciseSetWeights.reduce(
    (total, exerciseEntry) =>
      total + Math.max(normalizeNumber(exerciseEntry.plannedSetsCount, 0), 0),
    0,
  );
}

function calculateCompletedSetsCount(exerciseSetWeights = []) {
  return exerciseSetWeights.reduce(
    (total, exerciseEntry) =>
      total + Math.max(normalizeNumber(exerciseEntry.completedSetsCount, 0), 0),
    0,
  );
}

function getScheduledWorkoutExerciseList(scheduledWorkout = {}) {
  return Array.isArray(scheduledWorkout.exercises) ? scheduledWorkout.exercises : [];
}

function calculateScheduledWorkoutPlannedSetsCount(scheduledWorkout = {}) {
  return getScheduledWorkoutExerciseList(scheduledWorkout).reduce(
    (total, exercise) => total + Math.max(normalizeNumber(exercise?.sets, 0), 0),
    0,
  );
}

export function isProductiveWorkoutStatus(status) {
  return PRODUCTIVE_WORKOUT_STATUSES.has(status);
}

export function normalizeWorkoutHistoryEntry(entry = {}) {
  const exerciseSetWeights = Array.isArray(entry.exerciseSetWeights)
    ? entry.exerciseSetWeights.map(normalizeExerciseSetWeightEntry)
    : [];
  const status = normalizeString(entry.status, "completed");
  const actualDurationSeconds = normalizeNumber(
    entry.actualDurationSeconds,
    normalizeNumber(entry.durationSeconds, 0),
  );
  const plannedDurationSeconds = normalizeNumber(
    entry.plannedDurationSeconds,
    actualDurationSeconds,
  );
  const plannedExercisesCount = Math.max(
    normalizeNumber(entry.summary?.plannedExercisesCount, 0),
    exerciseSetWeights.length,
  );
  const completedExercisesCount = Math.max(
    normalizeNumber(entry.summary?.completedExercisesCount, 0),
    normalizeNumber(entry.completedExercisesCount, 0),
    exerciseSetWeights.filter((exerciseEntry) => exerciseEntry.completedSetsCount > 0)
      .length,
  );
  const plannedSetsCount = Math.max(
    normalizeNumber(entry.summary?.plannedSetsCount, 0),
    calculatePlannedSetsCount(exerciseSetWeights),
  );
  const completedSetsCount = Math.max(
    normalizeNumber(entry.summary?.completedSetsCount, 0),
    normalizeNumber(entry.completedSetsCount, 0),
    calculateCompletedSetsCount(exerciseSetWeights),
  );
  const startedAt = normalizeString(entry.startedAt, normalizeString(entry.completedAt));
  const finishedAt = normalizeString(
    entry.finishedAt,
    normalizeString(entry.completedAt, startedAt),
  );

  return {
    ...entry,
    id: entry.id ?? null,
    scheduledWorkoutId: entry.scheduledWorkoutId ?? null,
    trainingPlanId: entry.trainingPlanId ?? null,
    sessionId: entry.sessionId ?? null,
    sessionIndex: normalizeNullableNumber(entry.sessionIndex),
    title: normalizeString(entry.title, "РўСЂРµРЅРёСЂРѕРІРєР°"),
    emphasis: normalizeString(entry.emphasis),
    date: normalizeString(entry.date),
    time: normalizeString(entry.time),
    status,
    startedAt: startedAt || null,
    finishedAt: finishedAt || null,
    completedAt: normalizeString(entry.completedAt, finishedAt || startedAt) || null,
    plannedDurationSeconds,
    actualDurationSeconds,
    durationSeconds: actualDurationSeconds,
    completedExercisesCount,
    completedSetsCount,
    exerciseSetWeights,
    summary: {
      plannedExercisesCount,
      completedExercisesCount,
      plannedSetsCount,
      completedSetsCount,
    },
    metrics: {
      weightKg: normalizeNullableNumber(entry.metrics?.weightKg),
      burnedCalories: normalizeNullableNumber(entry.metrics?.burnedCalories),
      energyLevel: normalizeNullableNumber(entry.metrics?.energyLevel),
      effortLevel: normalizeNullableNumber(entry.metrics?.effortLevel),
      sleepQuality: normalizeNullableNumber(entry.metrics?.sleepQuality),
    },
  };
}

export function createWorkoutHistoryEntry({
  scheduledWorkout,
  completionPayload = {},
  trainingPlan = null,
  historyEntryId,
  completedAt = new Date().toISOString(),
}) {
  const exerciseSetWeights = Array.isArray(completionPayload.exerciseSetWeights)
    ? completionPayload.exerciseSetWeights.map(normalizeExerciseSetWeightEntry)
    : [];
  const status = normalizeString(completionPayload.status, "completed");
  const plannedExercisesFromSchedule = getScheduledWorkoutExerciseList(scheduledWorkout).length;
  const plannedExercisesCount = Math.max(
    plannedExercisesFromSchedule,
    exerciseSetWeights.length,
  );
  const completedExercisesCount =
    completionPayload.completedExercisesCount != null
      ? normalizeNumber(completionPayload.completedExercisesCount, 0)
      : exerciseSetWeights.filter((exerciseEntry) => exerciseEntry.completedSetsCount > 0)
          .length;
  const plannedSetsCount =
    completionPayload.plannedSetsCount != null
      ? normalizeNumber(completionPayload.plannedSetsCount, 0)
      : Math.max(
          calculatePlannedSetsCount(exerciseSetWeights),
          calculateScheduledWorkoutPlannedSetsCount(scheduledWorkout),
        );
  const completedSetsCount =
    completionPayload.completedSetsCount != null
      ? normalizeNumber(completionPayload.completedSetsCount, 0)
      : calculateCompletedSetsCount(exerciseSetWeights);
  const actualDurationSeconds = normalizeNumber(completionPayload.durationSeconds, 0);
  const plannedDurationSeconds =
    completionPayload.plannedDurationSeconds != null
      ? normalizeNumber(completionPayload.plannedDurationSeconds, actualDurationSeconds)
      : Math.max(
          normalizeNumber(scheduledWorkout?.estimatedDurationMin, 0) * 60,
          actualDurationSeconds,
        );
  const startedAt = normalizeString(completionPayload.startedAt) || null;

  return normalizeWorkoutHistoryEntry({
    id: historyEntryId,
    scheduledWorkoutId: scheduledWorkout?.id ?? null,
    trainingPlanId: trainingPlan?.id ?? null,
    sessionId: scheduledWorkout?.sessionId ?? null,
    sessionIndex: scheduledWorkout?.sessionIndex ?? null,
    title: scheduledWorkout?.title ?? "РўСЂРµРЅРёСЂРѕРІРєР°",
    emphasis: scheduledWorkout?.emphasis ?? "",
    date: scheduledWorkout?.date ?? "",
    time: scheduledWorkout?.time ?? "",
    status,
    startedAt,
    finishedAt: completedAt,
    completedAt,
    plannedDurationSeconds,
    actualDurationSeconds,
    durationSeconds: actualDurationSeconds,
    completedExercisesCount,
    completedSetsCount,
    exerciseSetWeights,
    summary: {
      plannedExercisesCount,
      completedExercisesCount,
      plannedSetsCount,
      completedSetsCount,
    },
    metrics: {
      weightKg: completionPayload.weightKg ?? null,
      burnedCalories: completionPayload.burnedCalories ?? null,
      energyLevel: completionPayload.energyLevel ?? null,
      effortLevel: completionPayload.effortLevel ?? null,
      sleepQuality: completionPayload.sleepQuality ?? null,
    },
  });
}

export function normalizeWorkoutHistory(workoutHistory = []) {
  return Array.isArray(workoutHistory)
    ? workoutHistory.map(normalizeWorkoutHistoryEntry)
    : [];
}
