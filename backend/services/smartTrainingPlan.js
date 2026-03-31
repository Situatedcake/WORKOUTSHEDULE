import { randomUUID } from "node:crypto";
import { buildAdaptationSummary } from "./adaptiveSignals.js";
import { buildAdaptiveExerciseVolume } from "./adaptiveVolume.js";
import { hasTagIntersection, normalizeTag, normalizeTagArray } from "./exerciseCatalogUtils.js";
import { buildTrainingFeatures } from "./trainingFeatureBuilder.js";
import { generateWorkoutAdvanced } from "./workoutGenerator.js";
import { TRAINING_PLAN_BLUEPRINTS } from "../data/trainingPlanCatalog.js";
import {
  EXERCISES_PER_SESSION,
  TRAINING_GOALS,
  getLevelConfig,
} from "../shared/trainingPlanBuilder.js";

const FOCUS_BLUEPRINTS = TRAINING_PLAN_BLUEPRINTS;

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
    hints.push("Подтягиваем мышечные группы, которым раньше доставалось меньше объема.");
  }

  if (
    hasTagIntersection(sessionBlueprint.sessionGoalTags, ["strength", "mass"]) &&
    adaptiveSignals.progressedExerciseNames.size > 0
  ) {
    hints.push("Оставляем часть движений, в которых уже пошел рабочий прогресс.");
  }

  if (adaptiveSignals.stalledExerciseNames.size > 0) {
    hints.push("Добавляем ротацию, чтобы не упираться в одно и то же плато.");
  }

  if (
    trainingFeatures.history.skipRate >= 0.25 ||
    trainingFeatures.history.partialRate >= 0.25
  ) {
    hints.push(
      "Уменьшаем риск перегрузки: объем держим ближе к стабильному режиму.",
    );
  }

  if (
    trainingFeatures.recovery.averageSleepQuality != null &&
    trainingFeatures.recovery.averageSleepQuality <= 2.5
  ) {
    hints.push(
      "Учитываем низкое восстановление по сну и оставляем план более управляемым.",
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


