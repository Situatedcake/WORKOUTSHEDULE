import { TRAINING_PLAN_LIBRARY } from "../data/trainingPlanCatalog.js";
export const WORKOUTS_PER_WEEK_OPTIONS = [2, 3, 4, 5];
export const EXERCISES_PER_SESSION = 6;

const LEVEL_CONFIGS = {
  "Не определен": {
    warmup: "5-7 минут суставной разминки и легкого кардио",
    durationOffset: 0,
    prescriptions: {
      compound: "3 подхода по 8-10 повторений",
      isolation: "2-3 подхода по 10-12 повторений",
      cardio: "15-20 минут в умеренном темпе",
      core: "3 круга по 30-40 секунд",
    },
  },
  Начинающий: {
    warmup: "5-7 минут ходьбы, велотренажера или орбитрека",
    durationOffset: -5,
    prescriptions: {
      compound: "2-3 подхода по 10-12 повторений",
      isolation: "2 подхода по 12-15 повторений",
      cardio: "12-18 минут в ровном темпе",
      core: "2-3 круга по 30 секунд",
    },
  },
  Средний: {
    warmup: "7-10 минут кардио и динамической мобилизации",
    durationOffset: 5,
    prescriptions: {
      compound: "3-4 подхода по 8-12 повторений",
      isolation: "3 подхода по 10-15 повторений",
      cardio: "18-25 минут, включая интервалы",
      core: "3-4 круга по 40 секунд",
    },
  },
  Продвинутый: {
    warmup: "10 минут кардио, мобилизации и разминочных подходов",
    durationOffset: 12,
    prescriptions: {
      compound: "4-5 подходов по 6-10 повторений",
      isolation: "3-4 подхода по 10-15 повторений",
      cardio: "22-30 минут с темповыми отрезками",
      core: "4 круга по 45-60 секунд",
    },
  },
};

const [
  UNDEFINED_TRAINING_LEVEL,
  BEGINNER_TRAINING_LEVEL,
  INTERMEDIATE_TRAINING_LEVEL,
  ADVANCED_TRAINING_LEVEL,
] = Object.keys(LEVEL_CONFIGS);

const LEVEL_PRESCRIPTION_DETAILS = {
  [UNDEFINED_TRAINING_LEVEL]: {
    compound: { sets: 3, repRange: "8-10", restSeconds: 120 },
    isolation: { sets: 3, repRange: "10-12", restSeconds: 75 },
    cardio: { sets: 1, repRange: "15-20 мин", restSeconds: 30 },
    core: { sets: 3, repRange: "30-40 сек", restSeconds: 45 },
  },
  [BEGINNER_TRAINING_LEVEL]: {
    compound: { sets: 3, repRange: "10-12", restSeconds: 120 },
    isolation: { sets: 2, repRange: "12-15", restSeconds: 60 },
    cardio: { sets: 1, repRange: "12-18 мин", restSeconds: 30 },
    core: { sets: 3, repRange: "30 сек", restSeconds: 45 },
  },
  [INTERMEDIATE_TRAINING_LEVEL]: {
    compound: { sets: 4, repRange: "8-12", restSeconds: 150 },
    isolation: { sets: 3, repRange: "10-15", restSeconds: 75 },
    cardio: { sets: 1, repRange: "18-25 мин", restSeconds: 30 },
    core: { sets: 4, repRange: "40-50 сек", restSeconds: 45 },
  },
  [ADVANCED_TRAINING_LEVEL]: {
    compound: { sets: 5, repRange: "6-10", restSeconds: 180 },
    isolation: { sets: 4, repRange: "10-15", restSeconds: 90 },
    cardio: { sets: 1, repRange: "22-30 мин", restSeconds: 30 },
    core: { sets: 4, repRange: "45-60 сек", restSeconds: 60 },
  },
};

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

const FOCUS_LIBRARY = TRAINING_PLAN_LIBRARY;

export const TRAINING_GOALS = FOCUS_LIBRARY.map(
  ({ key, label, description }) => ({
    key,
    label,
    description,
  }),
);

export function getLevelConfig(trainingLevel) {
  return LEVEL_CONFIGS[trainingLevel] ?? LEVEL_CONFIGS["Не определен"];
}

export function getExercisePrescriptionDetails(trainingLevel, exerciseType) {
  const levelDetails =
    LEVEL_PRESCRIPTION_DETAILS[trainingLevel] ??
    LEVEL_PRESCRIPTION_DETAILS[UNDEFINED_TRAINING_LEVEL];
  const resolvedType = typeof exerciseType === "string" ? exerciseType : "compound";
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

function getFocusDefinition(focusKey) {
  return FOCUS_LIBRARY.find((goal) => goal.key === focusKey) ?? FOCUS_LIBRARY[0];
}

function normalizeWorkoutsPerWeek(workoutsPerWeek) {
  return Math.min(Math.max(Number(workoutsPerWeek) || 3, 2), 5);
}

function createPlanId(focusKey) {
  return `plan_${Date.now()}_${focusKey}`;
}

function createDraftSession(planId, template, index, trainingLevel) {
  const levelConfig = getLevelConfig(trainingLevel);
  const defaultSelection = template.exercisePool
    .slice(0, EXERCISES_PER_SESSION)
    .map((exercise) => exercise.name);

  return {
    id: `${planId}_session_${index + 1}`,
    key: template.key,
    index: index + 1,
    dayLabel: `Тренировка ${index + 1}`,
    title: template.title,
    emphasis: template.emphasis,
    estimatedDurationMin: Math.max(template.duration + levelConfig.durationOffset, 35),
    warmup: levelConfig.warmup,
    availableExercises: template.exercisePool.map((exercise) => exercise.name),
    exerciseOptions: template.exercisePool.map((exercise) => ({
      name: exercise.name,
      type: exercise.type,
    })),
    selectedExerciseNames: defaultSelection,
  };
}

function buildExerciseMap(template) {
  return template.exercisePool.reduce((map, exercise) => {
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

  const fallbackExercises = template.exercisePool
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
  const normalizedWorkoutsPerWeek = normalizeWorkoutsPerWeek(workoutsPerWeek);
  const focusDefinition = getFocusDefinition(focusKey);
  const planId = createPlanId(focusDefinition.key);

  return Array.from({ length: normalizedWorkoutsPerWeek }, (_, index) => {
    const template = focusDefinition.sessions[index % focusDefinition.sessions.length];
    return createDraftSession(planId, template, index, trainingLevel);
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
  const levelConfig = getLevelConfig(normalizedTrainingLevel);

  const sessions = draftSessions.map((draftSession, index) => {
    const template = focusDefinition.sessions[index % focusDefinition.sessions.length];
    const selectedExerciseNames = normalizeSelectedExercises(
      sessionSelections[index]?.selectedExerciseNames ??
        draftSession.selectedExerciseNames,
      template,
    );
    const exerciseMap = buildExerciseMap(template);

    return {
      id: `${planId}_session_${index + 1}`,
      key: template.key,
      index: index + 1,
      dayLabel: `Тренировка ${index + 1}`,
      title: template.title,
      emphasis: template.emphasis,
      estimatedDurationMin: draftSession.estimatedDurationMin,
      warmup: levelConfig.warmup,
      availableExercises: template.exercisePool.map((exercise) => exercise.name),
      exerciseOptions: template.exercisePool.map((exercise) => ({
        name: exercise.name,
        type: exercise.type,
      })),
      completed: false,
      exercises: selectedExerciseNames.map((exerciseName) => {
        const exercise = exerciseMap.get(exerciseName);
        const prescriptionDetails = getExercisePrescriptionDetails(
          normalizedTrainingLevel,
          exercise.type,
        );

        return {
          name: exercise.name,
          type: exercise.type,
          sets: prescriptionDetails.sets,
          repRange: prescriptionDetails.repRange,
          restSeconds: prescriptionDetails.restSeconds,
          prescription: prescriptionDetails.prescription,
          volumeTrend: "base",
          volumeReason:
            "Базовый объём подобран по текущему уровню подготовки и типу упражнения.",
        };
      }),
    };
  });

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    focusKey: focusDefinition.key,
    focusLabel: focusDefinition.label,
    focusDescription: focusDefinition.description,
    workoutsPerWeek: sessions.length,
    trainingLevel: normalizedTrainingLevel,
    estimatedMinutesPerWeek: sessions.reduce(
      (total, session) => total + session.estimatedDurationMin,
      0,
    ),
    sessions,
  };
}

