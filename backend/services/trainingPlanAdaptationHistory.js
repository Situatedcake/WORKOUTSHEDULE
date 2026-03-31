import { randomUUID } from "node:crypto";

function normalizeNumber(value, fallbackValue = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function normalizeString(value, fallbackValue = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatExerciseCountLabel(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} упражнение`;
  }

  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 12 || count % 100 > 14)
  ) {
    return `${count} упражнения`;
  }

  return `${count} упражнений`;
}

function buildExerciseSignature(exercise = {}) {
  return [
    normalizeString(exercise.id),
    normalizeString(exercise.name),
    normalizeString(exercise.type),
    normalizeNumber(exercise.sets, 0),
    normalizeString(exercise.repRange),
    normalizeNumber(exercise.restSeconds, 0),
  ].join("::");
}

function getPlanExerciseSlots(trainingPlan = null) {
  if (!trainingPlan?.sessions?.length) {
    return [];
  }

  return trainingPlan.sessions.flatMap((session, sessionIndex) =>
    (session.exercises ?? []).map((exercise, exerciseIndex) => ({
      slotKey: [
        normalizeString(session.id, `session_${sessionIndex + 1}`),
        exerciseIndex,
      ].join("::"),
      signature: buildExerciseSignature(exercise),
    })),
  );
}

export function buildTrainingPlanVolumeBreakdown(trainingPlan = null) {
  const result = {
    progressing: 0,
    stalled: 0,
    manual: 0,
    base: 0,
  };

  (trainingPlan?.sessions ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((exercise) => {
      const trend = normalizeString(exercise?.volumeTrend, "base");

      if (!Object.hasOwn(result, trend)) {
        result.base += 1;
        return;
      }

      result[trend] += 1;
    });
  });

  return result;
}

function getPlanExerciseCount(trainingPlan = null) {
  return (trainingPlan?.sessions ?? []).reduce(
    (total, session) => total + (session.exercises?.length ?? 0),
    0,
  );
}

function getNonBaseExerciseCount(trainingPlan = null) {
  const breakdown = buildTrainingPlanVolumeBreakdown(trainingPlan);

  return breakdown.progressing + breakdown.stalled + breakdown.manual;
}

function calculateChangedExerciseSlots(previousPlan = null, nextPlan = null) {
  const previousSlots = getPlanExerciseSlots(previousPlan);
  const nextSlots = getPlanExerciseSlots(nextPlan);

  if (!previousSlots.length) {
    return Math.max(getNonBaseExerciseCount(nextPlan), nextSlots.length);
  }

  const previousMap = new Map(
    previousSlots.map((slot) => [slot.slotKey, slot.signature]),
  );

  return nextSlots.reduce((total, slot) => {
    const previousSignature = previousMap.get(slot.slotKey);

    return total + (previousSignature === slot.signature ? 0 : 1);
  }, 0);
}

function getExerciseCount(trainingPlan = null) {
  return (trainingPlan?.sessions ?? []).reduce(
    (total, session) => total + (session.exercises?.length ?? 0),
    0,
  );
}

function buildManualVolumeReason(previousExercise, nextExercise) {
  if (!previousExercise) {
    return "Упражнение добавлено вручную, поэтому система учитывает его как ручное изменение плана.";
  }

  if (
    normalizeString(previousExercise.name) !== normalizeString(nextExercise?.name)
  ) {
    return "Упражнение заменено вручную, поэтому блок адаптации показывает его как ручное изменение.";
  }

  return "План обновлён вручную, поэтому упражнение помечено как ручная корректировка.";
}

function normalizeVolumeBreakdown(breakdown = {}) {
  return {
    progressing: normalizeNumber(breakdown.progressing, 0),
    stalled: normalizeNumber(breakdown.stalled, 0),
    manual: normalizeNumber(breakdown.manual, 0),
    base: normalizeNumber(breakdown.base, 0),
  };
}

export function normalizeTrainingPlanAdaptationEvent(event = {}) {
  const normalizedBreakdown = normalizeVolumeBreakdown(event.volumeBreakdown);
  const totalExercises =
    normalizeNumber(event.totalExercises, 0) ||
    Object.values(normalizedBreakdown).reduce((total, value) => total + value, 0);

  return {
    id: normalizeString(event.id, `adaptation_${randomUUID()}`),
    createdAt: normalizeString(event.createdAt, new Date().toISOString()),
    trigger: normalizeString(event.trigger, "manual_update"),
    previousPlanId: normalizeString(event.previousPlanId) || null,
    nextPlanId: normalizeString(event.nextPlanId) || null,
    focusKey: normalizeString(event.focusKey) || null,
    focusLabel: normalizeString(event.focusLabel) || null,
    workoutsPerWeek: normalizeNumber(event.workoutsPerWeek, 0),
    trainingLevel: normalizeString(event.trainingLevel) || null,
    changedExercisesCount: normalizeNumber(event.changedExercisesCount, 0),
    totalExercises,
    volumeBreakdown: normalizedBreakdown,
    adaptationSummary: Array.isArray(event.adaptationSummary)
      ? event.adaptationSummary.filter(
          (item) => typeof item === "string" && item.trim(),
        )
      : [],
    autoUpdated: Boolean(event.autoUpdated),
  };
}

export function normalizeTrainingPlanAdaptationHistory(history = []) {
  return Array.isArray(history)
    ? history
        .map(normalizeTrainingPlanAdaptationEvent)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    : [];
}

export function annotateManualTrainingPlanChanges(previousPlan = null, nextPlan = null) {
  if (!nextPlan?.sessions?.length) {
    return nextPlan;
  }

  const annotatedPlan = cloneValue(nextPlan);

  annotatedPlan.sessions = (annotatedPlan.sessions ?? []).map(
    (session, sessionIndex) => {
      const previousSession =
        (previousPlan?.sessions ?? []).find(
          (item) =>
            normalizeString(item?.id, `session_${sessionIndex + 1}`) ===
            normalizeString(session?.id, `session_${sessionIndex + 1}`),
        ) ??
        previousPlan?.sessions?.[sessionIndex] ??
        null;

      return {
        ...session,
        exercises: (session.exercises ?? []).map((exercise, exerciseIndex) => {
          const previousExercise = previousSession?.exercises?.[exerciseIndex] ?? null;
          const currentTrend = normalizeString(exercise?.volumeTrend, "base");
          const didSlotChange =
            !previousExercise ||
            buildExerciseSignature(previousExercise) !==
              buildExerciseSignature(exercise);

          if (!didSlotChange || currentTrend === "manual") {
            return exercise;
          }

          if (currentTrend === "progressing" || currentTrend === "stalled") {
            return exercise;
          }

          return {
            ...exercise,
            volumeTrend: "manual",
            volumeReason:
              normalizeString(exercise?.volumeReason) ||
              buildManualVolumeReason(previousExercise, exercise),
          };
        }),
      };
    },
  );

  return annotatedPlan;
}

export function buildManualTrainingPlanAdaptationSummary(
  previousPlan = null,
  nextPlan = null,
) {
  if (!nextPlan) {
    return [];
  }

  const summary = [];
  const previousExerciseCount = getExerciseCount(previousPlan);
  const nextExerciseCount = getExerciseCount(nextPlan);
  const changedExercisesCount = calculateChangedExerciseSlots(previousPlan, nextPlan);
  const manualVolumeBreakdown = buildTrainingPlanVolumeBreakdown(nextPlan);

  if (
    normalizeString(previousPlan?.focusLabel) &&
    normalizeString(previousPlan?.focusLabel) !== normalizeString(nextPlan?.focusLabel)
  ) {
    summary.push(`Акцент программы изменён на «${nextPlan.focusLabel}».`);
  }

  if (
    normalizeNumber(previousPlan?.workoutsPerWeek, 0) !==
    normalizeNumber(nextPlan?.workoutsPerWeek, 0)
  ) {
    summary.push(`Частота обновлена: ${nextPlan.workoutsPerWeek} тренировки в неделю.`);
  }

  if (changedExercisesCount > 0) {
    summary.push(
      `Ручная правка затронула ${formatExerciseCountLabel(changedExercisesCount)}.`,
    );
  }

  if (nextExerciseCount > previousExerciseCount) {
    summary.push(
      `В программу добавили ${formatExerciseCountLabel(
        nextExerciseCount - previousExerciseCount,
      )}.`,
    );
  } else if (previousExerciseCount > nextExerciseCount) {
    summary.push(
      `Из программы убрали ${formatExerciseCountLabel(
        previousExerciseCount - nextExerciseCount,
      )}.`,
    );
  }

  if (manualVolumeBreakdown.manual > 0) {
    summary.push(
      `Блок адаптации пометил ${formatExerciseCountLabel(
        manualVolumeBreakdown.manual,
      )} как ручные изменения.`,
    );
  }

  return summary.slice(0, 4);
}

export function createTrainingPlanAdaptationEvent({
  previousPlan = null,
  nextPlan = null,
  trigger = "manual_update",
  adaptationSummary = [],
  createdAt = new Date().toISOString(),
}) {
  const volumeBreakdown = buildTrainingPlanVolumeBreakdown(nextPlan);

  return normalizeTrainingPlanAdaptationEvent({
    id: `adaptation_${randomUUID()}`,
    createdAt,
    trigger,
    previousPlanId: previousPlan?.id ?? null,
    nextPlanId: nextPlan?.id ?? null,
    focusKey: nextPlan?.focusKey ?? null,
    focusLabel: nextPlan?.focusLabel ?? null,
    workoutsPerWeek: nextPlan?.workoutsPerWeek ?? 0,
    trainingLevel: nextPlan?.trainingLevel ?? null,
    changedExercisesCount: calculateChangedExerciseSlots(previousPlan, nextPlan),
    totalExercises: getPlanExerciseCount(nextPlan),
    volumeBreakdown,
    adaptationSummary,
    autoUpdated: Boolean(nextPlan?.adaptiveMetadata?.autoUpdated),
  });
}
