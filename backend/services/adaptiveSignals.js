import {
  normalizeArray,
  normalizeEquipment,
  normalizeTag,
} from "./exerciseCatalogUtils.js";

function incrementMapValue(map, key, amount = 1) {
  if (!key) {
    return;
  }

  map.set(key, (map.get(key) ?? 0) + amount);
}

function extractExerciseEntries(workoutHistory = []) {
  return normalizeArray(workoutHistory).flatMap((workout) =>
    normalizeArray(workout.exerciseSetWeights).map((exercise) => ({
      exerciseName: exercise.exerciseName,
      weightsKg: normalizeArray(exercise.weightsKg),
      completedAt: workout.completedAt ?? workout.date ?? null,
    })),
  );
}

function buildExerciseCatalogMaps(exercises = []) {
  const byName = new Map();
  const byId = new Map();

  normalizeArray(exercises).forEach((exercise) => {
    if (exercise?.name) {
      byName.set(exercise.name, exercise);
    }

    if (exercise?.id) {
      byId.set(normalizeTag(exercise.id), exercise);
    }
  });

  return { byName, byId };
}

function getMaxTrackedWeight(weightsKg = []) {
  const numericWeights = normalizeArray(weightsKg).filter((value) =>
    Number.isFinite(Number(value)),
  );

  if (numericWeights.length === 0) {
    return null;
  }

  return Math.max(...numericWeights.map(Number));
}

function buildProgressMap(exerciseEntries = []) {
  const progressMap = new Map();

  exerciseEntries.forEach((entry) => {
    const maxTrackedWeight = getMaxTrackedWeight(entry.weightsKg);

    if (!entry.exerciseName || maxTrackedWeight == null) {
      return;
    }

    const previousEntry = progressMap.get(entry.exerciseName);

    if (!previousEntry) {
      progressMap.set(entry.exerciseName, {
        first: maxTrackedWeight,
        latest: maxTrackedWeight,
        observations: 1,
      });
      return;
    }

    progressMap.set(entry.exerciseName, {
      first: previousEntry.first,
      latest: maxTrackedWeight,
      observations: previousEntry.observations + 1,
    });
  });

  return progressMap;
}

export function buildAdaptiveSignals(exercises = [], workoutHistory = []) {
  const { byName } = buildExerciseCatalogMaps(exercises);
  const exerciseEntries = extractExerciseEntries(workoutHistory);
  const recentEntries = exerciseEntries.slice(-18);
  const exerciseFrequency = new Map();
  const equipmentFrequency = new Map();
  const movementPatternFrequency = new Map();
  const bodyPartFrequency = new Map();
  const progressedExerciseNames = new Set();
  const stalledExerciseNames = new Set();
  const stalledAlternativeIds = new Set();
  const recentExerciseNames = new Set();

  exerciseEntries.forEach((entry) => {
    incrementMapValue(exerciseFrequency, entry.exerciseName);

    const catalogExercise = byName.get(entry.exerciseName);

    if (!catalogExercise) {
      return;
    }

    incrementMapValue(
      equipmentFrequency,
      normalizeEquipment(catalogExercise.equipment),
    );
    incrementMapValue(
      movementPatternFrequency,
      normalizeTag(catalogExercise.movementPattern),
    );
    incrementMapValue(bodyPartFrequency, normalizeTag(catalogExercise.bodyPart));
  });

  recentEntries.forEach((entry) => {
    if (entry.exerciseName) {
      recentExerciseNames.add(entry.exerciseName);
    }
  });

  buildProgressMap(exerciseEntries).forEach((progress, exerciseName) => {
    if (progress.latest > progress.first) {
      progressedExerciseNames.add(exerciseName);
      return;
    }

    if (progress.observations < 2) {
      return;
    }

    stalledExerciseNames.add(exerciseName);

    const catalogExercise = byName.get(exerciseName);

    normalizeArray(catalogExercise?.alternatives).forEach((alternativeId) => {
      const normalizedAlternativeId = normalizeTag(alternativeId);

      if (normalizedAlternativeId) {
        stalledAlternativeIds.add(normalizedAlternativeId);
      }
    });
  });

  const completedWorkoutCount = normalizeArray(workoutHistory).length;
  const trackedSetCount = exerciseEntries.reduce(
    (total, entry) =>
      total +
      normalizeArray(entry.weightsKg).filter((value) => Number.isFinite(Number(value)))
        .length,
    0,
  );

  return {
    completedWorkoutCount,
    trackedSetCount,
    exerciseFrequency,
    equipmentFrequency,
    movementPatternFrequency,
    bodyPartFrequency,
    recentExerciseNames,
    progressedExerciseNames,
    stalledExerciseNames,
    stalledAlternativeIds,
  };
}

export function buildAdaptationSummary(signals, user) {
  const summary = [];

  if (signals.completedWorkoutCount >= 8) {
    summary.push("Учитываем накопленную историю завершённых тренировок.");
  } else if (signals.completedWorkoutCount >= 3) {
    summary.push("Уже видим первые предпочтения по упражнениям и паттернам.");
  } else {
    summary.push("Пока больше опираемся на цель, уровень и безопасный базовый объём.");
  }

  if (signals.progressedExerciseNames.size > 0) {
    summary.push("Сохраняем упражнения, в которых уже заметен прогресс по весам.");
  }

  if (signals.stalledExerciseNames.size > 0) {
    summary.push("Часть движений мягко ротируем, чтобы не застревать в плато.");
  }

  if (signals.trackedSetCount > 0 && user.goal === "strength") {
    summary.push("Смещаем подбор в сторону более силовых и базовых движений.");
  }

  if (signals.trackedSetCount > 0 && user.goal === "weight_loss") {
    summary.push("Сохраняем расходные и круговые упражнения, чтобы не терять темп.");
  }

  return summary;
}
