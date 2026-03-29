import {
  formatExercisePrescription,
  getExercisePrescriptionDetails,
} from "./trainingPlanBuilder";

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

function normalizePositiveNumber(value, fallbackValue) {
  const parsedValue = Number(value);

  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return fallbackValue;
}

function getExerciseVolumeDetails(exercise, trainingLevel) {
  const baseDetails = getExercisePrescriptionDetails(
    trainingLevel,
    exercise?.type ?? "compound",
  );
  const sets = normalizePositiveNumber(
    exercise?.sets,
    normalizeSetCount(
      exercise?.prescription ?? baseDetails.prescription,
      exercise?.type,
    ),
  );
  const repRange =
    typeof exercise?.repRange === "string" && exercise.repRange.trim()
      ? exercise.repRange
      : baseDetails.repRange;
  const restSeconds = normalizePositiveNumber(
    exercise?.restSeconds,
    baseDetails.restSeconds,
  );

  return {
    sets,
    repRange,
    restSeconds,
    prescription:
      typeof exercise?.prescription === "string" && exercise.prescription.trim()
        ? exercise.prescription
        : formatExercisePrescription({
            exerciseType: exercise?.type ?? "compound",
            sets,
            repRange,
            restSeconds,
          }),
  };
}

function getExerciseRestBlocks(exercise, index, exercises) {
  const sets = Math.max(exercise?.sets ?? 0, 0);

  if (!sets) {
    return 0;
  }

  const setRestBlocks = Math.max(sets - 1, 0);
  const transitionRestBlocks = index < exercises.length - 1 ? 1 : 0;

  return setRestBlocks + transitionRestBlocks;
}

function buildExerciseCatalog(session) {
  return new Map(
    (session?.exerciseOptions ?? []).map((exercise) => [exercise.name, exercise]),
  );
}

export function getExerciseDifficultyLabel(exerciseType) {
  return DIFFICULTY_LABELS[exerciseType] ?? "Средняя";
}

export function decorateWorkoutExercises(exercises = [], trainingLevel) {
  return exercises.map((exercise, index) => {
    const volumeDetails = getExerciseVolumeDetails(exercise, trainingLevel);

    return {
      ...exercise,
      id: exercise.id ?? createRuntimeExerciseId("exercise", index),
      sets: volumeDetails.sets,
      repRange: volumeDetails.repRange,
      restSeconds: volumeDetails.restSeconds,
      prescription: volumeDetails.prescription,
      difficultyLabel: getExerciseDifficultyLabel(exercise.type),
      estimatedSeconds: estimateExerciseSeconds(
        exercise.type,
        volumeDetails.sets,
      ),
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
  const restSeconds = exercises.reduce(
    (total, exercise, index) =>
      total +
      getExerciseRestBlocks(exercise, index, exercises) *
        normalizePositiveNumber(exercise.restSeconds, REST_DURATION_SECONDS),
    0,
  );

  return {
    totalSets,
    totalEstimatedSeconds: exerciseSeconds + restSeconds,
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
      sourceExerciseId: exercise.id ?? exerciseCatalog.get(exercise.name)?.id ?? null,
      name: exercise.name,
      type: exercise.type ?? exerciseCatalog.get(exercise.name)?.type ?? "compound",
      sets: exercise.sets,
      repRange: exercise.repRange,
      restSeconds: exercise.restSeconds,
      prescription: exercise.prescription,
      availableExercises:
        session?.availableExercises ?? [exercise.name],
    })),
    trainingPlan?.trainingLevel,
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
  const nextVolumeDetails = getExercisePrescriptionDetails(
    workoutDraft.trainingLevel,
    nextType,
  );
  const nextExercises = workoutDraft.exercises.map((item, index) =>
    index === exerciseIndex
      ? {
          ...item,
          sourceExerciseId: nextExercise?.id ?? null,
          name: nextExerciseName,
          type: nextType,
          prescription: nextVolumeDetails.prescription,
          difficultyLabel: getExerciseDifficultyLabel(nextType),
          sets: nextVolumeDetails.sets,
          repRange: nextVolumeDetails.repRange,
          restSeconds: nextVolumeDetails.restSeconds,
          volumeTrend: "manual",
          volumeReason:
            "Упражнение заменено вручную, поэтому объём сброшен к базовой рекомендации для текущего уровня.",
          estimatedSeconds: estimateExerciseSeconds(nextType, nextVolumeDetails.sets),
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
    const restSeconds = normalizePositiveNumber(
      exercise.restSeconds,
      getExercisePrescriptionDetails(workoutDraft.trainingLevel, exercise.type)
        .restSeconds,
    );
    const repRange =
      typeof exercise.repRange === "string" && exercise.repRange.trim()
        ? exercise.repRange
        : getExercisePrescriptionDetails(workoutDraft.trainingLevel, exercise.type)
            .repRange;

    return {
      ...exercise,
      sets: nextSetValue,
      repRange,
      restSeconds,
      volumeTrend: "manual",
      volumeReason:
        "Количество подходов изменено вручную. Диапазон повторений и отдых сохранены из текущей рекомендации.",
      prescription: formatExercisePrescription({
        exerciseType: exercise.type,
        sets: nextSetValue,
        repRange,
        restSeconds,
      }),
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
