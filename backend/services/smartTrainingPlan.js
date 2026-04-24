import { randomUUID } from "node:crypto";
import { buildAdaptationSummary } from "./adaptiveSignals.js";
import { buildAdaptiveExerciseVolume } from "./adaptiveVolume.js";
import { hasTagIntersection, normalizeTag, normalizeTagArray } from "./exerciseCatalogUtils.js";
import { buildTrainingFeatures } from "./trainingFeatureBuilder.js";
import { generateWorkoutAdvanced } from "./workoutGenerator.js";
import {
  TRAINING_PLAN_LIBRARY,
  getPlanSessions,
  normalizeWorkoutsPerWeekValue,
} from "../data/trainingPlanCatalog.js";
import {
  EXERCISES_PER_SESSION,
  TRAINING_GOALS,
  getLevelConfig,
  resolveTemplateExerciseType,
} from "../shared/trainingPlanBuilder.js";

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function createPlanId(focusKey) {
  return `smart_plan_${focusKey}_${randomUUID()}`;
}

function getFocusMeta(focusKey) {
  return (
    TRAINING_GOALS.find((item) => item.key === focusKey) ??
    TRAINING_GOALS[0] ?? {
      key: focusKey,
      label: focusKey,
      description: "",
    }
  );
}

function getLibraryFocusDefinition(focusKey) {
  return (
    TRAINING_PLAN_LIBRARY.find((item) => item.key === focusKey) ??
    TRAINING_PLAN_LIBRARY[0] ??
    null
  );
}

function buildBlueprintSlotsFromPool(sessionBlueprint, focusDefinition) {
  const focusTags = normalizeArray(focusDefinition?.mlProfile?.focusTags);
  const sessionGoalTags = normalizeArray(sessionBlueprint.sessionGoalTags);
  const sessionMlTags = normalizeArray(sessionBlueprint.mlTags);
  const sessionMovementPatterns = normalizeArray(sessionBlueprint.movementPatterns);
  const sessionObjective =
    sessionBlueprint.objective ?? focusDefinition?.mlProfile?.objective ?? null;
  const adaptationPriority = focusDefinition?.mlProfile?.adaptationPriority ?? null;
  const orderedPool = normalizeArray(sessionBlueprint.exercisePool)
    .slice()
    .sort((left, right) => (left.priority ?? 99) - (right.priority ?? 99))
    .slice(0, EXERCISES_PER_SESSION);

  return orderedPool.map((exercise) => {
    const exerciseType = resolveTemplateExerciseType(exercise);

    return {
      bodyParts: exercise.bodyPart ? [exercise.bodyPart] : [],
      movementPatterns: exercise.movementPattern
        ? [exercise.movementPattern]
        : sessionMovementPatterns,
      requiredMovementPatterns: exercise.movementPattern
        ? [exercise.movementPattern]
        : [],
      goalTags: [
        ...focusTags,
        ...sessionGoalTags,
        ...normalizeArray(exercise.goalTags),
        ...sessionMlTags,
        sessionObjective,
        adaptationPriority,
      ].filter(Boolean),
      compound: exerciseType === "compound",
      equipment: normalizeArray(exercise.equipment),
      templateName: exercise.name,
      templatePriority: exercise.priority ?? null,
    };
  });
}

function buildLibraryBlueprint(focusDefinition, workoutsPerWeek) {
  const librarySessions = getPlanSessions(focusDefinition, workoutsPerWeek);

  if (librarySessions.length === 0) {
    return [];
  }

  return Array.from({ length: workoutsPerWeek }, (_, index) => {
    const sourceSession = librarySessions[index % librarySessions.length];
    const sessionBodyParts =
      normalizeArray(sourceSession.sessionBodyParts).length > 0
        ? normalizeArray(sourceSession.sessionBodyParts)
        : Array.from(
            new Set(
              normalizeArray(sourceSession.exercisePool)
                .map((exercise) => exercise.bodyPart)
                .filter(Boolean),
            ),
          );

    return {
      key: sourceSession.key ?? `session-${index + 1}`,
      title: sourceSession.title ?? `Сессия ${index + 1}`,
      emphasis: sourceSession.emphasis ?? focusDefinition.description ?? "",
      duration: Number(sourceSession.duration) || 60,
      objective:
        sourceSession.objective ?? focusDefinition.mlProfile?.objective ?? null,
      intensity: sourceSession.intensity ?? null,
      recoveryDemand: sourceSession.recoveryDemand ?? null,
      sessionGoalTags:
        normalizeArray(sourceSession.sessionGoalTags).length > 0
          ? normalizeArray(sourceSession.sessionGoalTags)
          : normalizeArray(focusDefinition.mlProfile?.focusTags),
      movementPatterns: normalizeArray(sourceSession.movementPatterns),
      sessionBodyParts,
      mlTags:
        normalizeArray(sourceSession.mlTags).length > 0
          ? normalizeArray(sourceSession.mlTags)
          : [
              ...normalizeArray(focusDefinition.mlProfile?.focusTags),
              focusDefinition.mlProfile?.objective,
              focusDefinition.mlProfile?.adaptationPriority,
            ].filter(Boolean),
      slots: buildBlueprintSlotsFromPool(sourceSession, focusDefinition),
      index,
    };
  });
}

function getFocusBlueprint(focusKey, workoutsPerWeek) {
  const focusDefinition = getLibraryFocusDefinition(focusKey);
  const derivedBlueprint = buildLibraryBlueprint(focusDefinition, workoutsPerWeek);
  const fallbackFocusDefinition =
    focusDefinition?.key === "full-body-unified"
      ? TRAINING_PLAN_LIBRARY[0] ?? null
      : getLibraryFocusDefinition("full-body-unified");
  const fallbackBlueprint =
    derivedBlueprint.length > 0
      ? derivedBlueprint
      : buildLibraryBlueprint(fallbackFocusDefinition, workoutsPerWeek);
  const blueprint = fallbackBlueprint.length > 0 ? fallbackBlueprint : [];

  if (blueprint.length === 0) {
    return [];
  }

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

  if (
    Array.isArray(trainingFeatures.history.systematicallySkippedExerciseKeys) &&
    trainingFeatures.history.systematicallySkippedExerciseKeys.length > 0
  ) {
    hints.push(
      "Заменяем упражнения, которые регулярно пропускались, на более подходящие альтернативы.",
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

function buildSkippedExerciseKeySet(trainingFeatures) {
  const skippedFromHistory = Array.isArray(
    trainingFeatures?.history?.systematicallySkippedExerciseKeys,
  )
    ? trainingFeatures.history.systematicallySkippedExerciseKeys
    : [];

  return new Set(skippedFromHistory.map((value) => normalizeTag(value)).filter(Boolean));
}

function selectExerciseForSlot(
  exercises,
  user,
  workoutHistory,
  trainingFeatures,
  slot,
  selectedExercises,
  skippedExerciseKeySet = new Set(),
) {
  const rankedExercises = generateWorkoutAdvanced(exercises, user, {
    slot,
    selectedExercises,
    workoutHistory,
    trainingFeatures,
  });
  const preferredExercise = rankedExercises.find((exercise) => {
    if (selectedExercises.some((item) => item.name === exercise.name)) {
      return false;
    }

    const exerciseKey = normalizeTag(exercise.id || exercise.name);
    return !skippedExerciseKeySet.has(exerciseKey);
  });

  if (preferredExercise) {
    return preferredExercise;
  }

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
  const skippedExerciseKeySet = buildSkippedExerciseKeySet(trainingFeatures);

  sessionBlueprint.slots.forEach((slot) => {
    const slotContext = {
      ...slot,
      sessionKey: sessionBlueprint.key,
      sessionObjective: sessionBlueprint.objective ?? null,
      sessionMlTags: sessionBlueprint.mlTags ?? [],
      intensity: sessionBlueprint.intensity ?? null,
      recoveryDemand: sessionBlueprint.recoveryDemand ?? null,
      estimatedDurationMin: sessionBlueprint.duration ?? null,
      goalTags: [
        ...normalizeArray(slot.goalTags),
        ...normalizeArray(sessionBlueprint.sessionGoalTags),
        ...normalizeArray(sessionBlueprint.mlTags),
        sessionBlueprint.objective,
      ].filter(Boolean),
      bodyParts: [
        ...normalizeArray(slot.bodyParts),
        ...normalizeArray(sessionBlueprint.sessionBodyParts),
      ],
    };
    const nextExercise = selectExerciseForSlot(
      exercises,
      user,
      workoutHistory,
      trainingFeatures,
      slotContext,
      selectedExercises,
      skippedExerciseKeySet,
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

    const preferredFallbackExercises = fallbackExercises.filter((exercise) => {
      const exerciseKey = normalizeTag(exercise.id || exercise.name);
      return !skippedExerciseKeySet.has(exerciseKey);
    });
    const fallbackPoolToUse =
      preferredFallbackExercises.length > 0
        ? preferredFallbackExercises
        : fallbackExercises;

    fallbackPoolToUse.forEach((exercise) => {
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
      sessionKey: sessionBlueprint.key,
      sessionObjective: sessionBlueprint.objective ?? null,
      sessionMlTags: sessionBlueprint.mlTags ?? [],
      intensity: sessionBlueprint.intensity ?? null,
      recoveryDemand: sessionBlueprint.recoveryDemand ?? null,
      estimatedDurationMin: sessionBlueprint.duration ?? null,
      bodyParts: sessionBlueprint.sessionBodyParts,
      movementPatterns: [
        ...normalizeArray(sessionBlueprint.movementPatterns),
        ...sessionBlueprint.slots.flatMap((slot) =>
          normalizeArray(slot.movementPatterns).concat(
            normalizeArray(slot.requiredMovementPatterns),
          ),
        ),
      ],
      goalTags: [
        ...normalizeArray(sessionBlueprint.sessionGoalTags),
        ...normalizeArray(sessionBlueprint.mlTags),
        sessionBlueprint.objective,
      ].filter(Boolean),
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
  const normalizedWorkoutsPerWeek = normalizeWorkoutsPerWeekValue(workoutsPerWeek, 3);
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
  const focusDefinition = getLibraryFocusDefinition(focusMeta.key);
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
      objective: sessionBlueprint.objective ?? null,
      intensity: sessionBlueprint.intensity ?? null,
      recoveryDemand: sessionBlueprint.recoveryDemand ?? null,
      sessionBodyParts: sessionBlueprint.sessionBodyParts,
      mlTags: sessionBlueprint.mlTags ?? [],
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
          trainingFeatures,
          sessionContext: {
            sessionKey: sessionBlueprint.key,
            sessionTitle: sessionBlueprint.title,
            sessionObjective: sessionBlueprint.objective ?? null,
            sessionGoalTags: sessionBlueprint.sessionGoalTags ?? [],
            sessionBodyParts: sessionBlueprint.sessionBodyParts ?? [],
            sessionMlTags: sessionBlueprint.mlTags ?? [],
            intensity: sessionBlueprint.intensity ?? null,
            recoveryDemand: sessionBlueprint.recoveryDemand ?? null,
            adaptationPriority: focusDefinition?.mlProfile?.adaptationPriority ?? null,
          },
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
      sourcePlanKey: focusMeta.key,
      focusKey: focusMeta.key,
      focusLabel: focusMeta.label,
      focusDescription: focusMeta.description,
      mlProfile: focusDefinition?.mlProfile ?? {},
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


