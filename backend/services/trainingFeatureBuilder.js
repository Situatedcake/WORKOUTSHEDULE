import { buildAdaptiveSignals } from "./adaptiveSignals.js";
import { normalizeTrainingMlFeedbackHistory } from "./trainingMlFeedback.js";
import {
  isProductiveWorkoutStatus,
  normalizeWorkoutHistory,
} from "./workoutHistory.js";

function average(values = []) {
  const numericValues = values.filter((value) => Number.isFinite(Number(value)));

  if (!numericValues.length) {
    return null;
  }

  return (
    numericValues.reduce((total, value) => total + Number(value), 0) /
    numericValues.length
  );
}

function sum(values = []) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function normalizeDate(value) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function buildHistoryFeatures(workoutHistory = []) {
  const normalizedHistory = normalizeWorkoutHistory(workoutHistory);
  const productiveWorkouts = normalizedHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  );
  const partialWorkouts = normalizedHistory.filter(
    (workout) => workout.status === "partial",
  );
  const skippedWorkouts = normalizedHistory.filter(
    (workout) => workout.status === "skipped",
  );
  const canceledWorkouts = normalizedHistory.filter(
    (workout) => workout.status === "canceled",
  );
  const recentProductiveWorkouts = productiveWorkouts.slice(-5);
  const lastProductiveWorkout = productiveWorkouts.at(-1) ?? null;
  const lastProductiveWorkoutDate = normalizeDate(
    lastProductiveWorkout?.completedAt ??
      lastProductiveWorkout?.finishedAt ??
      lastProductiveWorkout?.date,
  );
  const daysSinceLastProductiveWorkout = lastProductiveWorkoutDate
    ? Math.max(
        Math.round(
          (Date.now() - lastProductiveWorkoutDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        0,
      )
    : null;
  const completionRatios = productiveWorkouts
    .map((workout) => {
      const plannedSetsCount = Number(workout.summary?.plannedSetsCount) || 0;
      const completedSetsCount = Number(workout.summary?.completedSetsCount) || 0;

      if (plannedSetsCount <= 0) {
        return null;
      }

      return completedSetsCount / plannedSetsCount;
    })
    .filter((value) => value != null);

  return {
    totalWorkoutsCount: normalizedHistory.length,
    productiveWorkoutCount: productiveWorkouts.length,
    partialWorkoutCount: partialWorkouts.length,
    skippedWorkoutCount: skippedWorkouts.length,
    canceledWorkoutCount: canceledWorkouts.length,
    completionRate:
      normalizedHistory.length > 0
        ? productiveWorkouts.length / normalizedHistory.length
        : 0,
    partialRate:
      normalizedHistory.length > 0
        ? partialWorkouts.length / normalizedHistory.length
        : 0,
    skipRate:
      normalizedHistory.length > 0
        ? skippedWorkouts.length / normalizedHistory.length
        : 0,
    averageActualDurationSeconds: average(
      productiveWorkouts.map((workout) => workout.actualDurationSeconds),
    ),
    averageCompletionRatio: average(completionRatios),
    averagePlannedSetsCount: average(
      productiveWorkouts.map((workout) => workout.summary?.plannedSetsCount ?? 0),
    ),
    averageCompletedSetsCount: average(
      productiveWorkouts.map(
        (workout) => workout.summary?.completedSetsCount ?? 0,
      ),
    ),
    daysSinceLastProductiveWorkout,
    recentProductiveWorkoutCount: recentProductiveWorkouts.length,
  };
}

function buildRecoveryFeatures(workoutHistory = []) {
  const recentProductiveWorkouts = normalizeWorkoutHistory(workoutHistory)
    .filter((workout) => isProductiveWorkoutStatus(workout.status))
    .slice(-5);

  return {
    averageSleepQuality: average(
      recentProductiveWorkouts.map((workout) => workout.metrics?.sleepQuality),
    ),
    averageEnergyLevel: average(
      recentProductiveWorkouts.map((workout) => workout.metrics?.energyLevel),
    ),
    averageEffortLevel: average(
      recentProductiveWorkouts.map((workout) => workout.metrics?.effortLevel),
    ),
  };
}

function buildFeedbackFeatures(trainingMlFeedbackHistory = []) {
  const history = normalizeTrainingMlFeedbackHistory(trainingMlFeedbackHistory);
  const recentHistory = history.slice(-30);
  const countsByType = {
    exercise_removed: 0,
    exercise_replaced: 0,
    sets_decreased: 0,
    workout_skipped: 0,
    workout_partial: 0,
  };

  recentHistory.forEach((entry) => {
    countsByType[entry.type] = (countsByType[entry.type] ?? 0) + 1;
  });

  const recentBehaviorLoad = sum([
    countsByType.exercise_removed,
    countsByType.exercise_replaced,
    countsByType.sets_decreased,
  ]);

  return {
    totalFeedbackEventsCount: history.length,
    recentFeedbackEventsCount: recentHistory.length,
    countsByType,
    recentBehaviorLoad,
    recentExerciseEditRate:
      recentHistory.length > 0 ? recentBehaviorLoad / recentHistory.length : 0,
  };
}

function buildProfileFeatures(user = {}) {
  return {
    level: Number(user.level) || 0,
    trainingLevel: user.trainingLevel ?? "Не определен",
    gender: user.gender ?? "not_specified",
    goal: user.goal ?? "strength",
    objective: user.objective ?? null,
    focusKey: user.focusKey ?? "general-strength",
    focusTags: Array.isArray(user.focusTags) ? user.focusTags : [],
    adaptationPriority: user.adaptationPriority ?? null,
    workoutsPerWeek: Number(user.workoutsPerWeek) || 3,
    time: Number(user.time) || 30,
  };
}

function buildReadinessFeatures({ history, recovery }) {
  let readinessScore = 50;

  if (history.skipRate >= 0.35) {
    readinessScore -= 14;
  } else if (history.skipRate >= 0.2) {
    readinessScore -= 7;
  }

  if (history.partialRate >= 0.3) {
    readinessScore -= 8;
  } else if (history.partialRate >= 0.15) {
    readinessScore -= 4;
  }

  if (recovery.averageSleepQuality != null) {
    readinessScore += (recovery.averageSleepQuality - 3) * 5;
  }

  if (recovery.averageEnergyLevel != null) {
    readinessScore += (recovery.averageEnergyLevel - 3) * 6;
  }

  if (recovery.averageEffortLevel != null && recovery.averageEffortLevel >= 4.5) {
    readinessScore -= 4;
  }

  return {
    readinessScore: Math.max(Math.min(Math.round(readinessScore), 100), 0),
  };
}

export function buildTrainingFeatures({
  exercises = [],
  user,
  workoutHistory = [],
  trainingMlFeedbackHistory = [],
}) {
  const adaptiveSignals = buildAdaptiveSignals(exercises, workoutHistory);
  const profile = buildProfileFeatures(user);
  const history = buildHistoryFeatures(workoutHistory);
  const recovery = buildRecoveryFeatures(workoutHistory);
  const feedback = buildFeedbackFeatures(trainingMlFeedbackHistory);
  const readiness = buildReadinessFeatures({ history, recovery });

  return {
    profile,
    history,
    recovery,
    feedback,
    readiness,
    adaptiveSignals,
  };
}
