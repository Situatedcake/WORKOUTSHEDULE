function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNullableNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function extractExerciseReference(exercise = {}) {
  return {
    exerciseId: normalizeString(exercise.id),
    sourceExerciseId: normalizeString(exercise.sourceExerciseId ?? exercise.id),
    exerciseName: normalizeString(exercise.name),
  };
}

export function createTrainingFeedbackEvent({
  type,
  source,
  trainingPlanId = null,
  scheduledWorkoutId = null,
  sessionId = null,
  sessionIndex = null,
  exercise = null,
  nextExercise = null,
  previousSets = null,
  nextSets = null,
  metadata = {},
}) {
  const currentExerciseReference = exercise
    ? extractExerciseReference(exercise)
    : {};
  const nextExerciseReference = nextExercise
    ? extractExerciseReference(nextExercise)
    : {};

  return {
    type,
    source,
    trainingPlanId: normalizeString(trainingPlanId),
    scheduledWorkoutId: normalizeString(scheduledWorkoutId),
    sessionId: normalizeString(sessionId),
    sessionIndex: normalizeNullableNumber(sessionIndex),
    previousSets: normalizeNullableNumber(previousSets),
    nextSets: normalizeNullableNumber(nextSets),
    metadata,
    ...currentExerciseReference,
    nextExerciseId: nextExerciseReference.exerciseId ?? null,
    nextSourceExerciseId: nextExerciseReference.sourceExerciseId ?? null,
    nextExerciseName: nextExerciseReference.exerciseName ?? null,
  };
}
