import { questions } from "../data/questions.js";
import { TRAINING_PLAN_LIBRARY } from "../data/trainingPlanCatalog.js";
import { normalizeTag, normalizeTagArray } from "./exerciseCatalogUtils.js";
import {
  buildTastingScoreModel,
  estimateTastingDurationMinutes,
} from "./tastingScore.js";

export const WORKOUTS_PER_WEEK_OPTIONS = [2, 3, 4, 5];

const DEFAULT_TRAINING_LEVEL = "Не определен";
const SUPPORTED_TRAINING_LEVELS = [
  DEFAULT_TRAINING_LEVEL,
  "Начинающий",
  "Средний",
  "Продвинутый",
];

const TRAINING_LEVEL_TIERS = {
  [DEFAULT_TRAINING_LEVEL]: 0,
  Начинающий: 1,
  Средний: 2,
  Продвинутый: 3,
};

const BALANCED_PLAN_TAGS = [
  "balance",
  "balanced",
  "balanced-split",
  "full-body",
  "split",
  "strength",
];
const SPECIALIZATION_PLAN_TAGS = [
  "arms",
  "biceps",
  "triceps",
  "specialization",
];
const HIGH_FREQUENCY_TAGS = ["high-frequency", "frequency"];

function average(values = []) {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return null;
  }

  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function normalizeGender(gender) {
  const normalizedGender =
    typeof gender === "string" ? gender.trim().toLowerCase() : "";

  if (normalizedGender === "male" || normalizedGender === "female") {
    return normalizedGender;
  }

  return "not_specified";
}

function normalizeTrainingLevel(trainingLevel) {
  return SUPPORTED_TRAINING_LEVELS.includes(trainingLevel)
    ? trainingLevel
    : DEFAULT_TRAINING_LEVEL;
}

function getTrainingLevelTier(trainingLevel) {
  return TRAINING_LEVEL_TIERS[normalizeTrainingLevel(trainingLevel)] ?? 0;
}

function getDefaultGoal() {
  return (
    TRAINING_PLAN_LIBRARY[0] ?? {
      key: "general-strength",
      label: "Общая сила",
      description: "Базовый тренировочный шаблон.",
      sessions: [],
      mlProfile: {},
    }
  );
}

function normalizeWorkoutsPerWeekList(plan = {}) {
  const mlProfile = plan.mlProfile ?? {};
  const explicitOptions = Array.isArray(mlProfile.recommendedWorkoutsPerWeek)
    ? mlProfile.recommendedWorkoutsPerWeek
        .map((value) => Number(value))
        .filter((value) => WORKOUTS_PER_WEEK_OPTIONS.includes(value))
    : [];

  if (explicitOptions.length > 0) {
    return explicitOptions;
  }

  const sessionCount = Array.isArray(plan.sessions) ? plan.sessions.length : 0;

  if (WORKOUTS_PER_WEEK_OPTIONS.includes(sessionCount)) {
    return [sessionCount];
  }

  return [3];
}

function getPlanTags(plan = {}) {
  return normalizeTagArray([
    ...(plan.mlProfile?.focusTags ?? []),
    plan.mlProfile?.objective,
    plan.mlProfile?.adaptationPriority,
    plan.key,
  ]);
}

function hasPlanTag(plan, expectedTags = []) {
  const planTags = new Set(getPlanTags(plan));
  return normalizeTagArray(expectedTags).some((tag) => planTags.has(tag));
}

function getPlanAverageSessionDuration(plan = {}) {
  const sessions = Array.isArray(plan.sessions) ? plan.sessions : [];
  return average(sessions.map((session) => session.duration));
}

function normalizeIntensityValue(value) {
  const normalizedValue = normalizeTag(value);

  if (normalizedValue === "high") {
    return 3;
  }

  if (normalizedValue === "moderate-high") {
    return 2.5;
  }

  if (normalizedValue === "moderate") {
    return 2;
  }

  if (normalizedValue === "low-moderate") {
    return 1.5;
  }

  if (normalizedValue === "low") {
    return 1;
  }

  return null;
}

function getPlanAverageIntensity(plan = {}) {
  const sessions = Array.isArray(plan.sessions) ? plan.sessions : [];
  return average(
    sessions
      .map((session) => normalizeIntensityValue(session.intensity))
      .filter((value) => value != null),
  );
}

function getPlanAverageRecoveryDemand(plan = {}) {
  const sessions = Array.isArray(plan.sessions) ? plan.sessions : [];
  return average(
    sessions
      .map((session) => normalizeIntensityValue(session.recoveryDemand))
      .filter((value) => value != null),
  );
}

function scoreFrequencyFit(plan, trainingLevelTier) {
  const primaryWorkouts = normalizeWorkoutsPerWeekList(plan)[0] ?? 3;
  const preferredFrequency = trainingLevelTier >= 3 ? 4 : 3;
  let score = Math.max(0, 6 - Math.abs(primaryWorkouts - preferredFrequency) * 2);

  if (primaryWorkouts === 2 && hasPlanTag(plan, ["full-body"])) {
    score += trainingLevelTier <= 2 ? 4 : 2;
  }

  if (primaryWorkouts >= 4 || hasPlanTag(plan, HIGH_FREQUENCY_TAGS)) {
    if (trainingLevelTier >= 3) {
      score += 4;
    } else if (trainingLevelTier === 2) {
      score += 1;
    } else {
      score -= 5;
    }
  }

  return score;
}

function scorePlanStructure(plan, trainingLevelTier) {
  const averageDuration = getPlanAverageSessionDuration(plan) ?? 60;
  const averageIntensity = getPlanAverageIntensity(plan) ?? 2;
  const averageRecoveryDemand = getPlanAverageRecoveryDemand(plan) ?? 2;
  let score = 0;

  if (hasPlanTag(plan, BALANCED_PLAN_TAGS)) {
    score += trainingLevelTier <= 2 ? 4 : 2;
  }

  if (hasPlanTag(plan, SPECIALIZATION_PLAN_TAGS)) {
    score -= 4;

    if (trainingLevelTier >= 3) {
      score += 3;
    } else if (trainingLevelTier === 2) {
      score += 0;
    } else {
      score -= 4;
    }
  }

  if (trainingLevelTier <= 1) {
    if (averageDuration > 75) {
      score -= 3;
    }

    if (averageIntensity > 2.2) {
      score -= 4;
    }

    if (averageRecoveryDemand > 2.2) {
      score -= 4;
    }
  } else if (trainingLevelTier === 2) {
    if (averageDuration >= 50 && averageDuration <= 75) {
      score += 2;
    }

    if (averageIntensity > 2.7) {
      score -= 1;
    }
  } else {
    if (averageIntensity >= 2.4) {
      score += 2;
    }

    if (averageRecoveryDemand >= 2.3) {
      score += 2;
    }
  }

  return score;
}

function scorePlanForUser(plan, trainingLevel, gender) {
  const mlProfile = plan.mlProfile ?? {};
  const normalizedLevel = normalizeTrainingLevel(trainingLevel);
  const normalizedGender = normalizeGender(gender);
  const trainingLevelTier = getTrainingLevelTier(normalizedLevel);
  const recommendedLevels = Array.isArray(mlProfile.recommendedTrainingLevels)
    ? mlProfile.recommendedTrainingLevels
    : [];
  const recommendedGenders = Array.isArray(mlProfile.recommendedGenders)
    ? mlProfile.recommendedGenders
    : [];

  let score = 0;

  if (recommendedLevels.length === 0) {
    score += 2;
  } else if (recommendedLevels.includes(normalizedLevel)) {
    score += 8;
  } else {
    score -= 2;
  }

  if (recommendedGenders.length === 0) {
    score += 1;
  } else if (recommendedGenders.includes(normalizedGender)) {
    score += 3;
  } else if (
    normalizedGender === "not_specified" &&
    recommendedGenders.includes("not_specified")
  ) {
    score += 2;
  }

  score += scoreFrequencyFit(plan, trainingLevelTier);
  score += scorePlanStructure(plan, trainingLevelTier);
  score += Math.min(getPlanTags(plan).length, 4);

  return score;
}

function getSuggestedPlan(trainingLevel, gender) {
  const normalizedLevel = normalizeTrainingLevel(trainingLevel);
  const normalizedGender = normalizeGender(gender);

  return (
    [...TRAINING_PLAN_LIBRARY].sort((left, right) => {
      return (
        scorePlanForUser(right, normalizedLevel, normalizedGender) -
        scorePlanForUser(left, normalizedLevel, normalizedGender)
      );
    })[0] ?? getDefaultGoal()
  );
}

function formatObjectiveLabel(objective) {
  const normalizedObjective = normalizeTag(objective);

  if (!normalizedObjective) {
    return null;
  }

  const objectiveLabels = {
    "balanced-strength-mass": "баланс силы и мышечного объема",
    "balanced-split": "сбалансированный сплит",
    "hypertrophy-balance": "сбалансированный рост объема",
    "high-frequency": "частая распределенная нагрузка",
    "arms-hypertrophy-balance": "специализация на руках с общим балансом",
    "arms-specialization-split": "сплит со специализацией на руках",
    "arms-high-frequency": "высокочастотная специализация на руках",
    "arms-specialization-high-frequency":
      "высокочастотная специализация на руках",
  };

  return objectiveLabels[normalizedObjective] ?? objective;
}

function buildSuggestedReason(plan, trainingLevel, gender) {
  const mlProfile = plan.mlProfile ?? {};
  const normalizedLevel = normalizeTrainingLevel(trainingLevel);
  const normalizedGender = normalizeGender(gender);
  const recommendedWorkouts = normalizeWorkoutsPerWeekList(plan);
  const parts = [
    `Рекомендуем план «${plan.label}».`,
    `Он хорошо совпадает с уровнем «${normalizedLevel}».`,
  ];

  if (
    Array.isArray(mlProfile.recommendedGenders) &&
    mlProfile.recommendedGenders.includes(normalizedGender) &&
    normalizedGender !== "not_specified"
  ) {
    parts.push("Профиль нагрузки учитывает пол пользователя.");
  }

  if (recommendedWorkouts.length > 0) {
    parts.push(`Стартовая частота: ${recommendedWorkouts[0]} тренировки в неделю.`);
  }

  const objectiveLabel = formatObjectiveLabel(mlProfile.objective);

  if (objectiveLabel) {
    parts.push(`Основная идея плана: ${objectiveLabel}.`);
  }

  if (Array.isArray(mlProfile.focusTags) && mlProfile.focusTags.length > 0) {
    parts.push(`Акцент: ${mlProfile.focusTags.slice(0, 3).join(", ")}.`);
  }

  return parts.join(" ");
}

function buildSuggestedSetup({ workoutsPerWeek, focusKey, reason }) {
  return {
    workoutsPerWeek,
    focusKey,
    reason,
  };
}

export function getTrainingGoals() {
  return TRAINING_PLAN_LIBRARY.map(({ key, label, description, mlProfile }) => ({
    key,
    label,
    description,
    recommendedWorkoutsPerWeek: normalizeWorkoutsPerWeekList({
      key,
      label,
      description,
      mlProfile,
    }),
    focusTags: Array.isArray(mlProfile?.focusTags) ? mlProfile.focusTags : [],
  }));
}

export function getTrainingSuggestedSetup(
  trainingLevel = DEFAULT_TRAINING_LEVEL,
  gender = "not_specified",
) {
  const suggestedPlan = getSuggestedPlan(trainingLevel, gender);
  const recommendedWorkouts = normalizeWorkoutsPerWeekList(suggestedPlan);

  return buildSuggestedSetup({
    workoutsPerWeek: recommendedWorkouts[0] ?? 3,
    focusKey: suggestedPlan.key,
    reason: buildSuggestedReason(suggestedPlan, trainingLevel, gender),
  });
}

function buildLevelSuggestedSetups(trainingLevel) {
  return {
    default: getTrainingSuggestedSetup(trainingLevel, "not_specified"),
    male: getTrainingSuggestedSetup(trainingLevel, "male"),
    female: getTrainingSuggestedSetup(trainingLevel, "female"),
    not_specified: getTrainingSuggestedSetup(trainingLevel, "not_specified"),
  };
}

export function buildTrainingConfigPayload() {
  const defaultGoal = getSuggestedPlan(DEFAULT_TRAINING_LEVEL, "not_specified");

  return {
    workoutsPerWeekOptions: WORKOUTS_PER_WEEK_OPTIONS,
    goals: getTrainingGoals(),
    defaultGoalKey: defaultGoal.key,
    suggestedSetups: SUPPORTED_TRAINING_LEVELS.reduce((result, trainingLevel) => {
      result[trainingLevel] = buildLevelSuggestedSetups(trainingLevel);
      return result;
    }, {}),
  };
}

export function buildTastingQuestionsPayload() {
  const normalizedQuestions = Array.isArray(questions) ? questions : [];

  return {
    questions: normalizedQuestions,
    total: normalizedQuestions.length,
    estimatedDurationMinutes: estimateTastingDurationMinutes(
      normalizedQuestions.length,
    ),
    scoreModel: buildTastingScoreModel(normalizedQuestions),
  };
}
