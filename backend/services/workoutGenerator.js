import { buildAdaptiveSignals } from "./adaptiveSignals.js";
import {
  hasTagIntersection,
  normalizeArray,
  normalizeEquipment,
  normalizeTag,
  normalizeTagArray,
} from "./exerciseCatalogUtils.js";

function resolveDifficultyTarget(level, adaptiveSignals) {
  let targetDifficulty = 1;

  if (level >= 75) {
    targetDifficulty = 3;
  } else if (level >= 45) {
    targetDifficulty = 2;
  }

  if (
    adaptiveSignals.completedWorkoutCount >= 10 &&
    adaptiveSignals.progressedExerciseNames.size >= 3
  ) {
    return Math.min(targetDifficulty + 0.5, 3);
  }

  return targetDifficulty;
}

function getBodyPartFrequency(adaptiveSignals, bodyPart) {
  return adaptiveSignals.bodyPartFrequency.get(normalizeTag(bodyPart)) ?? 0;
}

function scoreGoalCompatibility(exercise, user, slot = {}) {
  let score = 0;
  const expectedGoalTags = [user.goal, user.focusKey, ...(slot.goalTags ?? [])];

  if (normalizeTag(exercise.type) === normalizeTag(user.goal)) {
    score += 8;
  }

  if (hasTagIntersection(exercise.goalTags, expectedGoalTags)) {
    score += 10;
  }

  return score;
}

function scoreTargetBodyParts(exercise, user, slot = {}, adaptiveSignals) {
  let score = 0;
  const targetBodyParts = normalizeTagArray([
    ...(user.targetBodyParts ?? []),
    ...(slot.bodyParts ?? []),
  ]);
  const normalizedExerciseBodyPart = normalizeTag(exercise.bodyPart);
  const normalizedMuscleGroups = normalizeTagArray(exercise.muscleGroups);

  if (targetBodyParts.includes(normalizedExerciseBodyPart)) {
    score += 9;
  }

  if (normalizedMuscleGroups.some((group) => targetBodyParts.includes(group))) {
    score += 7;
  }

  if (normalizedExerciseBodyPart === "full-body" && targetBodyParts.length > 0) {
    score += 4;
  }

  if (
    targetBodyParts.includes(normalizedExerciseBodyPart) &&
    getBodyPartFrequency(adaptiveSignals, exercise.bodyPart) <= 2
  ) {
    score += 3;
  }

  if (
    targetBodyParts.includes(normalizedExerciseBodyPart) &&
    getBodyPartFrequency(adaptiveSignals, exercise.bodyPart) >= 8
  ) {
    score -= 3;
  }

  return score;
}

function scoreMovementPattern(exercise, slot = {}, selectedExercises = []) {
  let score = 0;
  const normalizedExercisePattern = normalizeTag(exercise.movementPattern);
  const selectedPatterns = new Set(
    normalizeArray(selectedExercises).map((item) =>
      normalizeTag(item.movementPattern),
    ),
  );

  if (
    normalizeTagArray(slot.movementPatterns).includes(normalizedExercisePattern)
  ) {
    score += 8;
  }

  if (selectedPatterns.has(normalizedExercisePattern)) {
    score -= 5;
  }

  const sameBodyPartCount = normalizeArray(selectedExercises).filter(
    (item) => normalizeTag(item.bodyPart) === normalizeTag(exercise.bodyPart),
  ).length;

  if (sameBodyPartCount >= 2) {
    score -= 3;
  }

  return score;
}

function scoreEquipment(exercise, user, adaptiveSignals) {
  const normalizedEquipment = normalizeEquipment(exercise.equipment);
  const userEquipment = normalizeArray(user.equipment).map(normalizeEquipment);

  if (userEquipment.length === 0) {
    return normalizedEquipment === "bodyweight" ? 4 : 1;
  }

  if (
    normalizedEquipment === "bodyweight" ||
    userEquipment.includes(normalizedEquipment)
  ) {
    return 5;
  }

  const equipmentUsage =
    adaptiveSignals.equipmentFrequency.get(normalizedEquipment) ?? 0;

  return equipmentUsage > 0 ? 1 : -8;
}

function scoreContraindications(exercise, user) {
  if (hasTagIntersection(exercise.contraindications, user.injuries)) {
    return -25;
  }

  return 0;
}

function scoreExerciseHistory(exercise, adaptiveSignals) {
  let score = 0;
  const exerciseFrequency = adaptiveSignals.exerciseFrequency.get(exercise.name) ?? 0;
  const movementFrequency =
    adaptiveSignals.movementPatternFrequency.get(normalizeTag(exercise.movementPattern)) ??
    0;

  score += Math.min(exerciseFrequency, 4) * 2;
  score += Math.min(movementFrequency, 5);

  if (adaptiveSignals.progressedExerciseNames.has(exercise.name)) {
    score += 5;
  }

  if (adaptiveSignals.stalledExerciseNames.has(exercise.name)) {
    score -= 4;
  }

  if (adaptiveSignals.stalledAlternativeIds.has(normalizeTag(exercise.id))) {
    score += 4;
  }

  if (adaptiveSignals.recentExerciseNames.has(exercise.name)) {
    score -= 3;
  } else if (adaptiveSignals.completedWorkoutCount >= 6) {
    score += 2;
  }

  return score;
}

function scoreSlotTraits(exercise, slot = {}) {
  let score = 0;

  if (slot.compound === true && exercise.compound) {
    score += 5;
  }

  if (slot.compound === false && !exercise.compound) {
    score += 5;
  }

  if (slot.unilateral === true && exercise.unilateral) {
    score += 4;
  }

  if (slot.unilateral === false && exercise.unilateral) {
    score -= 2;
  }

  return score;
}

function matchesHardFilters(exercise, slot = {}) {
  if (slot.compound === true && !exercise.compound) {
    return false;
  }

  if (slot.unilateral === true && !exercise.unilateral) {
    return false;
  }

  const normalizedExercisePattern = normalizeTag(exercise.movementPattern);
  const normalizedExerciseBodyPart = normalizeTag(exercise.bodyPart);

  if (
    normalizeTagArray(slot.requiredMovementPatterns).length > 0 &&
    !normalizeTagArray(slot.requiredMovementPatterns).includes(
      normalizedExercisePattern,
    )
  ) {
    return false;
  }

  if (
    normalizeTagArray(slot.requiredBodyParts).length > 0 &&
    !normalizeTagArray(slot.requiredBodyParts).includes(normalizedExerciseBodyPart)
  ) {
    return false;
  }

  return true;
}

function scoreExercise(
  exercise,
  user,
  {
    adaptiveSignals,
    slot = {},
    selectedExercises = [],
  } = {},
) {
  if (!matchesHardFilters(exercise, slot)) {
    return Number.NEGATIVE_INFINITY;
  }

  const difficultyTarget = resolveDifficultyTarget(user.level, adaptiveSignals);
  let score = 0;

  score += Math.max(0, 18 - Math.abs(exercise.difficulty - difficultyTarget) * 6);
  score += scoreGoalCompatibility(exercise, user, slot);
  score += scoreTargetBodyParts(exercise, user, slot, adaptiveSignals);
  score += scoreMovementPattern(exercise, slot, selectedExercises);
  score += scoreEquipment(exercise, user, adaptiveSignals);
  score += scoreContraindications(exercise, user);
  score += scoreExerciseHistory(exercise, adaptiveSignals);
  score += scoreSlotTraits(exercise, slot);

  if (user.workoutsPerWeek >= 4 && exercise.difficulty >= 2) {
    score += 2;
  }

  if (user.workoutsPerWeek <= 2 && exercise.difficulty === 1) {
    score += 2;
  }

  if (user.time <= 35 && exercise.difficulty === 3) {
    score -= 3;
  }

  return score;
}

export function generateWorkoutAdvanced(
  exercises = [],
  user,
  {
    slot = {},
    selectedExercises = [],
    workoutHistory = [],
  } = {},
) {
  const adaptiveSignals = buildAdaptiveSignals(exercises, workoutHistory);

  return normalizeArray(exercises)
    .map((exercise) => ({
      ...exercise,
      score: scoreExercise(exercise, user, {
        adaptiveSignals,
        slot,
        selectedExercises,
      }),
    }))
    .filter((exercise) => exercise.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 24);
}
