import { normalizeTag, normalizeTagArray } from "./exerciseCatalogUtils.js";
import {
  formatExercisePrescription,
  getExercisePrescriptionDetails,
} from "../shared/trainingPlanBuilder.js";

const HISTORY_WINDOW_SIZE = 5;
const MIN_STALLED_OBSERVATIONS = 3;
const PROGRESS_WEIGHT_DELTA_KG = 2.5;
const HEAVY_BODY_PART_USAGE_THRESHOLD = 8;

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sumValues(values = []) {
  return values.reduce((total, value) => total + value, 0);
}

function getTrackedWeights(weightsKg = []) {
  return normalizeArray(weightsKg).filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
}

function getRecentExerciseHistory(exerciseName, workoutHistory = []) {
  const normalizedExerciseName = normalizeTag(exerciseName);

  return normalizeArray(workoutHistory)
    .flatMap((workout) =>
      normalizeArray(workout.exerciseSetWeights).map((exerciseEntry) => ({
        exerciseName: exerciseEntry.exerciseName,
        weightsKg: normalizeArray(exerciseEntry.weightsKg),
      })),
    )
    .filter(
      (exerciseEntry) =>
        normalizeTag(exerciseEntry.exerciseName) === normalizedExerciseName,
    )
    .slice(-HISTORY_WINDOW_SIZE)
    .map((exerciseEntry) => {
      const trackedWeights = getTrackedWeights(exerciseEntry.weightsKg);

      return {
        setCount: exerciseEntry.weightsKg.length,
        trackedSetCount: trackedWeights.length,
        bestWeightKg: trackedWeights.length ? Math.max(...trackedWeights) : null,
      };
    });
}

function parseRangeValue(rangeValue) {
  const match = String(rangeValue ?? "")
    .trim()
    .match(/^(\d+)(?:\s*-\s*(\d+))?\s*(.*)$/);

  if (!match) {
    return null;
  }

  return {
    min: Number(match[1]),
    max: Number(match[2] ?? match[1]),
    suffix: match[3].trim(),
  };
}

function formatRangeValue(parsedRange) {
  if (!parsedRange) {
    return "";
  }

  const baseValue =
    parsedRange.min === parsedRange.max
      ? String(parsedRange.min)
      : `${parsedRange.min}-${parsedRange.max}`;

  return parsedRange.suffix ? `${baseValue} ${parsedRange.suffix}` : baseValue;
}

function shiftRangeValue(rangeValue, { minDelta = 0, maxDelta = 0 } = {}) {
  const parsedRange = parseRangeValue(rangeValue);

  if (!parsedRange) {
    return rangeValue;
  }

  const nextMin = Math.max(parsedRange.min + minDelta, 1);
  const nextMax = Math.max(parsedRange.max + maxDelta, nextMin);

  return formatRangeValue({
    ...parsedRange,
    min: nextMin,
    max: nextMax,
  });
}

function didVolumeChange(previousDetails, nextDetails) {
  return (
    previousDetails.sets !== nextDetails.sets ||
    previousDetails.repRange !== nextDetails.repRange ||
    previousDetails.restSeconds !== nextDetails.restSeconds
  );
}

function resolveVolumeTrend(historyEntries, baseSets) {
  if (historyEntries.length < 2) {
    return "base";
  }

  const bestWeights = historyEntries
    .map((entry) => entry.bestWeightKg)
    .filter((value) => value != null);
  const firstBestWeight = bestWeights[0] ?? null;
  const latestBestWeight = bestWeights.at(-1) ?? null;

  if (
    firstBestWeight != null &&
    latestBestWeight != null &&
    latestBestWeight - firstBestWeight >= PROGRESS_WEIGHT_DELTA_KG
  ) {
    return "progressing";
  }

  if (historyEntries.length >= MIN_STALLED_OBSERVATIONS && bestWeights.length >= 2) {
    const bestWeightSpread = Math.max(...bestWeights) - Math.min(...bestWeights);
    const averageSetCount =
      sumValues(historyEntries.map((entry) => entry.setCount)) /
      historyEntries.length;

    if (bestWeightSpread <= PROGRESS_WEIGHT_DELTA_KG && averageSetCount >= baseSets) {
      return "stalled";
    }
  }

  return "base";
}

function applyProgression({ baseDetails, exerciseType }) {
  if (exerciseType === "compound") {
    return {
      sets: Math.min(baseDetails.sets + 1, 6),
      repRange: shiftRangeValue(baseDetails.repRange, {
        minDelta: -1,
        maxDelta: -1,
      }),
      restSeconds: Math.min(baseDetails.restSeconds + 15, 240),
      volumeReason:
        "Добавили объём и немного усилили нагрузку, потому что по упражнению уже виден рабочий прогресс.",
    };
  }

  if (exerciseType === "cardio") {
    return {
      sets: Math.min(baseDetails.sets + 1, 2),
      repRange: shiftRangeValue(baseDetails.repRange, {
        minDelta: 2,
        maxDelta: 4,
      }),
      restSeconds: Math.max(baseDetails.restSeconds - 5, 20),
      volumeReason:
        "Увеличили кардио-блок и сделали отдых чуть плотнее, потому что текущий объём уже даётся уверенно.",
    };
  }

  if (exerciseType === "core") {
    return {
      sets: Math.min(baseDetails.sets + 1, 5),
      repRange: shiftRangeValue(baseDetails.repRange, {
        minDelta: 5,
        maxDelta: 10,
      }),
      restSeconds: Math.max(baseDetails.restSeconds, 45),
      volumeReason:
        "Добавили подход и время под нагрузкой, потому что корпус уже хорошо держит текущий объём.",
    };
  }

  return {
    sets: Math.min(baseDetails.sets + 1, 5),
    repRange: shiftRangeValue(baseDetails.repRange, { maxDelta: 2 }),
    restSeconds: Math.min(baseDetails.restSeconds + 10, 120),
    volumeReason:
      "Подняли объём изоляции, потому что в последних тренировках уже виден рабочий запас.",
  };
}

function applyStallAdjustment({ baseDetails, exerciseType }) {
  if (exerciseType === "compound") {
    return {
      sets: Math.max(baseDetails.sets - 1, 3),
      repRange: shiftRangeValue(baseDetails.repRange, {
        minDelta: 1,
        maxDelta: 2,
      }),
      restSeconds: Math.min(baseDetails.restSeconds + 15, 240),
      volumeReason:
        "Слегка снизили объём и сместили диапазон повторений в сторону контроля техники, потому что прогресс замедлился.",
    };
  }

  if (exerciseType === "cardio") {
    return {
      sets: baseDetails.sets,
      repRange: shiftRangeValue(baseDetails.repRange, {
        minDelta: -1,
        maxDelta: 1,
      }),
      restSeconds: baseDetails.restSeconds,
      volumeReason:
        "Оставили кардио рядом с базой, чтобы не перегружать восстановление без явного прогресса.",
    };
  }

  if (exerciseType === "core") {
    return {
      sets: Math.max(baseDetails.sets - 1, 3),
      repRange: shiftRangeValue(baseDetails.repRange, {
        minDelta: 5,
        maxDelta: 10,
      }),
      restSeconds: Math.min(baseDetails.restSeconds + 10, 75),
      volumeReason:
        "Немного разгрузили упражнение и сделали повторения более контролируемыми, потому что по нему нет свежего роста.",
    };
  }

  return {
    sets: Math.max(baseDetails.sets - 1, 2),
    repRange: shiftRangeValue(baseDetails.repRange, {
      minDelta: 2,
      maxDelta: 3,
    }),
    restSeconds: Math.min(baseDetails.restSeconds + 5, 120),
    volumeReason:
      "Сместили акцент в сторону более контролируемого объёма, потому что упражнение перестало прогрессировать.",
  };
}

function getContextTags(trainingFeatures, sessionContext = {}) {
  return normalizeTagArray([
    trainingFeatures?.profile?.goal,
    trainingFeatures?.profile?.objective,
    trainingFeatures?.profile?.adaptationPriority,
    ...(trainingFeatures?.profile?.focusTags ?? []),
    sessionContext.sessionObjective,
    sessionContext.adaptationPriority,
    sessionContext.intensity,
    sessionContext.recoveryDemand,
    ...(sessionContext.sessionGoalTags ?? []),
    ...(sessionContext.sessionMlTags ?? []),
    ...(sessionContext.sessionBodyParts ?? []),
  ]);
}

function buildProgrammedVolume({
  baseDetails,
  exercise,
  exerciseType,
  trainingFeatures,
  sessionContext,
}) {
  const profileTags = new Set(
    normalizeTagArray([
      trainingFeatures?.profile?.goal,
      trainingFeatures?.profile?.objective,
      trainingFeatures?.profile?.adaptationPriority,
      ...(trainingFeatures?.profile?.focusTags ?? []),
    ]),
  );
  const sessionSignalTags = new Set(
    normalizeTagArray([
      sessionContext.sessionObjective,
      sessionContext.intensity,
      sessionContext.recoveryDemand,
      ...(sessionContext.sessionGoalTags ?? []),
      ...(sessionContext.sessionBodyParts ?? []),
    ]),
  );
  const sessionTags = new Set(
    normalizeTagArray([
      sessionContext.sessionObjective,
      sessionContext.adaptationPriority,
      sessionContext.intensity,
      sessionContext.recoveryDemand,
      ...(sessionContext.sessionGoalTags ?? []),
      ...(sessionContext.sessionMlTags ?? []),
      ...(sessionContext.sessionBodyParts ?? []),
    ]),
  );
  const contextTags = new Set([...profileTags, ...sessionTags]);
  const normalizedBodyPart = normalizeTag(exercise?.bodyPart);
  const normalizedExerciseGoalTags = normalizeTagArray(exercise?.goalTags);
  const readinessScore = Number(trainingFeatures?.readiness?.readinessScore) || 50;
  const skipRate = Number(trainingFeatures?.history?.skipRate) || 0;
  const partialRate = Number(trainingFeatures?.history?.partialRate) || 0;
  const lowRecovery =
    readinessScore <= 45 ||
    skipRate >= 0.25 ||
    partialRate >= 0.25 ||
    (trainingFeatures?.recovery?.averageSleepQuality != null &&
      Number(trainingFeatures.recovery.averageSleepQuality) <= 2.5) ||
    (trainingFeatures?.recovery?.averageEnergyLevel != null &&
      Number(trainingFeatures.recovery.averageEnergyLevel) <= 2.5);
  const isArmsPriority =
    ["arms", "biceps", "triceps", "forearms"].includes(normalizedBodyPart) ||
    normalizedExerciseGoalTags.some((tag) =>
      ["arms", "biceps", "triceps", "forearms"].includes(tag),
    );
  const isStrengthSession =
    sessionSignalTags.has("strength") || sessionSignalTags.has("power");
  const isPumpSession =
    sessionSignalTags.has("pump") ||
    sessionSignalTags.has("endurance") ||
    sessionSignalTags.has("metabolic-stress");
  const isSupportSession =
    sessionSignalTags.has("support") ||
    sessionSignalTags.has("balance") ||
    sessionSignalTags.has("posture") ||
    sessionSignalTags.has("health") ||
    sessionSignalTags.has("recovery");
  const isHighFrequencySession =
    contextTags.has("high-frequency") ||
    contextTags.has("frequency") ||
    Number(trainingFeatures?.profile?.workoutsPerWeek) >= 4;
  const isFatigueManagement =
    contextTags.has("fatigue-management") ||
    contextTags.has("fatigue-management".replace(/_/g, "-")) ||
    contextTags.has("volume-distribution");
  const isVolumePriority =
    contextTags.has("hypertrophy") ||
    contextTags.has("mass") ||
    contextTags.has("high-volume") ||
    contextTags.has("high-volume".replace(/_/g, "-")) ||
    contextTags.has("arms-growth");

  let nextDetails = { ...baseDetails };
  let volumeReason = "Используем базовый объём по текущему уровню подготовки.";
  const shouldUseSupportAdjustment =
    lowRecovery ||
    isSupportSession ||
    ((isHighFrequencySession && isFatigueManagement) &&
      !isStrengthSession &&
      !isPumpSession &&
      !isArmsPriority);

  if (exerciseType === "compound" && isStrengthSession && !lowRecovery) {
    nextDetails = {
      ...nextDetails,
      repRange: shiftRangeValue(nextDetails.repRange, {
        minDelta: -1,
        maxDelta: -2,
      }),
      restSeconds: Math.min(nextDetails.restSeconds + 15, 240),
    };
    volumeReason =
      "Сместили упражнение в более силовой режим под задачу этого дня: меньше повторений и больше отдыха.";
  }

  if (
    exerciseType === "isolation" &&
    isArmsPriority &&
    (isPumpSession || isVolumePriority) &&
    !lowRecovery
  ) {
    nextDetails = {
      ...nextDetails,
      sets: Math.min(nextDetails.sets + 1, 6),
      repRange: shiftRangeValue(nextDetails.repRange, {
        minDelta: 2,
        maxDelta: 3,
      }),
      restSeconds: Math.max(nextDetails.restSeconds - 10, 45),
    };
    volumeReason =
      "Подняли объём изоляции под специализацию и памповую задачу дня, чтобы усилить локальную нагрузку.";
  }

  if (shouldUseSupportAdjustment && exerciseType !== "cardio") {
    const minimumSets = exerciseType === "compound" ? 3 : 2;
    nextDetails = {
      ...nextDetails,
      sets: Math.max(nextDetails.sets - 1, minimumSets),
      repRange: shiftRangeValue(nextDetails.repRange, {
        minDelta: 1,
        maxDelta: 2,
      }),
      restSeconds: Math.min(nextDetails.restSeconds + 10, 180),
    };
    volumeReason =
      "Сделали нагрузку спокойнее под поддерживающий день и контроль утомления, чтобы план было легче держать стабильно.";
  }

  if (
    exerciseType === "core" &&
    (isSupportSession || contextTags.has("stability") || contextTags.has("core"))
  ) {
    nextDetails = {
      ...nextDetails,
      sets: Math.min(nextDetails.sets + 1, 5),
      repRange: shiftRangeValue(nextDetails.repRange, {
        minDelta: 5,
        maxDelta: 10,
      }),
    };
    volumeReason =
      "Добавили немного стабилизирующего объёма, потому что этот день поддерживает технику и общий баланс.";
  }

  if (
    exerciseType === "cardio" &&
    (contextTags.has("cardio") || contextTags.has("weight-loss"))
  ) {
    nextDetails = {
      ...nextDetails,
      repRange: shiftRangeValue(nextDetails.repRange, {
        minDelta: 2,
        maxDelta: 4,
      }),
      restSeconds: Math.max(nextDetails.restSeconds - 5, 20),
    };
    volumeReason =
      "Сделали кардио-блок плотнее под цель снижения веса и более высокий расход.";
  }

  return {
    ...nextDetails,
    volumeReason,
    isAdjusted: didVolumeChange(baseDetails, nextDetails),
  };
}

export function buildAdaptiveExerciseVolume({
  exercise,
  trainingLevel,
  workoutHistory = [],
  adaptiveSignals = null,
  trainingFeatures = null,
  sessionContext = {},
}) {
  const exerciseType = exercise?.type ?? "compound";
  const baseDetails = getExercisePrescriptionDetails(trainingLevel, exerciseType);
  const programmedBase = buildProgrammedVolume({
    baseDetails,
    exercise,
    exerciseType,
    trainingFeatures,
    sessionContext,
  });
  const historyEntries = getRecentExerciseHistory(exercise?.name, workoutHistory);
  const trend = resolveVolumeTrend(historyEntries, programmedBase.sets);
  let nextDetails = {
    ...programmedBase,
  };
  let volumeTrend = programmedBase.isAdjusted ? "programmed" : "base";

  if (trend === "progressing") {
    nextDetails = {
      ...nextDetails,
      ...applyProgression({
        baseDetails: programmedBase,
        exerciseType,
      }),
    };
    volumeTrend = "progressing";
  } else if (trend === "stalled") {
    nextDetails = {
      ...nextDetails,
      ...applyStallAdjustment({
        baseDetails: programmedBase,
        exerciseType,
      }),
    };
    volumeTrend = "stalled";
  }

  const normalizedBodyPart = normalizeTag(exercise?.bodyPart);
  const bodyPartUsage =
    adaptiveSignals?.bodyPartFrequency?.get(normalizedBodyPart) ?? 0;

  if (
    normalizedBodyPart &&
    bodyPartUsage >= HEAVY_BODY_PART_USAGE_THRESHOLD &&
    nextDetails.sets > 2
  ) {
    nextDetails = {
      ...nextDetails,
      sets: nextDetails.sets - 1,
      volumeReason:
        "Чуть разгрузили мышечную группу, потому что в недавней истории на неё уже было много объёма.",
    };

    if (volumeTrend === "base") {
      volumeTrend = "programmed";
    }
  }

  return {
    ...nextDetails,
    prescription: formatExercisePrescription({
      exerciseType,
      sets: nextDetails.sets,
      repRange: nextDetails.repRange,
      restSeconds: nextDetails.restSeconds,
    }),
    volumeTrend,
    recentObservationCount: historyEntries.length,
  };
}
