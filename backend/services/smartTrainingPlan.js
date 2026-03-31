import { randomUUID } from "node:crypto";
import { buildAdaptationSummary } from "./adaptiveSignals.js";
import { buildAdaptiveExerciseVolume } from "./adaptiveVolume.js";
import { hasTagIntersection, normalizeTag, normalizeTagArray } from "./exerciseCatalogUtils.js";
import { buildTrainingFeatures } from "./trainingFeatureBuilder.js";
import { generateWorkoutAdvanced } from "./workoutGenerator.js";
import {
  EXERCISES_PER_SESSION,
  TRAINING_GOALS,
  getLevelConfig,
} from "../shared/trainingPlanBuilder.js";

const FOCUS_BLUEPRINTS = {
  "upper-torso": [
    {
      key: "push-priority",
      title: "Грудь и трицепс",
      emphasis: "Жимовой акцент и объем на верх тела",
      duration: 56,
      sessionGoalTags: ["upper-torso", "mass", "strength"],
      sessionBodyParts: ["chest", "upper_chest", "arms", "shoulders"],
      slots: [
        {
          requiredMovementPatterns: ["horizontal_push", "incline_push"],
          compound: true,
          bodyParts: ["chest", "upper_chest"],
          goalTags: ["strength", "mass"],
        },
        {
          movementPatterns: ["horizontal_push", "incline_push", "vertical_push"],
          bodyParts: ["chest", "upper_chest", "shoulders"],
          goalTags: ["mass", "upper-torso"],
        },
        {
          bodyParts: ["arms"],
          goalTags: ["triceps", "arms"],
        },
        {
          bodyParts: ["shoulders"],
          goalTags: ["shoulders", "rear-delts", "posture"],
        },
        {
          bodyParts: ["chest", "upper_chest"],
          compound: false,
          goalTags: ["mass", "isolation"],
        },
        {
          bodyParts: ["core", "back", "shoulders"],
          goalTags: ["core", "posture", "stability"],
        },
      ],
    },
    {
      key: "pull-priority",
      title: "Спина и бицепс",
      emphasis: "Ширина и толщина спины плюс объем рук",
      duration: 55,
      sessionGoalTags: ["upper-torso", "strength", "back-width"],
      sessionBodyParts: ["back", "arms", "shoulders"],
      slots: [
        {
          requiredMovementPatterns: ["vertical_pull", "horizontal_pull"],
          compound: true,
          bodyParts: ["back"],
          goalTags: ["strength", "back-width"],
        },
        {
          movementPatterns: ["horizontal_pull", "vertical_pull", "shoulder_extension"],
          bodyParts: ["back"],
          goalTags: ["mass", "back-thickness"],
        },
        {
          bodyParts: ["arms"],
          goalTags: ["biceps", "arms"],
        },
        {
          bodyParts: ["arms"],
          compound: false,
          goalTags: ["forearms", "arms", "biceps"],
        },
        {
          bodyParts: ["shoulders", "back"],
          goalTags: ["rear-delts", "posture"],
        },
        {
          bodyParts: ["core", "back"],
          goalTags: ["core", "posterior-chain"],
        },
      ],
    },
    {
      key: "legs-support",
      title: "Ноги и плечи",
      emphasis: "Силовая база и баланс по низу тела",
      duration: 58,
      sessionGoalTags: ["lower-body", "strength", "upper-body"],
      sessionBodyParts: ["legs", "shoulders", "core"],
      slots: [
        {
          requiredMovementPatterns: ["squat", "hip_hinge", "lunge"],
          compound: true,
          bodyParts: ["legs", "full_body"],
          goalTags: ["strength", "lower-body"],
        },
        {
          movementPatterns: ["hip_hinge", "lunge", "squat"],
          bodyParts: ["legs", "full_body"],
          goalTags: ["posterior-chain", "glutes", "mass"],
        },
        {
          bodyParts: ["shoulders"],
          goalTags: ["shoulders", "upper-body"],
        },
        {
          bodyParts: ["legs"],
          goalTags: ["legs", "calves", "glutes"],
        },
        {
          bodyParts: ["shoulders", "back"],
          goalTags: ["posture", "rear-delts", "shoulder-health"],
        },
        {
          bodyParts: ["core"],
          goalTags: ["core", "stability"],
        },
      ],
    },
    {
      key: "upper-volume",
      title: "Верх тела объемом",
      emphasis: "Дополнительная работа на грудь, спину и руки",
      duration: 54,
      sessionGoalTags: ["mass", "upper-torso"],
      sessionBodyParts: ["chest", "back", "arms", "shoulders"],
      slots: [
        {
          movementPatterns: ["horizontal_push", "incline_push"],
          bodyParts: ["chest", "upper_chest"],
          goalTags: ["mass", "chest-shape"],
        },
        {
          movementPatterns: ["horizontal_pull", "vertical_pull"],
          bodyParts: ["back"],
          goalTags: ["mass", "back-thickness", "back-width"],
        },
        {
          bodyParts: ["arms"],
          goalTags: ["arms", "biceps", "triceps"],
        },
        {
          bodyParts: ["shoulders"],
          goalTags: ["shoulders", "rear-delts", "shoulder-width"],
        },
        {
          bodyParts: ["chest", "back"],
          goalTags: ["mass", "stretch", "upper-torso"],
        },
        {
          bodyParts: ["core"],
          goalTags: ["core", "stability"],
        },
      ],
    },
    {
      key: "mixed-balance",
      title: "Смешанный день",
      emphasis: "Поддержка общего прогресса и разнообразия",
      duration: 52,
      sessionGoalTags: ["strength", "mass", "full-body"],
      sessionBodyParts: ["full_body", "legs", "back", "chest", "core"],
      slots: [
        {
          compound: true,
          bodyParts: ["full_body", "legs", "back", "chest"],
          goalTags: ["strength", "full-body"],
        },
        {
          compound: true,
          bodyParts: ["back", "chest", "shoulders"],
          goalTags: ["mass", "upper-torso"],
        },
        {
          unilateral: true,
          bodyParts: ["legs", "arms"],
          goalTags: ["unilateral-balance", "functional"],
        },
        {
          bodyParts: ["shoulders", "arms"],
          goalTags: ["arms", "shoulders"],
        },
        {
          bodyParts: ["core", "cardio"],
          goalTags: ["core", "conditioning", "weight-loss"],
        },
        {
          bodyParts: ["core", "back", "legs"],
          goalTags: ["stability", "posterior-chain"],
        },
      ],
    },
  ],
  endurance: [
    {
      key: "aerobic-base",
      title: "Аэробная база",
      emphasis: "Ровная кардио-нагрузка и устойчивость",
      duration: 44,
      sessionGoalTags: ["endurance", "weight-loss", "cardio"],
      sessionBodyParts: ["cardio", "core", "legs", "full_body"],
      slots: [
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "warm-up"] },
        { requiredBodyParts: ["cardio"], goalTags: ["conditioning", "endurance"] },
        { bodyParts: ["full_body", "legs"], goalTags: ["functional", "weight-loss"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { bodyParts: ["legs"], unilateral: true, goalTags: ["functional", "beginner"] },
        { bodyParts: ["core", "full_body"], goalTags: ["stability", "body-control"] },
      ],
    },
    {
      key: "circuit-strength",
      title: "Силовая выносливость",
      emphasis: "Больше круговой и интервальной работы",
      duration: 48,
      sessionGoalTags: ["conditioning", "weight-loss", "full-body"],
      sessionBodyParts: ["full_body", "cardio", "legs", "core"],
      slots: [
        { compound: true, bodyParts: ["legs", "full_body"], goalTags: ["functional", "weight-loss"] },
        { compound: true, bodyParts: ["back", "chest", "full_body"], goalTags: ["conditioning", "strength"] },
        { requiredBodyParts: ["cardio"], goalTags: ["conditioning", "cardio"] },
        { bodyParts: ["core"], goalTags: ["core", "weight-loss"] },
        { unilateral: true, bodyParts: ["legs"], goalTags: ["functional", "unilateral-balance"] },
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "coordination"] },
      ],
    },
    {
      key: "legs-core",
      title: "Ноги и корпус",
      emphasis: "Устойчивость, техника и расход калорий",
      duration: 47,
      sessionGoalTags: ["legs", "core", "weight-loss"],
      sessionBodyParts: ["legs", "core"],
      slots: [
        { compound: true, bodyParts: ["legs"], goalTags: ["strength", "lower-body"] },
        { movementPatterns: ["hip_hinge", "lunge", "hip_extension"], bodyParts: ["legs", "full_body"], goalTags: ["posterior-chain"] },
        { bodyParts: ["legs"], goalTags: ["glutes", "calves", "leg-development"] },
        { bodyParts: ["core"], goalTags: ["core", "obliques", "stability"] },
        { requiredBodyParts: ["cardio"], goalTags: ["weight-loss", "conditioning"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
      ],
    },
    {
      key: "tempo-day",
      title: "Темповая работа",
      emphasis: "Интервалы и пульсовой блок",
      duration: 42,
      sessionGoalTags: ["cardio", "conditioning", "weight-loss"],
      sessionBodyParts: ["cardio", "core", "full_body"],
      slots: [
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "conditioning"] },
        { requiredBodyParts: ["cardio"], goalTags: ["weight-loss", "conditioning"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { compound: true, bodyParts: ["full_body", "legs"], goalTags: ["functional", "weight-loss"] },
        { bodyParts: ["core", "legs"], goalTags: ["core", "mobility"] },
        { bodyParts: ["cardio", "core"], goalTags: ["cardio", "weight-loss"] },
      ],
    },
    {
      key: "recovery-flow",
      title: "Восстановительный объем",
      emphasis: "Мягкая работа и поддержка техники",
      duration: 38,
      sessionGoalTags: ["beginner", "recovery", "stability"],
      sessionBodyParts: ["cardio", "core", "legs"],
      slots: [
        { requiredBodyParts: ["cardio"], goalTags: ["beginner", "cardio"] },
        { bodyParts: ["legs"], goalTags: ["movement-quality", "beginner"] },
        { bodyParts: ["core"], goalTags: ["core", "rehab-friendly"] },
        { bodyParts: ["legs"], goalTags: ["glutes", "joint-friendly"] },
        { bodyParts: ["shoulders", "back"], goalTags: ["posture", "shoulder-health"] },
        { bodyParts: ["core", "cardio"], goalTags: ["stability", "recovery"] },
      ],
    },
  ],
  arms: [
    {
      key: "arms-focus",
      title: "Бицепс и трицепс",
      emphasis: "Прямой акцент на руки",
      duration: 46,
      sessionGoalTags: ["arms", "mass", "biceps", "triceps"],
      sessionBodyParts: ["arms", "chest", "shoulders"],
      slots: [
        { bodyParts: ["arms"], goalTags: ["biceps", "arms"] },
        { bodyParts: ["arms"], goalTags: ["triceps", "arms"] },
        { bodyParts: ["arms"], goalTags: ["forearms", "biceps", "arms"] },
        { bodyParts: ["arms"], goalTags: ["triceps", "long-head", "arms"] },
        { compound: true, bodyParts: ["arms", "chest"], goalTags: ["pressing-power", "triceps"] },
        { bodyParts: ["shoulders", "core"], goalTags: ["posture", "stability"] },
      ],
    },
    {
      key: "push-support",
      title: "Грудь и плечи",
      emphasis: "Поддержка рук через жимовые движения",
      duration: 52,
      sessionGoalTags: ["upper-torso", "mass", "strength"],
      sessionBodyParts: ["chest", "shoulders", "arms"],
      slots: [
        { requiredMovementPatterns: ["horizontal_push", "incline_push"], compound: true, bodyParts: ["chest", "upper_chest"], goalTags: ["mass", "strength"] },
        { movementPatterns: ["vertical_push", "horizontal_push"], bodyParts: ["shoulders", "chest"], goalTags: ["shoulders", "upper-body"] },
        { bodyParts: ["arms"], goalTags: ["triceps", "arms"] },
        { bodyParts: ["shoulders"], goalTags: ["shoulder-width", "rear-delts"] },
        { bodyParts: ["chest"], goalTags: ["mass", "chest-shape"] },
        { bodyParts: ["core"], goalTags: ["stability", "core"] },
      ],
    },
    {
      key: "pull-support",
      title: "Спина и хват",
      emphasis: "Тяговая база для роста рук",
      duration: 50,
      sessionGoalTags: ["back-width", "arms", "strength"],
      sessionBodyParts: ["back", "arms"],
      slots: [
        { requiredMovementPatterns: ["vertical_pull", "horizontal_pull"], compound: true, bodyParts: ["back"], goalTags: ["strength", "back-width"] },
        { movementPatterns: ["horizontal_pull", "shoulder_extension"], bodyParts: ["back"], goalTags: ["mass", "back-thickness"] },
        { bodyParts: ["arms"], goalTags: ["biceps", "arms"] },
        { bodyParts: ["arms"], goalTags: ["forearms", "arms"] },
        { bodyParts: ["back", "shoulders"], goalTags: ["posture", "rear-delts"] },
        { bodyParts: ["core"], goalTags: ["stability", "core"] },
      ],
    },
    {
      key: "legs-balance",
      title: "Ноги и баланс",
      emphasis: "Поддержка общей формы без потери фокуса на руки",
      duration: 48,
      sessionGoalTags: ["lower-body", "functional"],
      sessionBodyParts: ["legs", "core"],
      slots: [
        { compound: true, bodyParts: ["legs"], goalTags: ["strength", "lower-body"] },
        { movementPatterns: ["lunge", "hip_hinge"], bodyParts: ["legs"], goalTags: ["functional", "unilateral-balance"] },
        { bodyParts: ["legs"], goalTags: ["glutes", "calves"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { bodyParts: ["arms"], goalTags: ["arms"], unilateral: true },
        { bodyParts: ["core", "shoulders"], goalTags: ["stability", "posture"] },
      ],
    },
    {
      key: "pump-day",
      title: "Пампинг рук",
      emphasis: "Добираем локальный объем",
      duration: 44,
      sessionGoalTags: ["mass", "arms", "isolation"],
      sessionBodyParts: ["arms", "shoulders"],
      slots: [
        { bodyParts: ["arms"], compound: false, goalTags: ["biceps", "arms", "isolation"] },
        { bodyParts: ["arms"], compound: false, goalTags: ["triceps", "arms", "isolation"] },
        { bodyParts: ["arms"], compound: false, goalTags: ["forearms", "arms"] },
        { bodyParts: ["arms"], compound: false, goalTags: ["long-head", "triceps"] },
        { bodyParts: ["shoulders"], compound: false, goalTags: ["shoulder-width", "rear-delts"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
      ],
    },
  ],
  "fat-loss": [
    {
      key: "metabolic-fullbody",
      title: "Метаболическая силовая",
      emphasis: "Все тело с хорошим расходом калорий",
      duration: 50,
      sessionGoalTags: ["weight-loss", "conditioning", "full-body"],
      sessionBodyParts: ["full_body", "legs", "cardio", "core"],
      slots: [
        { compound: true, bodyParts: ["legs", "full_body"], goalTags: ["weight-loss", "functional"] },
        { compound: true, bodyParts: ["chest", "back", "full_body"], goalTags: ["conditioning", "strength"] },
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "conditioning"] },
        { bodyParts: ["core"], goalTags: ["core", "weight-loss"] },
        { unilateral: true, bodyParts: ["legs"], goalTags: ["functional", "balance"] },
        { requiredBodyParts: ["cardio", "full_body"], goalTags: ["weight-loss", "full-body"] },
      ],
    },
    {
      key: "lower-body-burn",
      title: "Ноги и расход калорий",
      emphasis: "Крупные мышечные группы и расход энергии",
      duration: 52,
      sessionGoalTags: ["weight-loss", "legs", "conditioning"],
      sessionBodyParts: ["legs", "cardio", "core"],
      slots: [
        { compound: true, bodyParts: ["legs"], goalTags: ["strength", "lower-body"] },
        { movementPatterns: ["hip_hinge", "lunge", "hip_extension"], bodyParts: ["legs"], goalTags: ["posterior-chain"] },
        { bodyParts: ["legs"], goalTags: ["glutes", "calves", "leg-development"] },
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "weight-loss"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { bodyParts: ["core", "cardio"], goalTags: ["conditioning", "weight-loss"] },
      ],
    },
    {
      key: "interval-day",
      title: "Интервальный день",
      emphasis: "Темп, пульс и дефицит",
      duration: 42,
      sessionGoalTags: ["cardio", "conditioning", "weight-loss"],
      sessionBodyParts: ["cardio", "core", "full_body"],
      slots: [
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "conditioning"] },
        { requiredBodyParts: ["cardio"], goalTags: ["weight-loss", "conditioning"] },
        { requiredBodyParts: ["cardio", "full_body"], goalTags: ["full-body", "weight-loss"] },
        { bodyParts: ["core"], goalTags: ["core", "obliques"] },
        { bodyParts: ["legs", "full_body"], goalTags: ["functional", "weight-loss"] },
        { bodyParts: ["core", "shoulders"], goalTags: ["stability", "body-control"] },
      ],
    },
    {
      key: "upper-maintain",
      title: "Поддержка верха тела",
      emphasis: "Сохраняем мышечную массу на дефиците",
      duration: 48,
      sessionGoalTags: ["mass", "upper-torso", "weight-loss"],
      sessionBodyParts: ["chest", "back", "shoulders", "arms"],
      slots: [
        { compound: true, bodyParts: ["chest", "upper_chest"], goalTags: ["mass", "strength"] },
        { compound: true, bodyParts: ["back"], goalTags: ["back-width", "mass"] },
        { bodyParts: ["shoulders"], goalTags: ["shoulders", "posture"] },
        { bodyParts: ["arms"], goalTags: ["arms", "triceps", "biceps"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "conditioning"] },
      ],
    },
    {
      key: "recovery-cardio",
      title: "Легкий кардио-день",
      emphasis: "Восстановление и движение",
      duration: 38,
      sessionGoalTags: ["recovery", "cardio", "stability"],
      sessionBodyParts: ["cardio", "core", "legs"],
      slots: [
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "beginner"] },
        { bodyParts: ["legs"], goalTags: ["movement-quality", "beginner"] },
        { bodyParts: ["core"], goalTags: ["core", "rehab-friendly"] },
        { bodyParts: ["legs"], goalTags: ["glutes", "joint-friendly"] },
        { bodyParts: ["core", "back"], goalTags: ["stability", "recovery"] },
        { bodyParts: ["shoulders", "back"], goalTags: ["posture", "shoulder-health"] },
      ],
    },
  ],
  "general-strength": [
    {
      key: "push-day",
      title: "Толкающий день",
      emphasis: "Грудь, плечи и трицепс",
      duration: 54,
      sessionGoalTags: ["strength", "mass", "upper-body"],
      sessionBodyParts: ["chest", "shoulders", "arms"],
      slots: [
        { requiredMovementPatterns: ["horizontal_push", "incline_push"], compound: true, bodyParts: ["chest", "upper_chest"], goalTags: ["strength", "mass"] },
        { movementPatterns: ["vertical_push", "horizontal_push"], bodyParts: ["shoulders", "chest"], goalTags: ["upper-body", "mass"] },
        { bodyParts: ["arms"], goalTags: ["triceps", "arms"] },
        { bodyParts: ["shoulders"], goalTags: ["shoulders", "posture"] },
        { bodyParts: ["chest"], goalTags: ["mass", "chest-shape"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
      ],
    },
    {
      key: "pull-day",
      title: "Тяговый день",
      emphasis: "Спина и бицепс",
      duration: 55,
      sessionGoalTags: ["strength", "back-width", "back-thickness"],
      sessionBodyParts: ["back", "arms"],
      slots: [
        { requiredMovementPatterns: ["vertical_pull", "horizontal_pull"], compound: true, bodyParts: ["back"], goalTags: ["strength", "back-width"] },
        { movementPatterns: ["horizontal_pull", "shoulder_extension"], bodyParts: ["back"], goalTags: ["mass", "back-thickness"] },
        { bodyParts: ["arms"], goalTags: ["biceps", "arms"] },
        { bodyParts: ["back", "shoulders"], goalTags: ["rear-delts", "posture"] },
        { bodyParts: ["arms"], goalTags: ["forearms", "arms"] },
        { bodyParts: ["core", "back"], goalTags: ["posterior-chain", "stability"] },
      ],
    },
    {
      key: "lower-day",
      title: "Ноги и корпус",
      emphasis: "Силовая база по низу тела",
      duration: 58,
      sessionGoalTags: ["strength", "lower-body", "posterior-chain"],
      sessionBodyParts: ["legs", "core"],
      slots: [
        { requiredMovementPatterns: ["squat", "hip_hinge"], compound: true, bodyParts: ["legs", "full_body"], goalTags: ["strength", "lower-body"] },
        { movementPatterns: ["hip_hinge", "lunge", "hip_extension"], bodyParts: ["legs", "full_body"], goalTags: ["posterior-chain", "glutes"] },
        { bodyParts: ["legs"], goalTags: ["quads", "hamstrings", "glutes"] },
        { bodyParts: ["legs"], goalTags: ["calves", "legs"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { bodyParts: ["core", "back"], goalTags: ["posterior-chain", "stability"] },
      ],
    },
    {
      key: "mix-day",
      title: "Смешанный день",
      emphasis: "Поддержка общей формы и техники",
      duration: 50,
      sessionGoalTags: ["full-body", "strength", "mass"],
      sessionBodyParts: ["full_body", "legs", "back", "chest", "core"],
      slots: [
        { compound: true, bodyParts: ["full_body", "legs", "back", "chest"], goalTags: ["strength", "full-body"] },
        { compound: true, bodyParts: ["back", "chest", "shoulders"], goalTags: ["mass", "upper-body"] },
        { unilateral: true, bodyParts: ["legs", "arms"], goalTags: ["unilateral-balance", "functional"] },
        { bodyParts: ["shoulders", "arms"], goalTags: ["shoulders", "arms"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { requiredBodyParts: ["cardio", "full_body"], goalTags: ["conditioning", "weight-loss"] },
      ],
    },
    {
      key: "conditioning-day",
      title: "Силовой финишер",
      emphasis: "Форма, темп и выносливость",
      duration: 46,
      sessionGoalTags: ["conditioning", "full-body", "strength"],
      sessionBodyParts: ["full_body", "cardio", "core"],
      slots: [
        { requiredBodyParts: ["cardio"], goalTags: ["cardio", "conditioning"] },
        { compound: true, bodyParts: ["full_body", "legs"], goalTags: ["strength", "functional"] },
        { compound: true, bodyParts: ["chest", "back"], goalTags: ["upper-body", "strength"] },
        { bodyParts: ["shoulders", "back"], goalTags: ["posture", "rear-delts"] },
        { bodyParts: ["core"], goalTags: ["core", "stability"] },
        { requiredBodyParts: ["cardio", "full_body"], goalTags: ["weight-loss", "conditioning"] },
      ],
    },
  ],
};

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function createPlanId(focusKey) {
  return `smart_plan_${focusKey}_${randomUUID()}`;
}

function getFocusMeta(focusKey) {
  return (
    TRAINING_GOALS.find((item) => item.key === focusKey) ??
    TRAINING_GOALS.find((item) => item.key === "general-strength") ?? {
      key: focusKey,
      label: focusKey,
      description: "",
    }
  );
}

function getFocusBlueprint(focusKey, workoutsPerWeek) {
  const blueprint = FOCUS_BLUEPRINTS[focusKey] ?? FOCUS_BLUEPRINTS["general-strength"];

  return Array.from({ length: workoutsPerWeek }, (_, index) => {
    const sessionBlueprint = blueprint[index % blueprint.length];

    return {
      ...sessionBlueprint,
      index,
    };
  });
}

function getSignalCount(map, key) {
  return map.get(normalizeTag(key)) ?? 0;
}

function getSessionPriority(sessionBlueprint, adaptiveSignals) {
  const normalizedBodyParts = normalizeTagArray(sessionBlueprint.sessionBodyParts);

  if (normalizedBodyParts.length === 0) {
    return 0;
  }

  const lowFrequencyBonus = normalizedBodyParts.reduce((total, bodyPart) => {
    const usage = getSignalCount(adaptiveSignals.bodyPartFrequency, bodyPart);
    return total + Math.max(0, 4 - usage);
  }, 0);
  const overusedPenalty = normalizedBodyParts.reduce((total, bodyPart) => {
    const usage = getSignalCount(adaptiveSignals.bodyPartFrequency, bodyPart);
    return total + Math.max(0, usage - 6);
  }, 0);
  const progressionBonus = hasTagIntersection(sessionBlueprint.sessionGoalTags, [
    "strength",
    "mass",
    "upper-torso",
    "back-width",
  ])
    ? Math.min(adaptiveSignals.progressedExerciseNames.size, 4)
    : 0;

  return lowFrequencyBonus + progressionBonus - overusedPenalty;
}

function orderBlueprintSessions(blueprintSessions, adaptiveSignals) {
  if (adaptiveSignals.completedWorkoutCount < 2) {
    return blueprintSessions;
  }

  return [...blueprintSessions].sort((left, right) => {
    const priorityDifference =
      getSessionPriority(right, adaptiveSignals) -
      getSessionPriority(left, adaptiveSignals);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return left.index - right.index;
  });
}

function buildSessionAdaptationHints(
  sessionBlueprint,
  adaptiveSignals,
  trainingFeatures,
) {
  const hints = [];
  const bodyPartUsage = normalizeTagArray(sessionBlueprint.sessionBodyParts).map(
    (bodyPart) => getSignalCount(adaptiveSignals.bodyPartFrequency, bodyPart),
  );

  if (bodyPartUsage.some((usage) => usage <= 2)) {
    hints.push("Подтягиваем мышечные группы, которым раньше доставалось меньше объёма.");
  }

  if (
    hasTagIntersection(sessionBlueprint.sessionGoalTags, ["strength", "mass"]) &&
    adaptiveSignals.progressedExerciseNames.size > 0
  ) {
    hints.push("Оставляем часть движений, в которых уже пошёл рабочий прогресс.");
  }

  if (adaptiveSignals.stalledExerciseNames.size > 0) {
    hints.push("Добавляем ротацию, чтобы не упираться в одно и то же плато.");
  }

  if (
    trainingFeatures.history.skipRate >= 0.25 ||
    trainingFeatures.history.partialRate >= 0.25
  ) {
    hints.push(
      "СѓРјРµРЅСЊС€Р°РµРј СЂРёСЃРє РїРµСЂРµРіСЂСѓР·РєРё: РѕР±СЉС‘Рј РґРµСЂР¶РёРј Р±Р»РёР¶Рµ Рє СЃС‚Р°Р±РёР»СЊРЅРѕРјСѓ СЂРµР¶РёРјСѓ.",
    );
  }

  if (
    trainingFeatures.recovery.averageSleepQuality != null &&
    trainingFeatures.recovery.averageSleepQuality <= 2.5
  ) {
    hints.push(
      "СѓС‡РёС‚С‹РІР°РµРј РЅРёР·РєРѕРµ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїРѕ СЃРЅСѓ Рё РѕСЃС‚Р°РІР»СЏРµРј РїР»Р°РЅ Р±РѕР»РµРµ СѓРїСЂР°РІР»СЏРµРјС‹Рј.",
    );
  }

  return hints;
}

function resolvePrescriptionType(exercise) {
  if (exercise.bodyPart === "cardio") {
    return "cardio";
  }

  if (exercise.bodyPart === "core") {
    return "core";
  }

  return exercise.compound ? "compound" : "isolation";
}

function mergeAvailableExercises(primaryExercises, fallbackExercises) {
  const merged = [];
  const seenNames = new Set();

  [...primaryExercises, ...fallbackExercises].forEach((exercise) => {
    if (!exercise?.name || seenNames.has(exercise.name)) {
      return;
    }

    seenNames.add(exercise.name);
    merged.push(exercise);
  });

  return merged;
}

function selectExerciseForSlot(
  exercises,
  user,
  workoutHistory,
  trainingFeatures,
  slot,
  selectedExercises,
) {
  const rankedExercises = generateWorkoutAdvanced(exercises, user, {
    slot,
    selectedExercises,
    workoutHistory,
    trainingFeatures,
  });

  return (
    rankedExercises.find(
      (exercise) => !selectedExercises.some((item) => item.name === exercise.name),
    ) ?? null
  );
}

function buildSessionExercises(
  exercises,
  user,
  workoutHistory,
  trainingFeatures,
  sessionBlueprint,
) {
  const selectedExercises = [];

  sessionBlueprint.slots.forEach((slot) => {
    const nextExercise = selectExerciseForSlot(
      exercises,
      user,
      workoutHistory,
      trainingFeatures,
      {
        ...slot,
        goalTags: [...normalizeArray(slot.goalTags), ...normalizeArray(sessionBlueprint.sessionGoalTags)],
        bodyParts: [...normalizeArray(slot.bodyParts), ...normalizeArray(sessionBlueprint.sessionBodyParts)],
      },
      selectedExercises,
    );

    if (nextExercise) {
      selectedExercises.push(nextExercise);
    }
  });

  if (selectedExercises.length < EXERCISES_PER_SESSION) {
    const fallbackExercises = generateWorkoutAdvanced(exercises, user, {
      slot: {
        bodyParts: sessionBlueprint.sessionBodyParts,
        goalTags: sessionBlueprint.sessionGoalTags,
      },
      selectedExercises,
      workoutHistory,
      trainingFeatures,
    });

    fallbackExercises.forEach((exercise) => {
      if (selectedExercises.length >= EXERCISES_PER_SESSION) {
        return;
      }

      if (!selectedExercises.some((item) => item.name === exercise.name)) {
        selectedExercises.push(exercise);
      }
    });
  }

  return selectedExercises.slice(0, EXERCISES_PER_SESSION);
}

function buildSessionCandidatePool(
  exercises,
  user,
  workoutHistory,
  trainingFeatures,
  sessionBlueprint,
  selectedExercises,
) {
  const poolExercises = generateWorkoutAdvanced(exercises, user, {
    slot: {
      bodyParts: sessionBlueprint.sessionBodyParts,
      movementPatterns: sessionBlueprint.slots.flatMap(
        (slot) => normalizeArray(slot.movementPatterns).concat(normalizeArray(slot.requiredMovementPatterns)),
      ),
      goalTags: sessionBlueprint.sessionGoalTags,
    },
    selectedExercises: [],
    workoutHistory,
    trainingFeatures,
  }).slice(0, 16);

  return mergeAvailableExercises(selectedExercises, poolExercises);
}

export function generateSmartTrainingPlan({
  exercises = [],
  user,
  workoutHistory = [],
  trainingMlFeedbackHistory = [],
  trainingFeatures: prebuiltTrainingFeatures = null,
  focusKey,
  workoutsPerWeek,
}) {
  const normalizedWorkoutsPerWeek = Math.min(Math.max(Number(workoutsPerWeek) || 3, 2), 5);
  const trainingFeatures =
    prebuiltTrainingFeatures ??
    buildTrainingFeatures({
      exercises,
      user,
      workoutHistory,
      trainingMlFeedbackHistory,
    });
  const adaptiveSignals = trainingFeatures.adaptiveSignals;
  const focusMeta = getFocusMeta(focusKey);
  const planId = createPlanId(focusMeta.key);
  const levelConfig = getLevelConfig(user.trainingLevel);
  const blueprintSessions = orderBlueprintSessions(
    getFocusBlueprint(focusMeta.key, normalizedWorkoutsPerWeek),
    adaptiveSignals,
  );

  const sessions = blueprintSessions.map((sessionBlueprint, index) => {
    const selectedExercises = buildSessionExercises(
      exercises,
      user,
      workoutHistory,
      trainingFeatures,
      sessionBlueprint,
    );
    const candidatePool = buildSessionCandidatePool(
      exercises,
      user,
      workoutHistory,
      trainingFeatures,
      sessionBlueprint,
      selectedExercises,
    );
    const estimatedDurationMin = Math.max(
      sessionBlueprint.duration + levelConfig.durationOffset,
      35,
    );

    return {
      id: `${planId}_session_${index + 1}`,
      key: sessionBlueprint.key,
      index: index + 1,
      dayLabel: `Тренировка ${index + 1}`,
      title: sessionBlueprint.title,
      emphasis: sessionBlueprint.emphasis,
      adaptationHints: buildSessionAdaptationHints(
        sessionBlueprint,
        adaptiveSignals,
        trainingFeatures,
      ),
      estimatedDurationMin,
      warmup: levelConfig.warmup,
      availableExercises: candidatePool.map((exercise) => exercise.name),
      exerciseOptions: candidatePool.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        type: resolvePrescriptionType(exercise),
        difficulty: exercise.difficulty,
      })),
      selectedExerciseNames: selectedExercises.map((exercise) => exercise.name),
      completed: false,
      exercises: selectedExercises.map((exercise) => {
        const exerciseType = resolvePrescriptionType(exercise);
        const volumeDetails = buildAdaptiveExerciseVolume({
          exercise: {
            ...exercise,
            type: exerciseType,
          },
          trainingLevel: user.trainingLevel,
          workoutHistory,
          adaptiveSignals,
        });

        return {
          id: exercise.id,
          name: exercise.name,
          type: exerciseType,
          sets: volumeDetails.sets,
          repRange: volumeDetails.repRange,
          restSeconds: volumeDetails.restSeconds,
          prescription: volumeDetails.prescription,
          volumeTrend: volumeDetails.volumeTrend,
          volumeReason: volumeDetails.volumeReason,
          difficulty: exercise.difficulty,
          bodyPart: exercise.bodyPart,
          movementPattern: exercise.movementPattern,
        };
      }),
    };
  });

  return {
    trainingPlan: {
      id: planId,
      createdAt: new Date().toISOString(),
      focusKey: focusMeta.key,
      focusLabel: focusMeta.label,
      focusDescription: focusMeta.description,
      workoutsPerWeek: sessions.length,
      trainingLevel: user.trainingLevel,
      estimatedMinutesPerWeek: sessions.reduce(
        (total, session) => total + session.estimatedDurationMin,
        0,
      ),
      adaptiveMetadata: {
        generatedFromHistoryCount: workoutHistory.length,
        lastAutoRefreshCompletedCount: workoutHistory.length,
        autoRefreshThreshold: 4,
        refreshedAt: new Date().toISOString(),
      },
      sessions,
    },
    adaptationSummary: buildAdaptationSummary(adaptiveSignals, user),
    highlightedExercises: sessions.flatMap((session) => session.exercises).slice(0, 8),
  };
}
