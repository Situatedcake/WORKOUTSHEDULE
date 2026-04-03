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

function willUnlockStreakThree(currentUser, referenceDate) {
  const currentStreakDays =
    Number(currentUser?.gamification?.summary?.streakDays) || 0;

  if (currentStreakDays >= 3) {
    return false;
  }

  const productiveDates = Array.from(
    new Set(
      (currentUser?.workoutHistory ?? [])
        .filter((workout) => isProductiveWorkoutStatus(workout.status))
        .map((workout) => normalizeDateKey(workout.date))
        .filter(Boolean),
    ),
  ).sort((left, right) => right.localeCompare(left));

  if (!productiveDates.length) {
    return false;
  }

  const todayDateKey = formatDateKey(referenceDate);

  if (productiveDates.includes(todayDateKey)) {
    return false;
  }

  return (
    currentStreakDays >= 2 &&
    calculateDayDifference(todayDateKey, productiveDates[0]) === 1
  );
}

function buildAchievementMeta({
  id,
  iconKey,
  title,
  description,
  accentColor,
  rarityKey = "common",
  rarityLabel = "Обычное",
}) {
  return {
    id,
    iconKey,
    title,
    description,
    accentColor,
    rarityKey,
    rarityLabel,
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

  if (!currentUser || !gamification) {
    return [];
  }

  const unlockedIds = getUnlockedAchievementIds(gamification);
  const summary = gamification.summary ?? {};
  const unlocks = [];

  const trackedSetsCount =
    (Number(summary.trackedSetsCount) || 0) +
    countCompletedTrackedSets(completedSetsByExercise, setWeightsByExercise);
  const bestTrackedWeightKg = Math.max(
    Number(summary.bestSetWeightKg) || 0,
    getBestTrackedWeightInSession(completedSetsByExercise, setWeightsByExercise),
  );

  if (!unlockedIds.has("tracked_sets_12") && trackedSetsCount >= 12) {
    unlocks.push(
      buildAchievementMeta({
        id: "tracked_sets_12",
        iconKey: "dumbbell",
        title: "Вес под контролем",
        description: "Записано 12 подходов с рабочим весом.",
        accentColor: "#C084FC",
        rarityKey: "epic",
        rarityLabel: "Эпичное",
      }),
    );
  }

  if (!unlockedIds.has("best_weight_50") && bestTrackedWeightKg >= 50) {
    unlocks.push(
      buildAchievementMeta({
        id: "best_weight_50",
        iconKey: "dumbbell",
        title: "Первая тяжёлая отметка",
        description: "В одном из подходов уже зафиксировано 50 кг и выше.",
        accentColor: "#FB7185",
        rarityKey: "legendary",
        rarityLabel: "Легендарное",
      }),
    );
  }

  const willBeProductive =
    willCompleteWorkout && isProductiveWorkoutStatus(workoutStatus);

  if (!willBeProductive) {
    return unlocks;
  }

  const productiveWorkoutsCount =
    (Number(summary.productiveWorkoutsCount) || 0) + 1;

  if (!unlockedIds.has("first_workout") && productiveWorkoutsCount >= 1) {
    unlocks.push(
      buildAchievementMeta({
        id: "first_workout",
        iconKey: "flag",
        title: "Первый финиш",
        description: "Ты довёл первую тренировку до результата.",
        accentColor: "#34D399",
        rarityKey: "rare",
        rarityLabel: "Редкое",
      }),
    );
  }

  if (!unlockedIds.has("workouts_10") && productiveWorkoutsCount >= 10) {
    unlocks.push(
      buildAchievementMeta({
        id: "workouts_10",
        iconKey: "trophy",
        title: "10 тренировок",
        description: "В истории уже 10 продуктивных сессий.",
        accentColor: "#FACC15",
        rarityKey: "epic",
        rarityLabel: "Эпичное",
      }),
    );
  }

  if (!unlockedIds.has("workouts_25") && productiveWorkoutsCount >= 25) {
    unlocks.push(
      buildAchievementMeta({
        id: "workouts_25",
        iconKey: "trophy",
        title: "25 тренировок",
        description: "Уже накоплено 25 продуктивных тренировок.",
        accentColor: "#F97316",
        rarityKey: "legendary",
        rarityLabel: "Легендарное",
      }),
    );
  }

  if (!unlockedIds.has("streak_3") && willUnlockStreakThree(currentUser, referenceDate)) {
    unlocks.push(
      buildAchievementMeta({
        id: "streak_3",
        iconKey: "flame",
        title: "Серия 3 дня",
        description: "Собрана серия из трёх продуктивных дней подряд.",
        accentColor: "#F59E0B",
        rarityKey: "epic",
        rarityLabel: "Эпичное",
      }),
    );
  }

  return unlocks;
}
