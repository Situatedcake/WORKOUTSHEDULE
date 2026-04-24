import {
  TRAINING_PLAN_LIBRARY,
  getPlanSessions,
  normalizeWorkoutsPerWeekValue,
} from "../data/trainingPlanCatalog.js";

export const WORKOUTS_PER_WEEK_OPTIONS = [2, 3, 4, 5];
export const EXERCISES_PER_SESSION = 6;

const LEVEL_CONFIGS = {
  "Не определен": {
    warmup: "5-7 минут суставной разминки и лёгкого кардио",
    durationOffset: 0,
  },
  Начинающий: {
    warmup: "5-7 минут ходьбы, велотренажёра или орбитрека",
    durationOffset: -5,
  },
  Средний: {
    warmup: "7-10 минут кардио и динамической мобилизации",
    durationOffset: 5,
  },
  Продвинутый: {
    warmup: "10 минут кардио, мобилизации и разминочных подходов",
    durationOffset: 12,
  },
};

const LEVEL_PRESCRIPTION_DETAILS = {
  "Не определен": {
    compound: { sets: 3, repRange: "8-10", restSeconds: 120 },
    isolation: { sets: 3, repRange: "10-12", restSeconds: 75 },
    cardio: { sets: 1, repRange: "15-20 мин", restSeconds: 30 },
    core: { sets: 3, repRange: "30-40 сек", restSeconds: 45 },
  },
  Начинающий: {
    compound: { sets: 3, repRange: "10-12", restSeconds: 120 },
    isolation: { sets: 2, repRange: "12-15", restSeconds: 60 },
    cardio: { sets: 1, repRange: "12-18 мин", restSeconds: 30 },
    core: { sets: 3, repRange: "30 сек", restSeconds: 45 },
  },
  Средний: {
    compound: { sets: 4, repRange: "8-12", restSeconds: 150 },
    isolation: { sets: 3, repRange: "10-15", restSeconds: 75 },
    cardio: { sets: 1, repRange: "18-25 мин", restSeconds: 30 },
    core: { sets: 4, repRange: "40-50 сек", restSeconds: 45 },
  },
  Продвинутый: {
    compound: { sets: 5, repRange: "6-10", restSeconds: 180 },
    isolation: { sets: 4, repRange: "10-15", restSeconds: 90 },
    cardio: { sets: 1, repRange: "22-30 мин", restSeconds: 30 },
    core: { sets: 4, repRange: "45-60 сек", restSeconds: 60 },
  },
};

const COMPOUND_MOVEMENT_PATTERNS = new Set([
  "horizontal_push",
  "incline_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "squat",
  "hip_hinge",
  "lunge",
  "hip_extension",
  "full_body",
]);

export const TRAINING_GOALS = TRAINING_PLAN_LIBRARY.map(
  ({ key, label, description, mlProfile }) => ({
    key,
    label,
    description,
    mlProfile: mlProfile ?? {},
  }),
);

function formatRestDuration(restSeconds) {
  const normalizedRestSeconds = Math.max(Number(restSeconds) || 0, 0);

  if (normalizedRestSeconds >= 60) {
    const restMinutes = Math.floor(normalizedRestSeconds / 60);
    const restRemainderSeconds = normalizedRestSeconds % 60;

    if (!restRemainderSeconds) {
      return `${restMinutes} мин`;
    }

    return `${restMinutes} мин ${restRemainderSeconds} сек`;
  }

  return `${normalizedRestSeconds} сек`;
}

export function formatExercisePrescription({
  exerciseType,
  sets,
  repRange,
  restSeconds,
}) {
  if (exerciseType === "cardio") {
    return `${sets} блок • ${repRange} • отдых ${formatRestDuration(restSeconds)}`;
  }

  return `${sets} подход. • ${repRange} • отдых ${formatRestDuration(restSeconds)}`;
}

export function getLevelConfig(trainingLevel) {
  return LEVEL_CONFIGS[trainingLevel] ?? LEVEL_CONFIGS["Не определен"];
}

export function resolveTemplateExerciseType(exercise = {}) {
  if (typeof exercise.type === "string" && exercise.type.trim()) {
    return exercise.type;
  }

  if (exercise.bodyPart === "cardio") {
    return "cardio";
  }

  if (exercise.bodyPart === "core") {
    return "core";
  }

  if (typeof exercise.compound === "boolean") {
    return exercise.compound ? "compound" : "isolation";
  }

  if (COMPOUND_MOVEMENT_PATTERNS.has(exercise.movementPattern)) {
    return "compound";
  }

  if (
    exercise.bodyPart === "chest" ||
    exercise.bodyPart === "upper_chest" ||
    exercise.bodyPart === "back" ||
    exercise.bodyPart === "legs" ||
    exercise.bodyPart === "full_body"
  ) {
    return "compound";
  }

  return "isolation";
}

export function getExercisePrescriptionDetails(trainingLevel, exerciseType) {
  const levelDetails =
    LEVEL_PRESCRIPTION_DETAILS[trainingLevel] ??
    LEVEL_PRESCRIPTION_DETAILS["Не определен"];
  const resolvedType =
    typeof exerciseType === "string" && exerciseType.trim()
      ? exerciseType
      : "compound";
  const baseDetails = levelDetails[resolvedType] ?? levelDetails.compound;

  return {
    ...baseDetails,
    prescription: formatExercisePrescription({
      exerciseType: resolvedType,
      sets: baseDetails.sets,
      repRange: baseDetails.repRange,
      restSeconds: baseDetails.restSeconds,
    }),
  };
}

export function getExercisePrescription(trainingLevel, exerciseType) {
  return getExercisePrescriptionDetails(trainingLevel, exerciseType).prescription;
}

function getDefaultFocusDefinition() {
  return (
    TRAINING_PLAN_LIBRARY[0] ?? {
      key: "general-strength",
      label: "Общая сила",
      description: "Базовый тренировочный шаблон.",
      sessions: [],
      mlProfile: {},
    }
  );
}

function getFocusDefinition(focusKey) {
  return (
    TRAINING_PLAN_LIBRARY.find((goal) => goal.key === focusKey) ??
    getDefaultFocusDefinition()
  );
}

function createPlanId(focusKey) {
  return `plan_${Date.now()}_${focusKey}`;
}

function createExerciseOption(exercise = {}) {
  return {
    name: exercise.name,
    type: resolveTemplateExerciseType(exercise),
    bodyPart: exercise.bodyPart ?? null,
    movementPattern: exercise.movementPattern ?? null,
    equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
    priority: exercise.priority ?? null,
  };
}

function createDraftSession(planId, template, focusDefinition, index, trainingLevel) {
  const levelConfig = getLevelConfig(trainingLevel);
  const normalizedExercisePool = Array.isArray(template.exercisePool)
    ? template.exercisePool
    : [];
  const defaultSelection = normalizedExercisePool
    .slice(0, EXERCISES_PER_SESSION)
    .map((exercise) => exercise.name);

  return {
    id: `${planId}_session_${index + 1}`,
    key: template.key ?? `session-${index + 1}`,
    index: index + 1,
    dayLabel: `Тренировка ${index + 1}`,
    title: template.title ?? `Сессия ${index + 1}`,
    emphasis: template.emphasis ?? focusDefinition.description,
    estimatedDurationMin: Math.max(
      Number(template.duration) + levelConfig.durationOffset || 0,
      35,
    ),
    warmup: levelConfig.warmup,
    objective: template.objective ?? focusDefinition.mlProfile?.objective ?? null,
    intensity: template.intensity ?? null,
    recoveryDemand: template.recoveryDemand ?? null,
    sessionBodyParts: Array.isArray(template.sessionBodyParts)
      ? template.sessionBodyParts
      : Array.from(
          new Set(normalizedExercisePool.map((exercise) => exercise.bodyPart).filter(Boolean)),
        ),
    mlTags: Array.isArray(template.mlTags)
      ? template.mlTags
      : Array.isArray(focusDefinition.mlProfile?.focusTags)
        ? focusDefinition.mlProfile.focusTags
        : [],
    availableExercises: normalizedExercisePool.map((exercise) => exercise.name),
    exerciseOptions: normalizedExercisePool.map(createExerciseOption),
    selectedExerciseNames: defaultSelection,
  };
}

function buildExerciseMap(template) {
  return (template.exercisePool ?? []).reduce((map, exercise) => {
    map.set(exercise.name, exercise);
    return map;
  }, new Map());
}

function normalizeSelectedExercises(selectedExerciseNames, template) {
  const exerciseMap = buildExerciseMap(template);
  const validSelected = Array.isArray(selectedExerciseNames)
    ? selectedExerciseNames.filter(
        (exerciseName, index, array) =>
          typeof exerciseName === "string" &&
          exerciseMap.has(exerciseName) &&
          array.indexOf(exerciseName) === index,
      )
    : [];

  if (validSelected.length >= EXERCISES_PER_SESSION) {
    return validSelected.slice(0, EXERCISES_PER_SESSION);
  }

  const fallbackExercises = (template.exercisePool ?? [])
    .map((exercise) => exercise.name)
    .filter((exerciseName) => !validSelected.includes(exerciseName))
    .slice(0, EXERCISES_PER_SESSION - validSelected.length);

  return [...validSelected, ...fallbackExercises];
}

export function createTrainingPlanDraft({
  workoutsPerWeek,
  focusKey,
  trainingLevel,
}) {
  const normalizedWorkoutsPerWeek = normalizeWorkoutsPerWeekValue(workoutsPerWeek);
  const focusDefinition = getFocusDefinition(focusKey);
  const planId = createPlanId(focusDefinition.key);
  const focusSessions = getPlanSessions(focusDefinition, normalizedWorkoutsPerWeek);

  return Array.from({ length: normalizedWorkoutsPerWeek }, (_, index) => {
    const template = focusSessions[index % Math.max(focusSessions.length, 1)] ?? {};
    return createDraftSession(
      planId,
      template,
      focusDefinition,
      index,
      trainingLevel,
    );
  });
}

export function buildTrainingPlan({
  workoutsPerWeek,
  focusKey,
  trainingLevel,
  sessionSelections = [],
}) {
  const normalizedTrainingLevel = trainingLevel || "Не определен";
  const focusDefinition = getFocusDefinition(focusKey);
  const planId = createPlanId(focusDefinition.key);
  const draftSessions = createTrainingPlanDraft({
    workoutsPerWeek,
    focusKey: focusDefinition.key,
    trainingLevel: normalizedTrainingLevel,
  });
  const focusSessions = getPlanSessions(focusDefinition, draftSessions.length);
  const levelConfig = getLevelConfig(normalizedTrainingLevel);

  const sessions = draftSessions.map((draftSession, index) => {
    const template = focusSessions[index % Math.max(focusSessions.length, 1)] ?? {};
    const selectedExerciseNames = normalizeSelectedExercises(
      sessionSelections[index]?.selectedExerciseNames ??
        draftSession.selectedExerciseNames,
      template,
    );
    const exerciseMap = buildExerciseMap(template);

    return {
      id: `${planId}_session_${index + 1}`,
      key: template.key ?? `session-${index + 1}`,
      index: index + 1,
      dayLabel: `Тренировка ${index + 1}`,
      title: template.title ?? `Сессия ${index + 1}`,
      emphasis: template.emphasis ?? focusDefinition.description,
      estimatedDurationMin: draftSession.estimatedDurationMin,
      warmup: levelConfig.warmup,
      objective: template.objective ?? focusDefinition.mlProfile?.objective ?? null,
      intensity: template.intensity ?? null,
      recoveryDemand: template.recoveryDemand ?? null,
      sessionBodyParts: draftSession.sessionBodyParts,
      mlTags: draftSession.mlTags,
      availableExercises: (template.exercisePool ?? []).map((exercise) => exercise.name),
      exerciseOptions: (template.exercisePool ?? []).map(createExerciseOption),
      completed: false,
      exercises: selectedExerciseNames.map((exerciseName) => {
        const exercise = exerciseMap.get(exerciseName) ?? { name: exerciseName };
        const exerciseType = resolveTemplateExerciseType(exercise);
        const prescriptionDetails = getExercisePrescriptionDetails(
          normalizedTrainingLevel,
          exerciseType,
        );

        return {
          name: exercise.name,
          type: exerciseType,
          sets: prescriptionDetails.sets,
          repRange: prescriptionDetails.repRange,
          restSeconds: prescriptionDetails.restSeconds,
          prescription: prescriptionDetails.prescription,
          volumeTrend: "base",
          volumeReason:
            "Базовый объём подобран по текущему уровню подготовки и типу упражнения.",
          bodyPart: exercise.bodyPart ?? null,
          movementPattern: exercise.movementPattern ?? null,
          equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
          priority: exercise.priority ?? null,
        };
      }),
    };
  });

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    sourcePlanKey: focusDefinition.key,
    focusKey: focusDefinition.key,
    focusLabel: focusDefinition.label,
    focusDescription: focusDefinition.description,
    mlProfile: focusDefinition.mlProfile ?? {},
    workoutsPerWeek: sessions.length,
    trainingLevel: normalizedTrainingLevel,
    estimatedMinutesPerWeek: sessions.reduce(
      (total, session) => total + session.estimatedDurationMin,
      0,
    ),
    sessions,
  };
}
