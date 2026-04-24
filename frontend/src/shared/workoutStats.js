function normalizeDateKey(value) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function isProductiveWorkoutStatus(status) {
  return status === "completed" || status === "partial" || !status;
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

function isDateKeyInsidePeriod(dateKey, currentDateKey, periodDays) {
  if (!periodDays) {
    return true;
  }

  if (!dateKey) {
    return false;
  }

  const dayDifference = calculateDayDifference(currentDateKey, dateKey);

  return Number.isFinite(dayDifference) && dayDifference >= 0 && dayDifference < periodDays;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getWeekStartDate(value) {
  const date =
    value instanceof Date
      ? new Date(value)
      : new Date(`${normalizeDateKey(value)}T00:00:00`);
  const weekDay = date.getDay();
  const offset = weekDay === 0 ? -6 : 1 - weekDay;
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatChartLabel(date) {
  const chartDate = date instanceof Date ? date : new Date(date);
  const day = String(chartDate.getDate()).padStart(2, "0");
  const month = String(chartDate.getMonth() + 1).padStart(2, "0");

  return `${day}.${month}`;
}

function formatDateKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeNumber(value, fallbackValue = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function normalizeString(value, fallbackValue = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
}

function buildTrainingPlanVolumeBreakdown(trainingPlan = null) {
  const result = {
    progressing: 0,
    stalled: 0,
    manual: 0,
    base: 0,
  };

  (trainingPlan?.sessions ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((exercise) => {
      const trend = normalizeString(exercise?.volumeTrend, "base");

      if (!Object.hasOwn(result, trend)) {
        result.base += 1;
        return;
      }

      result[trend] += 1;
    });
  });

  return result;
}

function normalizeAdaptationEvent(event = {}) {
  const volumeBreakdown = {
    progressing: normalizeNumber(event.volumeBreakdown?.progressing, 0),
    stalled: normalizeNumber(event.volumeBreakdown?.stalled, 0),
    manual: normalizeNumber(event.volumeBreakdown?.manual, 0),
    base: normalizeNumber(event.volumeBreakdown?.base, 0),
  };
  const totalExercises =
    normalizeNumber(event.totalExercises, 0) ||
    Object.values(volumeBreakdown).reduce((total, value) => total + value, 0);

  return {
    id: normalizeString(event.id, `adaptation_${Date.now()}`),
    createdAt: normalizeString(event.createdAt, new Date().toISOString()),
    trigger: normalizeString(event.trigger, "manual_update"),
    changedExercisesCount: normalizeNumber(event.changedExercisesCount, 0),
    totalExercises,
    volumeBreakdown,
    adaptationSummary: Array.isArray(event.adaptationSummary)
      ? event.adaptationSummary.filter(
          (item) => typeof item === "string" && item.trim(),
        )
      : [],
  };
}

function normalizeAdaptationHistory(history = []) {
  return Array.isArray(history)
    ? history
        .map(normalizeAdaptationEvent)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    : [];
}

export function getTrackedWeightValues(workout = {}) {
  return (workout.exerciseSetWeights ?? []).flatMap((exercise) =>
    (exercise.weightsKg ?? []).filter((value) => typeof value === "number"),
  );
}

export function calculateWorkoutTrackedWeight(workout = {}) {
  return getTrackedWeightValues(workout).reduce(
    (total, value) => total + value,
    0,
  );
}

export function getLatestRecordedWeight(workoutHistory = []) {
  for (let index = workoutHistory.length - 1; index >= 0; index -= 1) {
    const weightKg = workoutHistory[index]?.metrics?.weightKg;

    if (typeof weightKg === "number") {
      return weightKg;
    }
  }

  return null;
}

export function getPersonalBestSetWeight(workoutHistory = []) {
  return workoutHistory.reduce((bestValue, workout) => {
    const workoutBest = Math.max(0, ...getTrackedWeightValues(workout));
    return Math.max(bestValue, workoutBest);
  }, 0);
}

export function getTrackedSetCount(workoutHistory = []) {
  return workoutHistory.reduce(
    (total, workout) => total + getTrackedWeightValues(workout).length,
    0,
  );
}

export function getAverageWorkoutDurationMinutes(workoutHistory = []) {
  const productiveWorkouts = workoutHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  );

  if (!productiveWorkouts.length) {
    return 0;
  }

  const totalDurationSeconds = productiveWorkouts.reduce(
    (total, workout) =>
      total + (workout.actualDurationSeconds ?? workout.durationSeconds ?? 0),
    0,
  );

  return Math.round(totalDurationSeconds / productiveWorkouts.length / 60);
}

export function getWorkoutStreakDays(workoutHistory = [], todayDateKey) {
  const uniqueDates = Array.from(
    new Set(
      workoutHistory
        .filter((workout) => isProductiveWorkoutStatus(workout.status))
        .map((workout) => normalizeDateKey(workout.date))
        .filter(Boolean),
    ),
  ).sort((left, right) => right.localeCompare(left));

  if (!uniqueDates.length) {
    return 0;
  }

  const referenceDateKey =
    uniqueDates[0] === todayDateKey ||
    calculateDayDifference(todayDateKey, uniqueDates[0]) === 1
      ? uniqueDates[0]
      : null;

  if (!referenceDateKey) {
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

export function getTopExercisesByTrackedWeight(workoutHistory = [], limit = 3) {
  const exerciseMap = new Map();

  workoutHistory.forEach((workout) => {
    (workout.exerciseSetWeights ?? []).forEach((exercise) => {
      const currentEntry = exerciseMap.get(exercise.exerciseName) ?? {
        exerciseName: exercise.exerciseName,
        trackedSets: 0,
        totalTrackedWeight: 0,
        bestSetWeight: 0,
      };
      const weightValues = (exercise.weightsKg ?? []).filter(
        (value) => typeof value === "number",
      );

      exerciseMap.set(exercise.exerciseName, {
        exerciseName: exercise.exerciseName,
        trackedSets: currentEntry.trackedSets + weightValues.length,
        totalTrackedWeight:
          currentEntry.totalTrackedWeight +
          weightValues.reduce((total, value) => total + value, 0),
        bestSetWeight: Math.max(currentEntry.bestSetWeight, ...weightValues, 0),
      });
    });
  });

  return Array.from(exerciseMap.values())
    .filter((exercise) => exercise.trackedSets > 0)
    .sort((left, right) => {
      if (right.totalTrackedWeight !== left.totalTrackedWeight) {
        return right.totalTrackedWeight - left.totalTrackedWeight;
      }

      return right.bestSetWeight - left.bestSetWeight;
    })
    .slice(0, limit);
}

function getTopSkippedExercises(workoutHistory = [], limit = 6) {
  const skippedMap = new Map();

  workoutHistory.forEach((workout) => {
    (workout.exerciseSetWeights ?? []).forEach((exercise) => {
      const isSkipped =
        exercise?.status === "skipped" || exercise?.isSkipped === true;

      if (!isSkipped) {
        return;
      }

      const exerciseName =
        typeof exercise.exerciseName === "string" && exercise.exerciseName.trim()
          ? exercise.exerciseName.trim()
          : "Упражнение";
      const currentEntry = skippedMap.get(exerciseName) ?? {
        exerciseName,
        skippedCount: 0,
        lastSkippedAt: null,
      };
      const skippedAt = workout.completedAt ?? workout.date ?? null;

      skippedMap.set(exerciseName, {
        exerciseName,
        skippedCount: currentEntry.skippedCount + 1,
        lastSkippedAt: skippedAt,
      });
    });
  });

  return Array.from(skippedMap.values())
    .sort((left, right) => {
      if (right.skippedCount !== left.skippedCount) {
        return right.skippedCount - left.skippedCount;
      }

      const leftDate = String(left.lastSkippedAt ?? "");
      const rightDate = String(right.lastSkippedAt ?? "");
      return rightDate.localeCompare(leftDate);
    })
    .slice(0, limit)
    .map((item) => ({
      ...item,
      label: item.exerciseName,
      value: item.skippedCount,
    }));
}

function buildLoadTrend(workoutHistory = [], currentDateKey, bucketCount = 6) {
  const productiveWorkouts = workoutHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  );
  const currentWeekStart = getWeekStartDate(currentDateKey);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const weekStart = addDays(
      currentWeekStart,
      -7 * (bucketCount - index - 1),
    );

    return {
      weekStartKey: formatDateKeyFromDate(weekStart),
      label: formatChartLabel(weekStart),
      totalMinutes: 0,
      productiveWorkouts: 0,
      trackedWeightKg: 0,
      calories: 0,
    };
  });
  const bucketMap = new Map(
    buckets.map((bucket) => [bucket.weekStartKey, bucket]),
  );

  productiveWorkouts.forEach((workout) => {
    const workoutDateKey = normalizeDateKey(workout.date);

    if (!workoutDateKey) {
      return;
    }

    const weekStartKey = formatDateKeyFromDate(getWeekStartDate(workoutDateKey));
    const bucket = bucketMap.get(weekStartKey);

    if (!bucket) {
      return;
    }

    bucket.totalMinutes += Math.round(
      (workout.actualDurationSeconds ?? workout.durationSeconds ?? 0) / 60,
    );
    bucket.productiveWorkouts += 1;
    bucket.trackedWeightKg += calculateWorkoutTrackedWeight(workout);
    bucket.calories += workout.metrics?.burnedCalories ?? 0;
  });

  return buckets;
}

function buildProgressTrend(workoutHistory = [], limit = 6) {
  return workoutHistory
    .filter((workout) => isProductiveWorkoutStatus(workout.status))
    .map((workout) => {
      const bestSetWeightKg = Math.max(0, ...getTrackedWeightValues(workout));
      const trackedWeightKg = calculateWorkoutTrackedWeight(workout);

      return {
        id: workout.id ?? `${workout.date}_${workout.time}`,
        label: formatChartLabel(workout.date),
        bestSetWeightKg,
        trackedWeightKg,
        bodyWeightKg: workout.metrics?.weightKg ?? null,
        metric:
          bestSetWeightKg > 0
            ? "best_set_weight"
            : trackedWeightKg > 0
              ? "tracked_weight"
              : "body_weight",
        value:
          bestSetWeightKg > 0
            ? bestSetWeightKg
            : trackedWeightKg > 0
              ? trackedWeightKg
              : workout.metrics?.weightKg ?? 0,
      };
    })
    .filter(
      (point) =>
        point.bestSetWeightKg > 0 ||
        point.trackedWeightKg > 0 ||
        point.bodyWeightKg != null,
    )
    .slice(-limit);
}

function buildCurrentPlanAdaptationSnapshot(trainingPlan = null) {
  const volumeBreakdown = buildTrainingPlanVolumeBreakdown(trainingPlan);
  const totalExercises = Object.values(volumeBreakdown).reduce(
    (total, value) => total + value,
    0,
  );

  if (!totalExercises) {
    return [];
  }

  return [
    {
      id: trainingPlan?.id ?? "current_plan",
      createdAt: trainingPlan?.createdAt ?? new Date().toISOString(),
      trigger: "current_plan",
      changedExercisesCount:
        volumeBreakdown.progressing +
        volumeBreakdown.stalled +
        volumeBreakdown.manual,
      totalExercises,
      volumeBreakdown,
      adaptationSummary: [],
    },
  ];
}

function buildAdaptationTrend(
  trainingPlanAdaptationHistory = [],
  trainingPlan = null,
  limit = 6,
) {
  const normalizedHistory = normalizeAdaptationHistory(
    trainingPlanAdaptationHistory,
  );
  const sourceHistory =
    normalizedHistory.length > 0
      ? normalizedHistory.slice(-limit)
      : buildCurrentPlanAdaptationSnapshot(trainingPlan);

  return sourceHistory.map((event, index) => ({
    id: event.id,
    label:
      index === sourceHistory.length - 1 && normalizedHistory.length === 0
        ? "Сейчас"
        : formatChartLabel(event.createdAt),
    trigger: event.trigger,
    changedExercisesCount: event.changedExercisesCount,
    totalExercises: event.totalExercises,
    progressing: event.volumeBreakdown.progressing ?? 0,
    stalled: event.volumeBreakdown.stalled ?? 0,
    manual: event.volumeBreakdown.manual ?? 0,
    base: event.volumeBreakdown.base ?? 0,
    adaptationSummary: event.adaptationSummary ?? [],
    createdAt: event.createdAt,
  }));
}

export function buildWorkoutStats(
  workoutHistory = [],
  todayDateKey,
  options = {},
) {
  const trainingPlanAdaptationHistory =
    options.trainingPlanAdaptationHistory ?? [];
  const trainingPlan = options.trainingPlan ?? null;
  const periodDays = options.periodDays ?? null;
  const filteredWorkoutHistory = periodDays
    ? workoutHistory.filter((workout) =>
        isDateKeyInsidePeriod(
          normalizeDateKey(workout.date),
          todayDateKey,
          periodDays,
        ),
      )
    : workoutHistory;
  const statusBreakdown = filteredWorkoutHistory.reduce(
    (result, workout) => {
      const status = workout.status ?? "completed";
      result[status] = (result[status] ?? 0) + 1;
      return result;
    },
    { completed: 0, partial: 0, skipped: 0, canceled: 0 },
  );
  const productiveWorkouts = filteredWorkoutHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  );
  const totalCompleted = statusBreakdown.completed;
  const currentMonth = todayDateKey.slice(0, 7);
  const completedThisMonth = productiveWorkouts.filter((workout) =>
    normalizeDateKey(workout.date).startsWith(currentMonth),
  );
  const caloriesThisMonth = completedThisMonth.reduce(
    (total, workout) => total + (workout.metrics?.burnedCalories ?? 0),
    0,
  );
  const latestWorkout = filteredWorkoutHistory.at(-1) ?? null;
  const totalLogged = filteredWorkoutHistory.length;
  const normalizedAdaptationHistory = normalizeAdaptationHistory(
    trainingPlanAdaptationHistory,
  );
  const filteredAdaptationHistory = periodDays
    ? normalizedAdaptationHistory.filter((event) =>
        isDateKeyInsidePeriod(
          normalizeDateKey(event.createdAt),
          todayDateKey,
          periodDays,
        ),
      )
    : normalizedAdaptationHistory;

  return {
    totalCompleted,
    totalPartial: statusBreakdown.partial,
    totalSkipped: statusBreakdown.skipped,
    totalCanceled: statusBreakdown.canceled,
    totalLogged,
    completionRate: totalLogged
      ? Math.round(
          ((statusBreakdown.completed + statusBreakdown.partial) / totalLogged) *
            100,
        )
      : 0,
    completedThisMonthCount: completedThisMonth.length,
    partialThisMonthCount: completedThisMonth.filter(
      (workout) => workout.status === "partial",
    ).length,
    caloriesThisMonth,
    latestWorkout,
    averageDurationMinutes: getAverageWorkoutDurationMinutes(productiveWorkouts),
    streakDays: getWorkoutStreakDays(productiveWorkouts, todayDateKey),
    latestRecordedWeightKg: getLatestRecordedWeight(filteredWorkoutHistory),
    trackedSetCount: getTrackedSetCount(productiveWorkouts),
    personalBestSetWeightKg: getPersonalBestSetWeight(productiveWorkouts),
    totalTrackedWeightKg: productiveWorkouts.reduce(
      (total, workout) => total + calculateWorkoutTrackedWeight(workout),
      0,
    ),
    topExercises: getTopExercisesByTrackedWeight(productiveWorkouts),
    topSkippedExercises: getTopSkippedExercises(filteredWorkoutHistory),
    recentWorkouts: filteredWorkoutHistory.slice(-6).reverse(),
    statusBreakdown,
    loadTrend: buildLoadTrend(productiveWorkouts, todayDateKey),
    progressTrend: buildProgressTrend(filteredWorkoutHistory),
    adaptationTrend: buildAdaptationTrend(
      filteredAdaptationHistory,
      trainingPlan,
    ),
    totalAdaptationsCount: filteredAdaptationHistory.length,
  };
}
