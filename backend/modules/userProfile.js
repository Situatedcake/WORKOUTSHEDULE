import { TRAINING_PLAN_LIBRARY } from "../data/trainingPlanCatalog.js";

const TRAINING_LEVEL_TO_SCORE = {
  "Не определен": 30,
  Начинающий: 30,
  Средний: 60,
  Продвинутый: 90,
};

const GOAL_MARKERS = {
  weight_loss: [
    "weight_loss",
    "weight-loss",
    "fat_loss",
    "fat-loss",
    "cardio",
    "endurance",
  ],
  mass: [
    "mass",
    "hypertrophy",
    "growth",
    "specialization",
    "pump",
    "biceps",
    "triceps",
  ],
  strength: ["strength", "power", "balanced_strength"],
};

const FOCUS_TAG_TO_BODY_PARTS = {
  arms: ["arms"],
  biceps: ["arms"],
  triceps: ["arms"],
  chest: ["chest", "upper_chest"],
  back: ["back"],
  shoulders: ["shoulders"],
  legs: ["legs"],
  core: ["core"],
  cardio: ["cardio", "legs", "full_body", "core"],
  balance: ["full_body", "core"],
  "full-body": ["full_body", "legs", "back", "chest", "core", "shoulders"],
  upper: ["chest", "upper_chest", "back", "shoulders", "arms"],
  lower: ["legs", "core"],
};

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
    : [];
}

function getFocusDefinition(focusKey) {
  return (
    TRAINING_PLAN_LIBRARY.find((plan) => plan.key === focusKey) ??
    TRAINING_PLAN_LIBRARY[0] ??
    null
  );
}

function resolveProfileLevel(data = {}) {
  const numericLevel = Number(data.level);

  if (Number.isFinite(numericLevel) && numericLevel > 0) {
    return numericLevel;
  }

  const trainingLevel = String(data.trainingLevel ?? "").trim();

  if (trainingLevel && trainingLevel in TRAINING_LEVEL_TO_SCORE) {
    return TRAINING_LEVEL_TO_SCORE[trainingLevel];
  }

  return TRAINING_LEVEL_TO_SCORE["Не определен"];
}

function normalizeGoalMarkers(values = []) {
  return values.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
}

function inferGoalFromFocusDefinition(focusDefinition) {
  const objective = String(focusDefinition?.mlProfile?.objective ?? "")
    .trim()
    .toLowerCase();
  const markers = normalizeGoalMarkers([
    objective,
    focusDefinition?.key,
    ...normalizeStringArray(focusDefinition?.mlProfile?.focusTags),
  ]);

  if (markers.some((marker) => GOAL_MARKERS.weight_loss.includes(marker))) {
    return "weight_loss";
  }

  if (markers.some((marker) => GOAL_MARKERS.mass.includes(marker))) {
    return "mass";
  }

  return "strength";
}

function resolveGoal(data = {}, focusDefinition = null) {
  const goal = String(data.goal ?? "").trim();

  if (goal) {
    return goal;
  }

  return inferGoalFromFocusDefinition(focusDefinition);
}

function collectFocusBodyParts(focusDefinition) {
  const collectedBodyParts = new Set();
  const sessions = Array.isArray(focusDefinition?.sessions)
    ? focusDefinition.sessions
    : [];

  sessions.forEach((session) => {
    normalizeStringArray(session.sessionBodyParts).forEach((bodyPart) => {
      collectedBodyParts.add(bodyPart);
    });

    const exercisePool = Array.isArray(session.exercisePool) ? session.exercisePool : [];
    exercisePool.forEach((exercise) => {
      if (typeof exercise?.bodyPart === "string" && exercise.bodyPart.trim()) {
        collectedBodyParts.add(exercise.bodyPart.trim());
      }
    });
  });

  normalizeStringArray(focusDefinition?.mlProfile?.focusTags).forEach((tag) => {
    const mappedBodyParts = FOCUS_TAG_TO_BODY_PARTS[tag.toLowerCase()];

    if (!mappedBodyParts) {
      return;
    }

    mappedBodyParts.forEach((bodyPart) => {
      collectedBodyParts.add(bodyPart);
    });
  });

  return Array.from(collectedBodyParts);
}

function resolveTargetBodyParts(data = {}, focusDefinition = null) {
  const explicitTargets = normalizeStringArray(data.targetBodyParts);

  if (explicitTargets.length > 0) {
    return explicitTargets;
  }

  const inferredTargets = collectFocusBodyParts(focusDefinition);
  return inferredTargets.length > 0 ? inferredTargets : ["full_body"];
}

function resolveGender(data = {}) {
  const normalizedGender = String(data.gender ?? "")
    .trim()
    .toLowerCase();

  if (["male", "female"].includes(normalizedGender)) {
    return normalizedGender;
  }

  return "not_specified";
}

function resolveObjective(data = {}, focusDefinition = null) {
  const objective = String(data.objective ?? "").trim();

  if (objective) {
    return objective;
  }

  return String(focusDefinition?.mlProfile?.objective ?? "").trim() || null;
}

function resolveFocusTags(data = {}, focusDefinition = null) {
  const explicitFocusTags = normalizeStringArray(data.focusTags);

  if (explicitFocusTags.length > 0) {
    return explicitFocusTags;
  }

  return normalizeStringArray(focusDefinition?.mlProfile?.focusTags);
}

function resolveAdaptationPriority(data = {}, focusDefinition = null) {
  const adaptationPriority = String(data.adaptationPriority ?? "").trim();

  if (adaptationPriority) {
    return adaptationPriority;
  }

  return String(focusDefinition?.mlProfile?.adaptationPriority ?? "").trim() || null;
}

function resolveWorkoutsPerWeek(data = {}, focusDefinition = null) {
  const workoutsPerWeek = Number(data.workoutsPerWeek);

  if (Number.isFinite(workoutsPerWeek) && workoutsPerWeek > 0) {
    return workoutsPerWeek;
  }

  const recommendedWorkoutsPerWeek = Array.isArray(
    focusDefinition?.mlProfile?.recommendedWorkoutsPerWeek,
  )
    ? focusDefinition.mlProfile.recommendedWorkoutsPerWeek
        .map((value) => Number(value))
        .find((value) => Number.isFinite(value) && value > 0)
    : null;

  if (recommendedWorkoutsPerWeek) {
    return recommendedWorkoutsPerWeek;
  }

  const sessionCount = Array.isArray(focusDefinition?.sessions)
    ? focusDefinition.sessions.length
    : 0;

  if (sessionCount > 0) {
    return sessionCount;
  }

  return 3;
}

function resolveTime(data = {}, focusDefinition = null) {
  const explicitTime = Number(data.time);

  if (Number.isFinite(explicitTime) && explicitTime > 0) {
    return explicitTime;
  }

  const sessions = Array.isArray(focusDefinition?.sessions)
    ? focusDefinition.sessions
    : [];
  const averageSessionDuration =
    sessions.length > 0
      ? sessions.reduce((total, session) => total + (Number(session.duration) || 0), 0) /
        sessions.length
      : 0;

  return averageSessionDuration > 0 ? Math.round(averageSessionDuration) : 30;
}

export function buildUserProfile(data = {}) {
  const focusKey = String(data.focusKey ?? "").trim() || "general-strength";
  const focusDefinition = getFocusDefinition(focusKey);
  const resolvedFocusKey = focusDefinition?.key ?? focusKey;

  return {
    level: resolveProfileLevel(data),
    trainingLevel: String(data.trainingLevel ?? "").trim() || "Не определен",
    gender: resolveGender(data),
    goal: resolveGoal(data, focusDefinition),
    objective: resolveObjective(data, focusDefinition),
    focusKey: resolvedFocusKey,
    focusTags: resolveFocusTags(data, focusDefinition),
    adaptationPriority: resolveAdaptationPriority(data, focusDefinition),
    targetBodyParts: resolveTargetBodyParts(data, focusDefinition),
    equipment: normalizeStringArray(data.equipment),
    injuries: normalizeStringArray(data.injuries),
    time: resolveTime(data, focusDefinition),
    workoutsPerWeek: resolveWorkoutsPerWeek(data, focusDefinition),
  };
}

export function vectorizeProfile(profile) {
  return [
    profile.level / 100,
    profile.gender === "male" ? 1 : 0,
    profile.gender === "female" ? 1 : 0,
    profile.goal === "strength" ? 1 : 0,
    profile.goal === "mass" ? 1 : 0,
    profile.goal === "weight_loss" ? 1 : 0,
    profile.time / 60,
    Math.min(profile.workoutsPerWeek, 7) / 7,
  ];
}
