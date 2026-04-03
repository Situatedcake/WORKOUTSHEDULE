import { buildTrainingFeatures } from "./trainingFeatureBuilder.js";
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
  const expectedGoalTags = [
    user.goal,
    user.focusKey,
    user.objective,
    user.adaptationPriority,
    ...(user.focusTags ?? []),
    ...(slot.goalTags ?? []),
    ...(slot.sessionMlTags ?? []),
    slot.sessionObjective,
  ];

  if (normalizeTag(exercise.type) === normalizeTag(user.goal)) {
    score += 8;
  }

  if (hasTagIntersection(exercise.goalTags, expectedGoalTags)) {
    score += 10;
  }

  if (hasTagIntersection(expectedGoalTags, ["arms", "biceps", "triceps"])) {
    const normalizedBodyPart = normalizeTag(exercise.bodyPart);
    const normalizedGoalTags = normalizeTagArray(exercise.goalTags);

    if (
      normalizedBodyPart === "arms" ||
      normalizedGoalTags.some((tag) =>
        ["arms", "biceps", "triceps", "forearms"].includes(tag),
      )
    ) {
      score += 4;
    }
  }

  return score;
}

function scoreTargetBodyParts(exercise, user, slot = {}, adaptiveSignals) {
  let score = 0;
  const slotBodyParts = normalizeTagArray(slot.bodyParts);
  const userTargetBodyParts = normalizeTagArray(user.targetBodyParts);
  const normalizedExerciseBodyPart = normalizeTag(exercise.bodyPart);
  const normalizedMuscleGroups = normalizeTagArray(exercise.muscleGroups);
  const matchesSlotBodyPart =
    slotBodyParts.length > 0 &&
    (slotBodyParts.includes(normalizedExerciseBodyPart) ||
      normalizedMuscleGroups.some((group) => slotBodyParts.includes(group)));

  if (slotBodyParts.length > 0) {
    if (slotBodyParts.includes(normalizedExerciseBodyPart)) {
      score += 12;
    }

    if (normalizedMuscleGroups.some((group) => slotBodyParts.includes(group))) {
      score += 8;
    }

    if (!matchesSlotBodyPart && normalizedExerciseBodyPart !== "full-body") {
      score -= 6;
    }
  }

  if (userTargetBodyParts.includes(normalizedExerciseBodyPart)) {
    score += 5;
  }

  if (
    normalizedMuscleGroups.some((group) => userTargetBodyParts.includes(group))
  ) {
    score += 4;
  }

  if (
    normalizedExerciseBodyPart === "full-body" &&
    (slotBodyParts.length > 0 || userTargetBodyParts.length > 0)
  ) {
    score += 4;
  }

  if (
    (matchesSlotBodyPart || userTargetBodyParts.includes(normalizedExerciseBodyPart)) &&
    getBodyPartFrequency(adaptiveSignals, exercise.bodyPart) <= 2
  ) {
    score += 3;
  }

  if (
    (matchesSlotBodyPart || userTargetBodyParts.includes(normalizedExerciseBodyPart)) &&
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

function scoreGenderContext(exercise, user, slot = {}) {
  const normalizedBodyPart = normalizeTag(exercise.bodyPart);
  const normalizedGoalTags = normalizeTagArray(exercise.goalTags);
  let score = 0;

  if (user.gender === "female") {
    if (
      user.focusKey === "women-cardio" &&
      ["cardio", "legs", "full-body", "core", "shoulders"].includes(
        normalizedBodyPart,
      )
    ) {
      score += 6;
    }

    if (
      user.goal === "weight_loss" &&
      (normalizeTag(exercise.type) === "weight-loss" ||
        normalizedGoalTags.includes("weight-loss") ||
        normalizedGoalTags.includes("cardio"))
    ) {
      score += 3;
    }

    if (
      slot.sessionKey === "women-cardio-burn" &&
      ["cardio", "legs", "full-body"].includes(normalizedBodyPart)
    ) {
      score += 4;
    }
  }

  return score;
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

function scoreSessionContext(exercise, slot = {}, trainingFeatures) {
  const normalizedIntensity = normalizeTag(slot.intensity);
  const normalizedRecoveryDemand = normalizeTag(slot.recoveryDemand);
  const normalizedSessionObjective = normalizeTag(slot.sessionObjective);
  const sessionMlTags = normalizeTagArray(slot.sessionMlTags);
  const normalizedGoalTags = normalizeTagArray(exercise.goalTags);
  const normalizedBodyPart = normalizeTag(exercise.bodyPart);
  const estimatedDurationMin = Number(slot.estimatedDurationMin) || null;
  let score = 0;

  if (
    sessionMlTags.includes("arms-priority") ||
    normalizedSessionObjective.includes("arms")
  ) {
    if (
      normalizedBodyPart === "arms" ||
      normalizedGoalTags.some((tag) =>
        ["arms", "biceps", "triceps", "forearms"].includes(tag),
      )
    ) {
      score += 6;
    }
  }

  if (
    sessionMlTags.includes("support-day") ||
    sessionMlTags.includes("joint-balance") ||
    normalizedSessionObjective.includes("support") ||
    normalizedSessionObjective.includes("balance")
  ) {
    if (["back", "shoulders", "core"].includes(normalizedBodyPart)) {
      score += 4;
    }

    if (normalizedBodyPart === "arms" && !exercise.compound) {
      score -= 2;
    }
  }

  if (normalizedIntensity === "high" || normalizedIntensity === "moderate-high") {
    if (exercise.compound) {
      score += 3;
    }

    if (exercise.difficulty >= 2) {
      score += 2;
    }
  }

  if (normalizedRecoveryDemand === "high") {
    if (
      trainingFeatures.history.skipRate >= 0.2 ||
      trainingFeatures.readiness.readinessScore <= 45
    ) {
      if (exercise.difficulty >= 3) {
        score -= 5;
      }

      if (exercise.compound) {
        score -= 2;
      }
    } else if (exercise.compound && exercise.difficulty >= 2) {
      score += 2;
    }
  }

  if (
    normalizedRecoveryDemand === "low" ||
    normalizedRecoveryDemand === "low-moderate"
  ) {
    if (exercise.difficulty === 1) {
      score += 2;
    }

    if (normalizeTag(exercise.type) === "core" || normalizedBodyPart === "core") {
      score += 2;
    }
  }

  if (estimatedDurationMin != null && estimatedDurationMin <= 50 && exercise.difficulty >= 3) {
    score -= 2;
  }

  if (estimatedDurationMin != null && estimatedDurationMin >= 70 && exercise.compound) {
    score += 2;
  }

  return score;
}

function scoreReadinessAndFeedback(exercise, trainingFeatures) {
  const { history, recovery, feedback, readiness } = trainingFeatures;
  let score = 0;

  if (history.skipRate >= 0.3 && exercise.difficulty >= 3) {
    score -= 4;
  }

  if (history.partialRate >= 0.25 && exercise.compound) {
    score -= 2;
  }

  if (
    recovery.averageSleepQuality != null &&
    recovery.averageSleepQuality <= 2.5 &&
    exercise.difficulty >= 3
  ) {
    score -= 5;
  }

  if (
    recovery.averageEnergyLevel != null &&
    recovery.averageEnergyLevel <= 2.5 &&
    exercise.compound
  ) {
    score -= 4;
  }

  if (readiness.readinessScore <= 35 && exercise.difficulty >= 3) {
    score -= 4;
  }

  if (
    feedback.countsByType.exercise_replaced >= 3 &&
    normalizeTag(exercise.id) &&
    feedback.recentExerciseEditRate > 0.3
  ) {
    score += exercise.compound ? -1 : 1;
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
    trainingFeatures,
    slot = {},
    selectedExercises = [],
  } = {},
) {
  const adaptiveSignals = trainingFeatures.adaptiveSignals;

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
  score += scoreGenderContext(exercise, user, slot);
  score += scoreContraindications(exercise, user);
  score += scoreExerciseHistory(exercise, adaptiveSignals);
  score += scoreSlotTraits(exercise, slot);
  score += scoreSessionContext(exercise, slot, trainingFeatures);
  score += scoreReadinessAndFeedback(exercise, trainingFeatures);

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
    trainingFeatures = null,
  } = {},
) {
  const resolvedTrainingFeatures =
    trainingFeatures ??
    buildTrainingFeatures({
      exercises,
      user,
      workoutHistory,
    });

  return normalizeArray(exercises)
    .map((exercise) => ({
      ...exercise,
      score: scoreExercise(exercise, user, {
        trainingFeatures: resolvedTrainingFeatures,
        slot,
        selectedExercises,
      }),
    }))
    .filter((exercise) => exercise.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 24);
}
