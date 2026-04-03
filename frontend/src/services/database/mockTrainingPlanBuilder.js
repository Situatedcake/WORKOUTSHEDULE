import { TRAINING_PLAN_LIBRARY } from "../../../../backend/data/trainingPlanCatalog.js";
import {
  EXERCISES_PER_SESSION,
  getExercisePrescriptionDetails,
} from "../../shared/trainingPlanBuilder";

function getFocusDefinition(focusKey) {
  return (
    TRAINING_PLAN_LIBRARY.find((goal) => goal.key === focusKey) ??
    TRAINING_PLAN_LIBRARY[0]
  );
}

function normalizeWorkoutsPerWeek(workoutsPerWeek) {
  return Math.min(Math.max(Number(workoutsPerWeek) || 3, 2), 5);
}

function createPlanId(focusKey) {
  return `plan_${Date.now()}_${focusKey}`;
}

function createDraftSession(planId, template, index) {
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
    estimatedDurationMin: Math.max(Number(template.duration) || 45, 35),
    availableExercises: template.exercisePool.map((exercise) => exercise.name),
    exerciseOptions: template.exercisePool.map((exercise) => ({
      id: exercise.id ?? exercise.name,
      name: exercise.name,
      type: exercise.type,
      difficulty: exercise.difficulty ?? null,
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

export function buildTrainingPlan({
  workoutsPerWeek,
  focusKey,
  trainingLevel,
  sessionSelections = [],
}) {
  const normalizedTrainingLevel = trainingLevel || "Не определен";
  const focusDefinition = getFocusDefinition(focusKey);
  const normalizedWorkoutsPerWeek = normalizeWorkoutsPerWeek(workoutsPerWeek);
  const planId = createPlanId(focusDefinition.key);
  const draftSessions = Array.from(
    { length: normalizedWorkoutsPerWeek },
    (_, index) =>
      createDraftSession(
        planId,
        focusDefinition.sessions[index % focusDefinition.sessions.length],
        index,
      ),
  );

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
      availableExercises: template.exercisePool.map((exercise) => exercise.name),
      exerciseOptions: template.exercisePool.map((exercise) => ({
        id: exercise.id ?? exercise.name,
        name: exercise.name,
        type: exercise.type,
        difficulty: exercise.difficulty ?? null,
      })),
      completed: false,
      exercises: selectedExerciseNames.map((exerciseName) => {
        const exercise = exerciseMap.get(exerciseName);
        const prescriptionDetails = getExercisePrescriptionDetails(
          normalizedTrainingLevel,
          exercise?.type,
        );

        return {
          id: exercise?.id ?? exercise?.name,
          name: exercise?.name ?? exerciseName,
          type: exercise?.type ?? "compound",
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
