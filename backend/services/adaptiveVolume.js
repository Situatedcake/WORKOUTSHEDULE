import { normalizeTag } from "./exerciseCatalogUtils.js";
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

function applyProgression({
  baseDetails,
  exerciseType,
}) {
  if (exerciseType === "compound") {
    return {
      sets: Math.min(baseDetails.sets + 1, 6),
      repRange: shiftRangeValue(baseDetails.repRange, { minDelta: -1, maxDelta: -1 }),
      restSeconds: Math.min(baseDetails.restSeconds + 15, 240),
      volumeReason:
        "Добавили объём и чуть повысили интенсивность, потому что в последних тренировках по упражнению был прогресс.",
    };
  }

  if (exerciseType === "cardio") {
    return {
      sets: Math.min(baseDetails.sets + 1, 2),
      repRange: shiftRangeValue(baseDetails.repRange, { minDelta: 2, maxDelta: 4 }),
      restSeconds: Math.max(baseDetails.restSeconds - 5, 20),
      volumeReason:
        "Увеличили кардио-блок и сделали отдых чуть плотнее, потому что пользователь стабильно справляется с текущим объёмом.",
    };
  }

  if (exerciseType === "core") {
    return {
      sets: Math.min(baseDetails.sets + 1, 5),
      repRange: shiftRangeValue(baseDetails.repRange, { minDelta: 5, maxDelta: 10 }),
      restSeconds: Math.max(baseDetails.restSeconds, 45),
      volumeReason:
        "Добавили дополнительный подход и время под нагрузкой, потому что корпус хорошо держит объём.",
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

function applyStallAdjustment({
  baseDetails,
  exerciseType,
}) {
  if (exerciseType === "compound") {
    return {
      sets: Math.max(baseDetails.sets - 1, 3),
      repRange: shiftRangeValue(baseDetails.repRange, { minDelta: 1, maxDelta: 2 }),
      restSeconds: Math.min(baseDetails.restSeconds + 15, 240),
      volumeReason:
        "Слегка снизили объём и сместили диапазон повторений в сторону техники, потому что прогресс по упражнению замедлился.",
    };
  }

  if (exerciseType === "cardio") {
    return {
      sets: baseDetails.sets,
      repRange: shiftRangeValue(baseDetails.repRange, { minDelta: -1, maxDelta: 1 }),
      restSeconds: baseDetails.restSeconds,
      volumeReason:
        "Оставили кардио-объём рядом с базой, чтобы не перегружать восстановление без явного прогресса.",
    };
  }

  if (exerciseType === "core") {
    return {
      sets: Math.max(baseDetails.sets - 1, 3),
      repRange: shiftRangeValue(baseDetails.repRange, { minDelta: 5, maxDelta: 10 }),
      restSeconds: Math.min(baseDetails.restSeconds + 10, 75),
      volumeReason:
        "Немного разгрузили упражнение и дали больше контроля в повторениях, потому что по нему нет свежего роста.",
    };
  }

  return {
    sets: Math.max(baseDetails.sets - 1, 2),
    repRange: shiftRangeValue(baseDetails.repRange, { minDelta: 2, maxDelta: 3 }),
    restSeconds: Math.min(baseDetails.restSeconds + 5, 120),
    volumeReason:
      "Сместили акцент в сторону более контролируемого объёма, потому что упражнение перестало прогрессировать.",
  };
}

export function buildAdaptiveExerciseVolume({
  exercise,
  trainingLevel,
  workoutHistory = [],
  adaptiveSignals = null,
}) {
  const exerciseType = exercise?.type ?? "compound";
  const baseDetails = getExercisePrescriptionDetails(trainingLevel, exerciseType);
  const historyEntries = getRecentExerciseHistory(exercise?.name, workoutHistory);
  const trend = resolveVolumeTrend(historyEntries, baseDetails.sets);
  let nextDetails = {
    ...baseDetails,
    volumeReason: "Используем базовый объём по текущему уровню подготовки.",
  };

  if (trend === "progressing") {
    nextDetails = {
      ...nextDetails,
      ...applyProgression({
        baseDetails,
        exerciseType,
      }),
    };
  } else if (trend === "stalled") {
    nextDetails = {
      ...nextDetails,
      ...applyStallAdjustment({
        baseDetails,
        exerciseType,
      }),
    };
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
  }

  return {
    ...nextDetails,
    prescription: formatExercisePrescription({
      exerciseType,
      sets: nextDetails.sets,
      repRange: nextDetails.repRange,
      restSeconds: nextDetails.restSeconds,
    }),
    volumeTrend: trend,
    recentObservationCount: historyEntries.length,
  };
}
