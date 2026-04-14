import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ACHIEVEMENT_DIFFICULTIES = [
  {
    key: "easy",
    label: "Легкие",
    shortLabel: "Легко",
    order: 1,
  },
  {
    key: "medium",
    label: "Средние",
    shortLabel: "Средне",
    order: 2,
  },
  {
    key: "hard",
    label: "Сложные",
    shortLabel: "Сложно",
    order: 3,
  },
];

const DEFAULT_ACHIEVEMENT_CATALOG = [
  {
    id: "first_test",
    iconKey: "spark",
    title: "Первый уровень",
    description:
      "Пройти стартовый тест и получить исходный уровень подготовки.",
    rarityKey: "common",
    rarityLabel: "Обычное",
    difficultyKey: "easy",
    metricKey: "completedTestCount",
    target: 1,
    accentColor: "#5EEAD4",
  },
  {
    id: "plan_builder",
    iconKey: "blueprint",
    title: "Архитектор плана",
    description: "Сохранить первую персональную программу тренировок.",
    rarityKey: "common",
    rarityLabel: "Обычное",
    difficultyKey: "easy",
    metricKey: "trainingPlanCount",
    target: 1,
    accentColor: "#60A5FA",
  },
  {
    id: "calendar_started",
    iconKey: "calendar",
    title: "В ритме недели",
    description: "Запланировать 3 тренировки в календаре.",
    rarityKey: "rare",
    rarityLabel: "Редкое",
    difficultyKey: "easy",
    metricKey: "totalScheduledCount",
    target: 3,
    accentColor: "#7DD3FC",
  },
  {
    id: "first_workout",
    iconKey: "flag",
    title: "Первый финиш",
    description: "Довести хотя бы одну тренировку до результата.",
    rarityKey: "rare",
    rarityLabel: "Редкое",
    difficultyKey: "easy",
    metricKey: "productiveWorkoutsCount",
    target: 1,
    accentColor: "#34D399",
  },
  {
    id: "scheduled_7",
    iconKey: "calendar",
    title: "Неделя под контролем",
    description:
      "Набрать 7 тренировок в расписании и истории, чтобы ритм закрепился.",
    rarityKey: "rare",
    rarityLabel: "Редкое",
    difficultyKey: "medium",
    metricKey: "totalScheduledCount",
    target: 7,
    accentColor: "#38BDF8",
  },
  {
    id: "partials_3",
    iconKey: "flag",
    title: "Не сдался",
    description:
      "Трижды завершить тренировку частично и все равно сохранить прогресс.",
    rarityKey: "rare",
    rarityLabel: "Редкое",
    difficultyKey: "medium",
    metricKey: "partialWorkoutsCount",
    target: 3,
    accentColor: "#F59E0B",
  },
  {
    id: "streak_3",
    iconKey: "flame",
    title: "Серия 3 дня",
    description: "Собрать серию из 3 продуктивных дней подряд.",
    rarityKey: "epic",
    rarityLabel: "Эпичное",
    difficultyKey: "medium",
    metricKey: "streakDays",
    target: 3,
    accentColor: "#F59E0B",
  },
  {
    id: "tracked_sets_12",
    iconKey: "dumbbell",
    title: "Вес под контролем",
    description: "Записать рабочий вес минимум в 12 подходах.",
    rarityKey: "epic",
    rarityLabel: "Эпичное",
    difficultyKey: "medium",
    metricKey: "trackedSetsCount",
    target: 12,
    accentColor: "#C084FC",
  },
  {
    id: "workouts_10",
    iconKey: "trophy",
    title: "10 тренировок",
    description: "Набрать 10 продуктивных тренировок в истории.",
    rarityKey: "epic",
    rarityLabel: "Эпичное",
    difficultyKey: "hard",
    metricKey: "productiveWorkoutsCount",
    target: 10,
    accentColor: "#FACC15",
  },
  {
    id: "workouts_25",
    iconKey: "trophy",
    title: "25 тренировок",
    description:
      "Закрепить привычку и дойти до 25 продуктивных тренировок.",
    rarityKey: "legendary",
    rarityLabel: "Легендарное",
    difficultyKey: "hard",
    metricKey: "productiveWorkoutsCount",
    target: 25,
    accentColor: "#F97316",
  },
  {
    id: "best_weight_50",
    iconKey: "dumbbell",
    title: "Первая тяжелая отметка",
    description: "Дойти хотя бы до 50 кг в одном зафиксированном подходе.",
    rarityKey: "legendary",
    rarityLabel: "Легендарное",
    difficultyKey: "hard",
    metricKey: "bestSetWeightKg",
    target: 50,
    accentColor: "#FB7185",
  },
  {
    id: "adaptive_mindset",
    iconKey: "brain",
    title: "Адаптивный подход",
    description:
      "Получить первое обновление плана или накопить 3 сигнала поведения для модели.",
    rarityKey: "legendary",
    rarityLabel: "Легендарное",
    difficultyKey: "hard",
    metricKey: "adaptiveMindsetProgress",
    target: 3,
    accentColor: "#A78BFA",
  },
];

function normalizeDifficulty(rawDifficulty, index) {
  if (!rawDifficulty || typeof rawDifficulty !== "object") {
    return null;
  }

  const key = typeof rawDifficulty.key === "string" ? rawDifficulty.key.trim() : "";

  if (!key) {
    return null;
  }

  return {
    key,
    label:
      typeof rawDifficulty.label === "string" && rawDifficulty.label.trim()
        ? rawDifficulty.label.trim()
        : key,
    shortLabel:
      typeof rawDifficulty.shortLabel === "string" && rawDifficulty.shortLabel.trim()
        ? rawDifficulty.shortLabel.trim()
        : key,
    order: Number.isFinite(Number(rawDifficulty.order))
      ? Number(rawDifficulty.order)
      : index + 1,
  };
}

function normalizeAchievement(rawAchievement, knownDifficulties) {
  if (!rawAchievement || typeof rawAchievement !== "object") {
    return null;
  }

  const id = typeof rawAchievement.id === "string" ? rawAchievement.id.trim() : "";
  const metricKey =
    typeof rawAchievement.metricKey === "string" ? rawAchievement.metricKey.trim() : "";
  const difficultyKey =
    typeof rawAchievement.difficultyKey === "string"
      ? rawAchievement.difficultyKey.trim()
      : "";

  if (!id || !metricKey || !difficultyKey || !knownDifficulties.has(difficultyKey)) {
    return null;
  }

  return {
    id,
    iconKey:
      typeof rawAchievement.iconKey === "string" && rawAchievement.iconKey.trim()
        ? rawAchievement.iconKey.trim()
        : "spark",
    title:
      typeof rawAchievement.title === "string" && rawAchievement.title.trim()
        ? rawAchievement.title.trim()
        : id,
    description:
      typeof rawAchievement.description === "string" && rawAchievement.description.trim()
        ? rawAchievement.description.trim()
        : "",
    rarityKey:
      typeof rawAchievement.rarityKey === "string" && rawAchievement.rarityKey.trim()
        ? rawAchievement.rarityKey.trim()
        : "common",
    rarityLabel:
      typeof rawAchievement.rarityLabel === "string" && rawAchievement.rarityLabel.trim()
        ? rawAchievement.rarityLabel.trim()
        : "Обычное",
    difficultyKey,
    metricKey,
    target: Math.max(Number(rawAchievement.target) || 1, 1),
    accentColor:
      typeof rawAchievement.accentColor === "string" && rawAchievement.accentColor.trim()
        ? rawAchievement.accentColor.trim()
        : "#01BB96",
  };
}

function loadAchievementsConfigFromJson() {
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirPath = path.dirname(currentFilePath);
    const configFilePath = path.join(currentDirPath, "achievements.json");
    const rawFileContent = readFileSync(configFilePath, "utf-8");
    const parsedConfig = JSON.parse(rawFileContent);

    const parsedDifficulties = Array.isArray(parsedConfig?.difficulties)
      ? parsedConfig.difficulties
          .map((difficulty, index) => normalizeDifficulty(difficulty, index))
          .filter(Boolean)
      : [];

    if (parsedDifficulties.length === 0) {
      return null;
    }

    const knownDifficulties = new Set(parsedDifficulties.map((item) => item.key));
    const parsedAchievements = Array.isArray(parsedConfig?.achievements)
      ? parsedConfig.achievements
          .map((achievement) =>
            normalizeAchievement(achievement, knownDifficulties),
          )
          .filter(Boolean)
      : [];

    if (parsedAchievements.length === 0) {
      return null;
    }

    return {
      difficulties: parsedDifficulties,
      achievements: parsedAchievements,
    };
  } catch {
    return null;
  }
}

const jsonConfig = loadAchievementsConfigFromJson();

export const ACHIEVEMENT_DIFFICULTIES =
  jsonConfig?.difficulties ?? DEFAULT_ACHIEVEMENT_DIFFICULTIES;

export const ACHIEVEMENT_CATALOG =
  jsonConfig?.achievements ?? DEFAULT_ACHIEVEMENT_CATALOG;
