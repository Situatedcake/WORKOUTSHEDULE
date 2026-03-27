import { getExercisePrescription } from "./trainingPlanBuilder";

export const REST_DURATION_SECONDS = 5 * 60;

const DIFFICULTY_LABELS = {
  compound: "Средняя",
  isolation: "Легкая",
  cardio: "Высокая",
  core: "Средняя",
};

const BASE_SECONDS_BY_TYPE = {
  compound: 150,
  isolation: 110,
  cardio: 720,
  core: 90,
};

function createRuntimeExerciseId(baseId, index) {
  return `${baseId}_runtime_${index + 1}`;
}

function normalizeSetCount(rawValue, exerciseType) {
  const value = String(rawValue ?? "").toLowerCase();
  const rangeMatch = value.match(/(\d+)\s*-\s*(\d+)/);
  const singleMatch = value.match(/(\d+)/);

  if (rangeMatch) {
    return Math.max(Number(rangeMatch[2]), 1);
  }

  if (singleMatch) {
    const parsedValue = Number(singleMatch[1]);

    if (!Number.isNaN(parsedValue) && parsedValue > 0) {
      if (exerciseType === "cardio" && !value.includes("подход") && !value.includes("круг")) {
        return 1;
      }

      return parsedValue;
    }
  }

  if (exerciseType === "cardio") {
    return 1;
  }

  return 3;
}

function estimateExerciseSeconds(exerciseType, sets) {
  const baseSeconds = BASE_SECONDS_BY_TYPE[exerciseType] ?? BASE_SECONDS_BY_TYPE.compound;
  return Math.max(baseSeconds * Math.max(sets, 1), 60);
}

function buildExerciseCatalog(session) {
  return new Map(
    (session?.exerciseOptions ?? []).map((exercise) => [exercise.name, exercise]),
  );
}

export function getExerciseDifficultyLabel(exerciseType) {
  return DIFFICULTY_LABELS[exerciseType] ?? "Средняя";
}

export function decorateWorkoutExercises(exercises = []) {
  return exercises.map((exercise, index) => {
    const sets = normalizeSetCount(exercise.prescription, exercise.type);

    return {
      ...exercise,
      id: exercise.id ?? createRuntimeExerciseId("exercise", index),
      sets,
      difficultyLabel: getExerciseDifficultyLabel(exercise.type),
      estimatedSeconds: estimateExerciseSeconds(exercise.type, sets),
    };
  });
}

export function calculateWorkoutTotals(exercises = []) {
  const totalSets = exercises.reduce(
    (total, exercise) => total + Math.max(exercise.sets ?? 0, 0),
    0,
  );
  const exerciseSeconds = exercises.reduce(
    (total, exercise) => total + Math.max(exercise.estimatedSeconds ?? 0, 0),
    0,
  );
  const restBlocks = Math.max(totalSets - 1, 0);

  return {
    totalSets,
    totalEstimatedSeconds: exerciseSeconds + restBlocks * REST_DURATION_SECONDS,
  };
}

export function buildWorkoutDraft({ scheduledWorkout, trainingPlan }) {
  if (!scheduledWorkout) {
    return null;
  }

  const session =
    trainingPlan?.sessions?.find((item) => item.id === scheduledWorkout.sessionId) ??
    null;
  const exerciseCatalog = buildExerciseCatalog(session);
  const exercises = decorateWorkoutExercises(
    (scheduledWorkout.exercises ?? []).map((exercise, index) => ({
      id: createRuntimeExerciseId(scheduledWorkout.id, index),
      name: exercise.name,
      type: exercise.type ?? exerciseCatalog.get(exercise.name)?.type ?? "compound",
      prescription: exercise.prescription,
      availableExercises:
        session?.availableExercises ?? [exercise.name],
    })),
  );
  const totals = calculateWorkoutTotals(exercises);

  return {
    scheduledWorkoutId: scheduledWorkout.id,
    sessionId: scheduledWorkout.sessionId,
    title: scheduledWorkout.title,
    emphasis: scheduledWorkout.emphasis,
    warmup: session?.warmup ?? "",
    trainingLevel: trainingPlan?.trainingLevel ?? "Не определен",
    scheduledDate: scheduledWorkout.date,
    scheduledTime: scheduledWorkout.time,
    exerciseOptions: session?.exerciseOptions ?? [],
    estimatedDurationMin:
      scheduledWorkout.estimatedDurationMin ??
      Math.max(Math.round(totals.totalEstimatedSeconds / 60), 1),
    exercises,
    ...totals,
  };
}

export function replaceWorkoutExercise({
  workoutDraft,
  exerciseIndex,
  nextExerciseName,
}) {
  const exercise = workoutDraft?.exercises?.[exerciseIndex];

  if (!exercise || !nextExerciseName) {
    return workoutDraft;
  }

  const allExerciseOptions = workoutDraft.exerciseOptions ?? [];
  const nextExercise =
    allExerciseOptions.find((option) => option.name === nextExerciseName) ??
    null;
  const nextType = nextExercise?.type ?? exercise.type;
  const nextSets = normalizeSetCount(
    getExercisePrescription(workoutDraft.trainingLevel, nextType),
    nextType,
  );
  const nextExercises = workoutDraft.exercises.map((item, index) =>
    index === exerciseIndex
      ? {
          ...item,
          name: nextExerciseName,
          type: nextType,
          prescription: getExercisePrescription(workoutDraft.trainingLevel, nextType),
          difficultyLabel: getExerciseDifficultyLabel(nextType),
          sets: nextSets,
          estimatedSeconds: estimateExerciseSeconds(nextType, nextSets),
        }
      : item,
  );

  return {
    ...workoutDraft,
    exercises: nextExercises,
    ...calculateWorkoutTotals(nextExercises),
  };
}

export function removeWorkoutExercise(workoutDraft, exerciseIndex) {
  const nextExercises = (workoutDraft?.exercises ?? []).filter(
    (_, index) => index !== exerciseIndex,
  );

  if (!nextExercises.length) {
    return workoutDraft;
  }

  return {
    ...workoutDraft,
    exercises: nextExercises,
    ...calculateWorkoutTotals(nextExercises),
  };
}

export function updateWorkoutExerciseSets(workoutDraft, exerciseIndex, sets) {
  const nextExercises = (workoutDraft?.exercises ?? []).map((exercise, index) => {
    if (index !== exerciseIndex) {
      return exercise;
    }

    const nextSetValue = Math.max(Number(sets) || exercise.sets || 1, 1);

    return {
      ...exercise,
      sets: nextSetValue,
      estimatedSeconds: estimateExerciseSeconds(exercise.type, nextSetValue),
    };
  });

  return {
    ...workoutDraft,
    exercises: nextExercises,
    ...calculateWorkoutTotals(nextExercises),
  };
}

export function formatDuration(durationSeconds) {
  const totalSeconds = Math.max(Math.round(durationSeconds), 0);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}
