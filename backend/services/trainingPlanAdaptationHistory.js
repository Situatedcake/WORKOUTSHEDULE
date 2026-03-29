import { randomUUID } from "node:crypto";

function normalizeNumber(value, fallbackValue = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function normalizeString(value, fallbackValue = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
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
