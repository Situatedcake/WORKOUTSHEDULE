import { normalizeTrainingPlanAdaptationHistory } from "./trainingPlanAdaptationHistory.js";
import {
  isProductiveWorkoutStatus,
  normalizeWorkoutHistory,
} from "./workoutHistory.js";

const RATING_TIERS = [
  { key: "starter", label: "Старт", minScore: 0 },
  { key: "bronze", label: "Бронза", minScore: 200 },
  { key: "silver", label: "Серебро", minScore: 450 },
  { key: "gold", label: "Золото", minScore: 800 },
  { key: "platinum", label: "Платина", minScore: 1200 },
  { key: "legend", label: "Легенда", minScore: 1700 },
];

const RARITY_PRIORITY = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

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
  rarityKey = "common",
  rarityLabel = "Обычное",
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
    rarityKey,
    rarityLabel,
    unlocked: Boolean(unlocked),
    current: safeCurrent,
    target: safeTarget,
    progressPercent: clamp(Math.round((safeCurrent / safeTarget) * 100), 0, 100),
    accentColor,
  };
}

function buildAchievements(context) {
  const items = [
    buildAchievement({
      id: "first_test",
      iconKey: "spark",
      title: "Первый уровень",
      description:
        "Пройти стартовый тест и получить исходный уровень подготовки.",
      rarityKey: "common",
      rarityLabel: "Обычное",
      unlocked: context.hasCompletedTest,
      current: context.hasCompletedTest ? 1 : 0,
      target: 1,
      accentColor: "#5EEAD4",
    }),
    buildAchievement({
      id: "plan_builder",
      iconKey: "blueprint",
      title: "Архитектор плана",
      description: "Сохранить первую персональную программу тренировок.",
      rarityKey: "common",
      rarityLabel: "Обычное",
      unlocked: context.hasTrainingPlan,
      current: context.hasTrainingPlan ? 1 : 0,
      target: 1,
      accentColor: "#60A5FA",
    }),
    buildAchievement({
      id: "calendar_started",
      iconKey: "calendar",
      title: "В ритме недели",
      description: "Запланировать 3 тренировки в календаре.",
      rarityKey: "rare",
      rarityLabel: "Редкое",
      unlocked: context.totalScheduledCount >= 3,
      current: context.totalScheduledCount,
      target: 3,
      accentColor: "#7DD3FC",
    }),
    buildAchievement({
      id: "scheduled_7",
      iconKey: "calendar",
      title: "Неделя под контролем",
      description:
        "Набрать 7 тренировок в расписании и истории, чтобы ритм закрепился.",
      rarityKey: "rare",
      rarityLabel: "Редкое",
      unlocked: context.totalScheduledCount >= 7,
      current: context.totalScheduledCount,
      target: 7,
      accentColor: "#38BDF8",
    }),
    buildAchievement({
      id: "first_workout",
      iconKey: "flag",
      title: "Первый финиш",
      description: "Довести хотя бы одну тренировку до результата.",
      rarityKey: "rare",
      rarityLabel: "Редкое",
      unlocked: context.productiveWorkoutsCount >= 1,
      current: context.productiveWorkoutsCount,
      target: 1,
      accentColor: "#34D399",
    }),
    buildAchievement({
      id: "partials_3",
      iconKey: "flag",
      title: "Не сдался",
      description:
        "Трижды завершить тренировку частично и всё равно сохранить прогресс.",
      rarityKey: "rare",
      rarityLabel: "Редкое",
      unlocked: context.partialWorkoutsCount >= 3,
      current: context.partialWorkoutsCount,
      target: 3,
      accentColor: "#F59E0B",
    }),
    buildAchievement({
      id: "streak_3",
      iconKey: "flame",
      title: "Серия 3 дня",
      description: "Собрать серию из 3 продуктивных дней подряд.",
      rarityKey: "epic",
      rarityLabel: "Эпичное",
      unlocked: context.streakDays >= 3,
      current: context.streakDays,
      target: 3,
      accentColor: "#F59E0B",
    }),
    buildAchievement({
      id: "workouts_10",
      iconKey: "trophy",
      title: "10 тренировок",
      description: "Набрать 10 продуктивных тренировок в истории.",
      rarityKey: "epic",
      rarityLabel: "Эпичное",
      unlocked: context.productiveWorkoutsCount >= 10,
      current: context.productiveWorkoutsCount,
      target: 10,
      accentColor: "#FACC15",
    }),
    buildAchievement({
      id: "workouts_25",
      iconKey: "trophy",
      title: "25 тренировок",
      description:
        "Закрепить привычку и дойти до 25 продуктивных тренировок.",
      rarityKey: "legendary",
      rarityLabel: "Легендарное",
      unlocked: context.productiveWorkoutsCount >= 25,
      current: context.productiveWorkoutsCount,
      target: 25,
      accentColor: "#F97316",
    }),
    buildAchievement({
      id: "tracked_sets_12",
      iconKey: "dumbbell",
      title: "Вес под контролем",
      description: "Записать рабочий вес минимум в 12 подходах.",
      rarityKey: "epic",
      rarityLabel: "Эпичное",
      unlocked: context.trackedSetsCount >= 12,
      current: context.trackedSetsCount,
      target: 12,
      accentColor: "#C084FC",
    }),
    buildAchievement({
      id: "best_weight_50",
      iconKey: "dumbbell",
      title: "Первая тяжёлая отметка",
      description: "Дойти хотя бы до 50 кг в одном зафиксированном подходе.",
      rarityKey: "legendary",
      rarityLabel: "Легендарное",
      unlocked: context.bestSetWeightKg >= 50,
      current: context.bestSetWeightKg,
      target: 50,
      accentColor: "#FB7185",
    }),
    buildAchievement({
      id: "adaptive_mindset",
      iconKey: "brain",
      title: "Адаптивный подход",
      description:
        "Получить первое обновление плана или накопить 3 сигнала поведения для модели.",
      rarityKey: "legendary",
      rarityLabel: "Легендарное",
      unlocked:
        context.adaptationEventsCount >= 1 || context.feedbackEventsCount >= 3,
      current:
        context.adaptationEventsCount >= 1
          ? 3
          : Math.max(context.feedbackEventsCount, 0),
      target: 3,
      accentColor: "#A78BFA",
    }),
  ];

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

  return {
    totalCount: items.length,
    unlockedCount,
    completionPercent:
      items.length > 0 ? Math.round((unlockedCount / items.length) * 100) : 0,
    featured,
    nextUp,
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
        "Прогресс уже выглядит устойчиво: есть регулярность и достаточно данных для мягкой адаптации.",
    };
  }

  if (recentProductiveWorkoutsCount >= 1 || skippedWorkoutsCount <= 1) {
    return {
      key: "building",
      label: "Набираешь ход",
      description:
        "База собирается, привычка уже формируется, а модели начинает хватать сигнала для персонализации.",
    };
  }

  return {
    key: "starting",
    label: "Старт",
    description:
      "Пока это стартовый этап: чем больше завершённых тренировок и записанных весов, тем точнее будут рекомендации.",
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

export function buildUserGamificationSnapshot(
  user,
  { todayDateKey = formatDateKey(new Date()) } = {},
) {
  if (!user) {
    return null;
  }

  const workoutHistory = normalizeWorkoutHistory(user.workoutHistory ?? []);
  const productiveWorkouts = workoutHistory.filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  );
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
  const scheduledWorkouts = Array.isArray(user.scheduledWorkouts)
    ? user.scheduledWorkouts
    : [];
  const totalScheduledCount = scheduledWorkouts.length + workoutHistory.length;
  const adaptationEventsCount = normalizeTrainingPlanAdaptationHistory(
    user.trainingPlanAdaptationHistory ?? [],
  ).filter((event) => event.trigger !== "current_plan").length;
  const feedbackEventsCount = Array.isArray(user.trainingMlFeedbackHistory)
    ? user.trainingMlFeedbackHistory.length
    : 0;
  const hasCompletedTest = typeof user.lastTestScore === "number";
  const hasTrainingPlan = Boolean(
    user.trainingPlan &&
      Array.isArray(user.trainingPlan.sessions) &&
      user.trainingPlan.sessions.length > 0,
  );

  const achievements = buildAchievements({
    hasCompletedTest,
    hasTrainingPlan,
    totalScheduledCount,
    productiveWorkoutsCount: productiveWorkouts.length,
    partialWorkoutsCount,
    streakDays,
    trackedSetsCount,
    bestSetWeightKg,
    adaptationEventsCount,
    feedbackEventsCount,
  });

  const momentum = buildMomentum({
    recentProductiveWorkoutsCount,
    streakDays,
    skippedWorkoutsCount,
    adaptationEventsCount,
  });

  const ratingBreakdown = [
    {
      key: "test",
      label: "Тест",
      points: hasCompletedTest ? 80 : 0,
    },
    {
      key: "plan",
      label: "План",
      points: hasTrainingPlan ? 120 : 0,
    },
    {
      key: "calendar",
      label: "Календарь",
      points: Math.min(totalScheduledCount * 15, 120),
    },
    {
      key: "workouts",
      label: "Тренировки",
      points: Math.min(productiveWorkouts.length * 90, 900),
    },
    {
      key: "streak",
      label: "Серия",
      points: Math.min(streakDays * 35, 245),
    },
    {
      key: "weights",
      label: "Вес и подходы",
      points: Math.min(trackedSetsCount * 4 + (bestSetWeightKg > 0 ? 25 : 0), 250),
    },
    {
      key: "adaptation",
      label: "Адаптация",
      points: Math.min(adaptationEventsCount * 35 + feedbackEventsCount * 8, 180),
    },
    {
      key: "achievements",
      label: "Достижения",
      points: achievements.unlockedCount * 30,
    },
  ];

  const score = ratingBreakdown.reduce(
    (total, item) => total + Math.max(item.points, 0),
    0,
  );
  const rating = {
    ...buildRating(score),
    breakdown: ratingBreakdown,
  };

  return {
    rating,
    achievements,
    momentum,
    summary: {
      streakDays,
      productiveWorkoutsCount: productiveWorkouts.length,
      recentProductiveWorkoutsCount,
      completedWorkoutsCount,
      partialWorkoutsCount,
      skippedWorkoutsCount,
      trackedSetsCount,
      bestSetWeightKg,
      totalScheduledCount,
      adaptationEventsCount,
      feedbackEventsCount,
    },
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
