function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function toTimestamp(dateKey) {
  if (!dateKey) {
    return Number.NaN;
  }

  return new Date(`${dateKey}T00:00:00`).getTime();
}

function calculateDayDifference(leftDateKey, rightDateKey) {
  const leftTimestamp = toTimestamp(leftDateKey);
  const rightTimestamp = toTimestamp(rightDateKey);

  if (!Number.isFinite(leftTimestamp) || !Number.isFinite(rightTimestamp)) {
    return Number.NaN;
  }

  return Math.round((leftTimestamp - rightTimestamp) / (1000 * 60 * 60 * 24));
}

function isProductiveWorkoutStatus(status) {
  return status === "completed" || status === "partial";
}

function isTrackedWeightValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().replace(",", ".");

    if (!normalizedValue) {
      return false;
    }

    return Number.isFinite(Number(normalizedValue));
  }

  return false;
}

function countCompletedTrackedSets(
  completedSetsByExercise = [],
  setWeightsByExercise = [],
) {
  return completedSetsByExercise.reduce((total, completedSetsCount, exerciseIndex) => {
    const weights = Array.isArray(setWeightsByExercise?.[exerciseIndex])
      ? setWeightsByExercise[exerciseIndex]
      : [];
    const safeCompletedSetsCount = Math.max(Number(completedSetsCount) || 0, 0);
    const trackedSetsCount = weights
      .slice(0, safeCompletedSetsCount)
      .filter(isTrackedWeightValue).length;

    return total + trackedSetsCount;
  }, 0);
}

function getBestTrackedWeightInSession(
  completedSetsByExercise = [],
  setWeightsByExercise = [],
) {
  return completedSetsByExercise.reduce((bestWeight, completedSetsCount, exerciseIndex) => {
    const weights = Array.isArray(setWeightsByExercise?.[exerciseIndex])
      ? setWeightsByExercise[exerciseIndex]
      : [];
    const safeCompletedSetsCount = Math.max(Number(completedSetsCount) || 0, 0);
    const nextBestWeight = weights
      .slice(0, safeCompletedSetsCount)
      .filter(isTrackedWeightValue)
      .reduce((bestValue, currentValue) => {
        const numericValue =
          typeof currentValue === "number"
            ? currentValue
            : Number(String(currentValue).trim().replace(",", "."));

        return Number.isFinite(numericValue)
          ? Math.max(bestValue, numericValue)
          : bestValue;
      }, 0);

    return Math.max(bestWeight, nextBestWeight);
  }, 0);
}

function getProjectedStreakDays({
  currentUser,
  referenceDate,
  willAddProductiveWorkout,
}) {
  const productiveDates = Array.from(
    new Set(
      (currentUser?.workoutHistory ?? [])
        .filter((workout) => isProductiveWorkoutStatus(workout.status))
        .map((workout) => normalizeDateKey(workout.date))
        .filter(Boolean),
    ),
  );
  const todayDateKey = formatDateKey(referenceDate);

  if (willAddProductiveWorkout) {
    productiveDates.push(todayDateKey);
  }

  const uniqueDates = Array.from(new Set(productiveDates)).sort((left, right) =>
    right.localeCompare(left),
  );

  if (!uniqueDates.length) {
    return 0;
  }

  const latestDateKey = uniqueDates[0];
  const canUseLatestAsReference =
    latestDateKey === todayDateKey ||
    calculateDayDifference(todayDateKey, latestDateKey) === 1;

  if (!canUseLatestAsReference) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previousDateKey = uniqueDates[index - 1];
    const currentDateKey = uniqueDates[index];

    if (calculateDayDifference(previousDateKey, currentDateKey) !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function getNumberMetric(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(numericValue, 0) : 0;
}

function resolveMetricKey(achievement = {}) {
  if (typeof achievement.metricKey === "string" && achievement.metricKey.trim()) {
    return achievement.metricKey.trim();
  }

  // Backward compatibility for old snapshots without metricKey
  const fallbackById = {
    tracked_sets_12: "trackedSetsCount",
    best_weight_50: "bestSetWeightKg",
    first_workout: "productiveWorkoutsCount",
    workouts_10: "productiveWorkoutsCount",
    workouts_25: "productiveWorkoutsCount",
    streak_3: "streakDays",
  };

  return fallbackById[achievement.id] ?? "";
}

function buildAchievementMeta(definition = {}) {
  return {
    id: definition.id,
    iconKey: definition.iconKey,
    title: definition.title,
    description: definition.description,
    accentColor: definition.accentColor,
    rarityKey: definition.rarityKey ?? "common",
    rarityLabel: definition.rarityLabel ?? "Обычное",
  };
}

function buildProjectedMetrics({
  currentUser,
  metrics,
  completedSetsByExercise,
  setWeightsByExercise,
  willCompleteWorkout,
  workoutStatus,
  referenceDate,
}) {
  const willBeProductive =
    willCompleteWorkout && isProductiveWorkoutStatus(workoutStatus);
  const trackedSetsInSession = countCompletedTrackedSets(
    completedSetsByExercise,
    setWeightsByExercise,
  );
  const bestTrackedWeightInSession = getBestTrackedWeightInSession(
    completedSetsByExercise,
    setWeightsByExercise,
  );

  return {
    completedTestCount: getNumberMetric(metrics.completedTestCount),
    trainingPlanCount: getNumberMetric(metrics.trainingPlanCount),
    totalScheduledCount: getNumberMetric(metrics.totalScheduledCount),
    productiveWorkoutsCount:
      getNumberMetric(metrics.productiveWorkoutsCount) + (willBeProductive ? 1 : 0),
    partialWorkoutsCount:
      getNumberMetric(metrics.partialWorkoutsCount) +
      (willCompleteWorkout && workoutStatus === "partial" ? 1 : 0),
    completedWorkoutsCount:
      getNumberMetric(metrics.completedWorkoutsCount) +
      (willCompleteWorkout && workoutStatus === "completed" ? 1 : 0),
    streakDays: getProjectedStreakDays({
      currentUser,
      referenceDate,
      willAddProductiveWorkout: willBeProductive,
    }),
    trackedSetsCount: getNumberMetric(metrics.trackedSetsCount) + trackedSetsInSession,
    bestSetWeightKg: Math.max(
      getNumberMetric(metrics.bestSetWeightKg),
      bestTrackedWeightInSession,
    ),
    adaptationEventsCount: getNumberMetric(metrics.adaptationEventsCount),
    feedbackEventsCount: getNumberMetric(metrics.feedbackEventsCount),
    adaptiveMindsetProgress: getNumberMetric(metrics.adaptiveMindsetProgress),
  };
}

export function getUnlockedAchievementIds(gamification) {
  return new Set(
    (gamification?.achievements?.items ?? [])
      .filter((item) => item.unlocked)
      .map((item) => item.id),
  );
}

export function buildLiveWorkoutAchievementUnlocks({
  currentUser,
  completedSetsByExercise = [],
  setWeightsByExercise = [],
  willCompleteWorkout = false,
  workoutStatus = "completed",
  referenceDate = new Date(),
}) {
  const gamification = currentUser?.gamification;
  const achievements = gamification?.achievements?.items ?? [];

  if (!currentUser || !gamification || achievements.length === 0) {
    return [];
  }

  const unlockedIds = getUnlockedAchievementIds(gamification);
  const metrics = gamification.metrics ?? gamification.summary ?? {};
  const projectedMetrics = buildProjectedMetrics({
    currentUser,
    metrics,
    completedSetsByExercise,
    setWeightsByExercise,
    willCompleteWorkout,
    workoutStatus,
    referenceDate,
  });

  const unlocks = [];

  for (const achievement of achievements) {
    if (!achievement?.id || unlockedIds.has(achievement.id) || achievement.unlocked) {
      continue;
    }

    const metricKey = resolveMetricKey(achievement);
    const target = Math.max(getNumberMetric(achievement.target), 1);
    const currentValue = metricKey
      ? getNumberMetric(projectedMetrics[metricKey])
      : getNumberMetric(achievement.current);

    if (currentValue < target) {
      continue;
    }

    unlocks.push(buildAchievementMeta(achievement));
  }

  return unlocks;
}
