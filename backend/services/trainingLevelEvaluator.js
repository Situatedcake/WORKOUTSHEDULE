const TRAINING_LEVELS = [
  "Начинающий",
  "Средний",
  "Продвинутый",
];

function parseMetric(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function getBucketScore(value, steps) {
  for (const step of steps) {
    if (value < step.maxExclusive) {
      return step.score;
    }
  }

  return steps.at(-1)?.score ?? 0;
}

function validateMetricRange(name, value, { min = 0, max, integer = false }) {
  if (!Number.isFinite(value)) {
    return `${name} must be a valid number.`;
  }

  if (integer && !Number.isInteger(value)) {
    return `${name} must be an integer.`;
  }

  if (value < min) {
    return `${name} must be greater than or equal to ${min}.`;
  }

  if (typeof max === "number" && value > max) {
    return `${name} must be less than or equal to ${max}.`;
  }

  return null;
}

export function validateTrainingLevelPayload(payload = {}) {
  const testPayload = {
    experienceYears: parseMetric(payload.experienceYears),
    workoutsPerWeek: parseMetric(payload.workoutsPerWeek),
    pushups: parseMetric(payload.pushups),
    pullups: parseMetric(payload.pullups),
    plankSeconds: parseMetric(payload.plankSeconds),
  };

  const validators = [
    validateMetricRange("experienceYears", testPayload.experienceYears, {
      min: 0,
      max: 60,
    }),
    validateMetricRange("workoutsPerWeek", testPayload.workoutsPerWeek, {
      min: 0,
      max: 14,
      integer: true,
    }),
    validateMetricRange("pushups", testPayload.pushups, {
      min: 0,
      max: 500,
      integer: true,
    }),
    validateMetricRange("pullups", testPayload.pullups, {
      min: 0,
      max: 100,
      integer: true,
    }),
    validateMetricRange("plankSeconds", testPayload.plankSeconds, {
      min: 0,
      max: 7200,
      integer: true,
    }),
  ].filter(Boolean);

  if (validators.length > 0) {
    return {
      ok: false,
      message: validators[0],
      testPayload: null,
    };
  }

  return {
    ok: true,
    message: null,
    testPayload,
  };
}

export function evaluateTrainingLevel(testPayload) {
  const experienceScore = getBucketScore(testPayload.experienceYears, [
    { maxExclusive: 1, score: 5 },
    { maxExclusive: 3, score: 10 },
    { maxExclusive: 5, score: 15 },
    { maxExclusive: Number.POSITIVE_INFINITY, score: 20 },
  ]);
  const workoutsPerWeekScore = getBucketScore(testPayload.workoutsPerWeek, [
    { maxExclusive: 2, score: 3 },
    { maxExclusive: 3, score: 8 },
    { maxExclusive: 4, score: 12 },
    { maxExclusive: 5, score: 16 },
    { maxExclusive: Number.POSITIVE_INFINITY, score: 20 },
  ]);
  const pushupsScore = getBucketScore(testPayload.pushups, [
    { maxExclusive: 5, score: 2 },
    { maxExclusive: 15, score: 6 },
    { maxExclusive: 30, score: 11 },
    { maxExclusive: 45, score: 16 },
    { maxExclusive: Number.POSITIVE_INFINITY, score: 20 },
  ]);
  const pullupsScore = getBucketScore(testPayload.pullups, [
    { maxExclusive: 1, score: 1 },
    { maxExclusive: 4, score: 6 },
    { maxExclusive: 8, score: 11 },
    { maxExclusive: 12, score: 16 },
    { maxExclusive: Number.POSITIVE_INFINITY, score: 20 },
  ]);
  const plankScore = getBucketScore(testPayload.plankSeconds, [
    { maxExclusive: 30, score: 2 },
    { maxExclusive: 60, score: 6 },
    { maxExclusive: 120, score: 11 },
    { maxExclusive: 180, score: 16 },
    { maxExclusive: Number.POSITIVE_INFINITY, score: 20 },
  ]);

  const score =
    experienceScore +
    workoutsPerWeekScore +
    pushupsScore +
    pullupsScore +
    plankScore;

  let trainingLevel = TRAINING_LEVELS[0];

  if (score >= 70) {
    trainingLevel = TRAINING_LEVELS[2];
  } else if (score >= 40) {
    trainingLevel = TRAINING_LEVELS[1];
  }

  return {
    score,
    trainingLevel,
  };
}
