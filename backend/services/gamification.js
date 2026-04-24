import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_DIFFICULTIES,
} from "../data/gamification/achievementCatalog.js";
import { normalizeTrainingPlanAdaptationHistory } from "./trainingPlanAdaptationHistory.js";
import {
  isProductiveWorkoutStatus,
  normalizeWorkoutHistory,
} from "./workoutHistory.js";

const RATING_TIERS = [
  { key: "starter", label: "Старт", minScore: 0 },
  { key: "bronze", label: "Бронза", minScore: 500 },
  { key: "silver", label: "Серебро", minScore: 1000 },
  { key: "gold", label: "Золото", minScore: 2000 },
  { key: "platinum", label: "Платина", minScore: 4500 },
  { key: "legend", label: "Легенда", minScore: 7000 },
];

const RARITY_PRIORITY = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const RATING_REWARD_DIVISOR = 4;

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

function clamp(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function getAchievementDifficulty(difficultyKey) {
  return (
    ACHIEVEMENT_DIFFICULTIES.find(
      (difficulty) => difficulty.key === difficultyKey,
    ) ?? ACHIEVEMENT_DIFFICULTIES[0]
  );
}

function getAchievementMetricValue(metrics, metricKey) {
  const numericValue = Number(metrics?.[metricKey]);
  return Number.isFinite(numericValue) ? Math.max(numericValue, 0) : 0;
}

function getTrackedWeightValues(workout = {}) {
  return (workout.exerciseSetWeights ?? []).flatMap((exercise) =>
    (exercise.weightsKg ?? []).filter((value) => typeof value === "number"),
  );
}

function getTrackedSetCount(workoutHistory = []) {
  return workoutHistory.reduce(
    (total, workout) => total + getTrackedWeightValues(workout).length,
    0,
  );
}

function getBestSetWeightKg(workoutHistory = []) {
  return workoutHistory.reduce((bestValue, workout) => {
    const workoutBest = Math.max(0, ...getTrackedWeightValues(workout));
    return Math.max(bestValue, workoutBest);
  }, 0);
}

function getWorkoutStreakDays(workoutHistory = [], todayDateKey) {
  const productiveWorkouts = workoutHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  );
  const uniqueDates = Array.from(
    new Set(
      productiveWorkouts
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

function countRecentProductiveWorkouts(
  workoutHistory = [],
  todayDateKey,
  windowDays = 14,
) {
  return workoutHistory.filter((workout) => {
    if (!isProductiveWorkoutStatus(workout.status)) {
      return false;
    }

    const workoutDateKey = normalizeDateKey(workout.date);
    const dayDifference = calculateDayDifference(todayDateKey, workoutDateKey);

    return (
      Number.isFinite(dayDifference) &&
      dayDifference >= 0 &&
      dayDifference < windowDays
    );
  }).length;
}

function buildAchievement({
  id,
  iconKey,
  title,
  description,
  metricKey,
  rarityKey = "common",
  rarityLabel = "Обычное",
  difficultyKey = "easy",
  difficultyLabel = "Легкие",
  unlocked,
  current = 0,
  target = 1,
  accentColor = "#01BB96",
}) {
  const safeTarget = Math.max(target, 1);
  const safeCurrent = Math.max(current, 0);

  return {
    id,
    iconKey,
    title,
    description,
    metricKey,
    rarityKey,
    rarityLabel,
    difficultyKey,
    difficultyLabel,
    unlocked: Boolean(unlocked),
    current: safeCurrent,
    target: safeTarget,
    progressPercent: clamp(
      Math.round((safeCurrent / safeTarget) * 100),
      0,
      100,
    ),
    accentColor,
  };
}

function buildAchievements(metrics) {
  const items = ACHIEVEMENT_CATALOG.map((definition) => {
    const difficulty = getAchievementDifficulty(definition.difficultyKey);
    const current = getAchievementMetricValue(metrics, definition.metricKey);
    const target = Math.max(Number(definition.target) || 1, 1);

    return buildAchievement({
      ...definition,
      metricKey: definition.metricKey,
      difficultyKey: difficulty.key,
      difficultyLabel: difficulty.label,
      current,
      target,
      unlocked: current >= target,
    });
  });

  const unlockedCount = items.filter((item) => item.unlocked).length;
  const featured = [...items]
    .sort((left, right) => {
      if (left.unlocked !== right.unlocked) {
        return left.unlocked ? -1 : 1;
      }

      const rarityDifference =
        (RARITY_PRIORITY[right.rarityKey] ?? 0) -
        (RARITY_PRIORITY[left.rarityKey] ?? 0);

      if (rarityDifference !== 0) {
        return rarityDifference;
      }

      return right.progressPercent - left.progressPercent;
    })
    .slice(0, 3);
  const nextUp =
    items
      .filter((item) => !item.unlocked)
      .sort((left, right) => {
        if (right.progressPercent !== left.progressPercent) {
          return right.progressPercent - left.progressPercent;
        }

        return (
          (RARITY_PRIORITY[right.rarityKey] ?? 0) -
          (RARITY_PRIORITY[left.rarityKey] ?? 0)
        );
      })[0] ?? null;
  const groups = ACHIEVEMENT_DIFFICULTIES.map((difficulty) => {
    const difficultyItems = items.filter(
      (item) => item.difficultyKey === difficulty.key,
    );
    const unlockedCountByDifficulty = difficultyItems.filter(
      (item) => item.unlocked,
    ).length;

    return {
      key: difficulty.key,
      label: difficulty.label,
      shortLabel: difficulty.shortLabel,
      order: difficulty.order ?? 0,
      totalCount: difficultyItems.length,
      unlockedCount: unlockedCountByDifficulty,
      completionPercent:
        difficultyItems.length > 0
          ? Math.round(
              (unlockedCountByDifficulty / difficultyItems.length) * 100,
            )
          : 0,
      items: difficultyItems,
    };
  }).filter((group) => group.totalCount > 0);

  return {
    totalCount: items.length,
    unlockedCount,
    completionPercent:
      items.length > 0 ? Math.round((unlockedCount / items.length) * 100) : 0,
    featured,
    nextUp,
    groups,
    items,
  };
}

function buildMomentum({
  recentProductiveWorkoutsCount,
  streakDays,
  skippedWorkoutsCount,
  adaptationEventsCount,
}) {
  if (recentProductiveWorkoutsCount >= 6 || streakDays >= 4) {
    return {
      key: "hot",
      label: "На волне",
      description:
        "Сессии идут плотно, серия держится, а система уже может смелее усиливать план.",
    };
  }

  if (recentProductiveWorkoutsCount >= 3 || adaptationEventsCount >= 2) {
    return {
      key: "steady",
      label: "Стабильно",
      description:
        "Прогресс устойчив: есть регулярность и достаточно данных для мягкой адаптации.",
    };
  }

  if (recentProductiveWorkoutsCount >= 1 || skippedWorkoutsCount <= 1) {
    return {
      key: "building",
      label: "Набираешь ход",
      description:
        "База уже формируется, и модели хватает сигнала для персонализации.",
    };
  }

  return {
    key: "starting",
    label: "Старт",
    description:
      "Пока это стартовый этап: чем больше завершенных тренировок и записанных весов, тем точнее рекомендации.",
  };
}

function buildRating(score) {
  const currentTier =
    [...RATING_TIERS].reverse().find((tier) => score >= tier.minScore) ??
    RATING_TIERS[0];
  const currentTierIndex = RATING_TIERS.findIndex(
    (tier) => tier.key === currentTier.key,
  );
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < RATING_TIERS.length - 1
      ? RATING_TIERS[currentTierIndex + 1]
      : null;

  if (!nextTier) {
    return {
      score,
      tierKey: currentTier.key,
      tierLabel: currentTier.label,
      nextTierKey: null,
      nextTierLabel: null,
      pointsToNextTier: 0,
      progressPercent: 100,
    };
  }

  const tierSpan = Math.max(nextTier.minScore - currentTier.minScore, 1);
  const tierProgress = clamp(
    Math.round(((score - currentTier.minScore) / tierSpan) * 100),
    0,
    100,
  );

  return {
    score,
    tierKey: currentTier.key,
    tierLabel: currentTier.label,
    nextTierKey: nextTier.key,
    nextTierLabel: nextTier.label,
    pointsToNextTier: Math.max(nextTier.minScore - score, 0),
    progressPercent: tierProgress,
  };
}

function buildGamificationMetrics(user, todayDateKey) {
  const workoutHistory = normalizeWorkoutHistory(user?.workoutHistory ?? []);
  const productiveWorkoutsCount = workoutHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  ).length;
  const completedWorkoutsCount = workoutHistory.filter(
    (workout) => workout.status === "completed",
  ).length;
  const partialWorkoutsCount = workoutHistory.filter(
    (workout) => workout.status === "partial",
  ).length;
  const skippedWorkoutsCount = workoutHistory.filter(
    (workout) => workout.status === "skipped",
  ).length;
  const trackedSetsCount = getTrackedSetCount(workoutHistory);
  const bestSetWeightKg = getBestSetWeightKg(workoutHistory);
  const streakDays = getWorkoutStreakDays(workoutHistory, todayDateKey);
  const recentProductiveWorkoutsCount = countRecentProductiveWorkouts(
    workoutHistory,
    todayDateKey,
    14,
  );
  const scheduledWorkouts = Array.isArray(user?.scheduledWorkouts)
    ? user.scheduledWorkouts
    : [];
  const totalScheduledCount = scheduledWorkouts.length + workoutHistory.length;
  const adaptationEventsCount = normalizeTrainingPlanAdaptationHistory(
    user?.trainingPlanAdaptationHistory ?? [],
  ).filter((event) => event.trigger !== "current_plan").length;
  const feedbackEventsCount = Array.isArray(user?.trainingMlFeedbackHistory)
    ? user.trainingMlFeedbackHistory.length
    : 0;
  const completedTestCount = typeof user?.lastTestScore === "number" ? 1 : 0;
  const trainingPlanCount = Boolean(
    user?.trainingPlan &&
    Array.isArray(user.trainingPlan.sessions) &&
    user.trainingPlan.sessions.length > 0,
  )
    ? 1
    : 0;
  const adaptiveMindsetProgress =
    adaptationEventsCount >= 1 ? 3 : Math.max(feedbackEventsCount, 0);

  return {
    completedTestCount,
    trainingPlanCount,
    totalScheduledCount,
    productiveWorkoutsCount,
    completedWorkoutsCount,
    partialWorkoutsCount,
    skippedWorkoutsCount,
    streakDays,
    trackedSetsCount,
    bestSetWeightKg,
    adaptationEventsCount,
    feedbackEventsCount,
    adaptiveMindsetProgress,
    recentProductiveWorkoutsCount,
  };
}

function buildRatingBreakdown(metrics, unlockedAchievementsCount) {
  const rawBreakdown = [
    {
      key: "test",
      label: "Тест",
      points: metrics.completedTestCount > 0 ? 80 : 0,
    },
    {
      key: "plan",
      label: "План",
      points: metrics.trainingPlanCount > 0 ? 120 : 0,
    },
    {
      key: "calendar",
      label: "Календарь",
      points: Math.min(metrics.totalScheduledCount * 15, 120),
    },
    {
      key: "workouts",
      label: "Тренировки",
      points: Math.min(metrics.productiveWorkoutsCount * 90, 900),
    },
    {
      key: "streak",
      label: "Серия",
      points: Math.min(metrics.streakDays * 35, 245),
    },
    {
      key: "weights",
      label: "Вес и подходы",
      points: Math.min(
        metrics.trackedSetsCount * 4 + (metrics.bestSetWeightKg > 0 ? 25 : 0),
        250,
      ),
    },
    {
      key: "adaptation",
      label: "Адаптация",
      points: Math.min(
        metrics.adaptationEventsCount * 35 + metrics.feedbackEventsCount * 8,
        180,
      ),
    },
    {
      key: "achievements",
      label: "Достижения",
      points: unlockedAchievementsCount * 30,
    },
  ];

  const breakdown = rawBreakdown.map((entry) => ({
    ...entry,
    points: Math.round(Math.max(entry.points, 0) / RATING_REWARD_DIVISOR),
  }));

  const score = breakdown.reduce(
    (total, item) => total + Math.max(item.points, 0),
    0,
  );

  return { score, breakdown };
}

export function buildUserGamificationSnapshot(
  user,
  { todayDateKey = formatDateKey(new Date()) } = {},
) {
  if (!user) {
    return null;
  }

  const metrics = buildGamificationMetrics(user, todayDateKey);
  const achievements = buildAchievements(metrics);
  const momentum = buildMomentum({
    recentProductiveWorkoutsCount: metrics.recentProductiveWorkoutsCount,
    streakDays: metrics.streakDays,
    skippedWorkoutsCount: metrics.skippedWorkoutsCount,
    adaptationEventsCount: metrics.adaptationEventsCount,
  });

  const { score, breakdown } = buildRatingBreakdown(
    metrics,
    achievements.unlockedCount,
  );
  const rating = {
    ...buildRating(score),
    breakdown,
  };

  return {
    rating,
    achievements,
    momentum,
    metrics,
    // Backward compatibility for old frontend widgets
    summary: metrics,
  };
}

export function attachGamificationSnapshot(user, options) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    gamification: buildUserGamificationSnapshot(user, options),
  };
}
