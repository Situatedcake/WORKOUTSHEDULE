const TRAINING_LEVEL_TO_SCORE = {
  "Не определен": 30,
  Начинающий: 30,
  Средний: 60,
  Продвинутый: 90,
};

const FOCUS_TO_GOAL = {
  "upper-torso": "strength",
  endurance: "weight_loss",
  arms: "mass",
  "fat-loss": "weight_loss",
  "general-strength": "strength",
  "full-body": "strength",
  "women-cardio": "weight_loss",
};

const FOCUS_TO_TARGET_BODY_PARTS = {
  "upper-torso": ["chest", "upper_chest", "back", "arms", "shoulders"],
  endurance: ["cardio", "full_body", "core", "legs"],
  arms: ["arms", "chest", "back"],
  "fat-loss": ["full_body", "cardio", "legs", "core"],
  "general-strength": ["full_body", "legs", "back", "chest", "core"],
  "full-body": ["full_body", "legs", "back", "chest", "core", "shoulders"],
  "women-cardio": ["cardio", "legs", "full_body", "core", "shoulders"],
};

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
    : [];
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

function resolveGoal(data = {}) {
  const goal = String(data.goal ?? "").trim();

  if (goal) {
    return goal;
  }

  const focusKey = String(data.focusKey ?? "").trim();
  return FOCUS_TO_GOAL[focusKey] ?? "strength";
}

function resolveTargetBodyParts(data = {}) {
  const explicitTargets = normalizeStringArray(data.targetBodyParts);

  if (explicitTargets.length > 0) {
    return explicitTargets;
  }

  const focusKey = String(data.focusKey ?? "").trim();
  return FOCUS_TO_TARGET_BODY_PARTS[focusKey] ?? ["full_body"];
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

export function buildUserProfile(data = {}) {
  return {
    level: resolveProfileLevel(data),
    trainingLevel: String(data.trainingLevel ?? "").trim() || "Не определен",
    gender: resolveGender(data),
    goal: resolveGoal(data),
    focusKey: String(data.focusKey ?? "").trim() || "general-strength",
    targetBodyParts: resolveTargetBodyParts(data),
    equipment: normalizeStringArray(data.equipment),
    injuries: normalizeStringArray(data.injuries),
    time: Number(data.time) || 30,
    workoutsPerWeek: Number(data.workoutsPerWeek) || 3,
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
