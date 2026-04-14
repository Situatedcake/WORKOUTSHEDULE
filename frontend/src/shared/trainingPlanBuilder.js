export const WORKOUTS_PER_WEEK_OPTIONS = [2, 3, 4, 5];
export const EXERCISES_PER_SESSION = 6;

const LEVEL_CONFIGS = {
  "Не определен": {
    prescriptions: {
      compound: "3 подхода по 8-10 повторений",
      isolation: "2-3 подхода по 10-12 повторений",
      cardio: "15-20 минут в умеренном темпе",
      core: "3 круга по 30-40 секунд",
    },
  },
  Начинающий: {
    prescriptions: {
      compound: "2-3 подхода по 10-12 повторений",
      isolation: "2 подхода по 12-15 повторений",
      cardio: "12-18 минут в ровном темпе",
      core: "2-3 круга по 30 секунд",
    },
  },
  Средний: {
    prescriptions: {
      compound: "3-4 подхода по 8-12 повторений",
      isolation: "3 подхода по 10-15 повторений",
      cardio: "18-25 минут, включая интервалы",
      core: "3-4 круга по 40 секунд",
    },
  },
  Продвинутый: {
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

export function getExerciseVolumeReason(exercise) {
  if (typeof exercise?.volumeReason === "string" && exercise.volumeReason.trim()) {
    return exercise.volumeReason;
  }

  if (exercise?.volumeTrend === "programmed") {
    return "Объём подстроен под задачу конкретного дня и общую логику текущего плана.";
  }

  if (exercise?.volumeTrend === "progressing") {
    return "Объём усилен, потому что по упражнению уже виден рабочий прогресс.";
  }

  if (exercise?.volumeTrend === "stalled") {
    return "Объём смягчён и смещён в сторону более контролируемой работы из-за плато.";
  }

  if (exercise?.volumeTrend === "manual") {
    return "Объём скорректирован вручную, поэтому система показывает уже обновлённую версию плана.";
  }

  return "Базовый объём подобран по текущему уровню подготовки и типу упражнения.";
}

function formatSetDelta(delta) {
  const absoluteDelta = Math.abs(delta);
  const suffix =
    absoluteDelta === 1
      ? "подход"
      : absoluteDelta >= 2 && absoluteDelta <= 4
        ? "подхода"
        : "подходов";

  return `${delta > 0 ? "+" : "-"}${absoluteDelta} ${suffix}`;
}

function formatRestDelta(delta) {
  return `отдых ${delta > 0 ? "+" : "-"}${formatRestDuration(Math.abs(delta))}`;
}

export function getExerciseVolumeReasonTitle(exercise) {
  if (exercise?.volumeTrend === "programmed") {
    return "Подстроили объём под задачу дня";
  }

  if (exercise?.volumeTrend === "progressing") {
    return "Добавили объём из-за прогресса";
  }

  if (exercise?.volumeTrend === "stalled") {
    return "Смягчили объём из-за плато";
  }

  if (exercise?.volumeTrend === "manual") {
    return "Объём скорректирован вручную";
  }

  return "Базовый объём под твой уровень";
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

export function getExerciseVolumeChangeChips(exercise, trainingLevel) {
  const baseDetails = getExercisePrescriptionDetails(
    trainingLevel,
    exercise?.type ?? "compound",
  );
  const currentSets = Number(exercise?.sets) || baseDetails.sets;
  const currentRepRange =
    typeof exercise?.repRange === "string" && exercise.repRange.trim()
      ? exercise.repRange
      : baseDetails.repRange;
  const currentRestSeconds = Number(exercise?.restSeconds) || baseDetails.restSeconds;
  const chips = [];
  const setDelta = currentSets - baseDetails.sets;
  const restDelta = currentRestSeconds - baseDetails.restSeconds;

  if (setDelta !== 0) {
    chips.push(formatSetDelta(setDelta));
  }

  if (currentRepRange !== baseDetails.repRange) {
    chips.push(`повторы ${currentRepRange}`);
  }

  if (restDelta !== 0) {
    chips.push(formatRestDelta(restDelta));
  }

  if (chips.length > 0) {
    return chips;
  }

  if (exercise?.volumeTrend === "manual") {
    return ["ручная правка"];
  }

  if (exercise?.volumeTrend === "programmed") {
    return ["логика плана"];
  }

  return ["базовый объём"];
}

export function getExerciseVolumeReasonMeta(exercise) {
  if (exercise?.volumeTrend === "programmed") {
    return {
      label: "План",
      iconType: "programmed",
      surfaceClassName: "border border-[#35506D] bg-[#111B28]",
      badgeClassName: "bg-[#17304A] text-[#BBD8FF]",
      textClassName: "text-[#CFE1FF]",
    };
  }

  if (exercise?.volumeTrend === "progressing") {
    return {
      label: "Прогресс",
      iconType: "progressing",
      surfaceClassName: "border border-[#1D5E4F] bg-[#0D2E28]",
      badgeClassName: "bg-[#0D3A33] text-[#B5F7DF]",
      textClassName: "text-[#C8F5E5]",
    };
  }

  if (exercise?.volumeTrend === "stalled") {
    return {
      label: "Плато",
      iconType: "stalled",
      surfaceClassName: "border border-[#5E4B1D] bg-[#2E2510]",
      badgeClassName: "bg-[#4B3A11] text-[#FFD98A]",
      textClassName: "text-[#F3D9A1]",
    };
  }

  if (exercise?.volumeTrend === "manual") {
    return {
      label: "Вручную",
      iconType: "manual",
      surfaceClassName: "border border-[#264D79] bg-[#122033]",
      badgeClassName: "bg-[#183B63] text-[#A7D3FF]",
      textClassName: "text-[#B8D9FF]",
    };
  }

  return {
    label: "База",
    iconType: "base",
    surfaceClassName: "border border-[var(--border-primary)] bg-[var(--surface-secondary)]",
    badgeClassName: "bg-[#1D222D] text-[#D7DEEA]",
    textClassName: "text-[#B8C1D1]",
  };
}

export function getTrainingPlanAdaptationHighlights(trainingPlan, limit = 4) {
  if (!trainingPlan?.sessions?.length) {
    return [];
  }

  return trainingPlan.sessions
    .flatMap((session) =>
      (session.exercises ?? []).map((exercise) => ({
        sessionId: session.id,
        sessionTitle: session.title,
        exercise,
        meta: getExerciseVolumeReasonMeta(exercise),
        reasonTitle: getExerciseVolumeReasonTitle(exercise),
        chips: getExerciseVolumeChangeChips(
          exercise,
          trainingPlan.trainingLevel,
        ),
      })),
    )
    .filter(
      (item) => item.exercise?.volumeTrend && item.exercise.volumeTrend !== "base",
    )
    .slice(0, limit);
}

export function getTrainingPlanAdaptationBreakdown(trainingPlan) {
  const result = {
    programmed: 0,
    progressing: 0,
    stalled: 0,
    manual: 0,
    base: 0,
  };

  (trainingPlan?.sessions ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((exercise) => {
      const trend = exercise?.volumeTrend ?? "base";
      result[trend] = (result[trend] ?? 0) + 1;
    });
  });

  return [
    {
      key: "programmed",
      count: result.programmed,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "programmed" }),
    },
    {
      key: "progressing",
      count: result.progressing,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "progressing" }),
    },
    {
      key: "stalled",
      count: result.stalled,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "stalled" }),
    },
    {
      key: "manual",
      count: result.manual,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "manual" }),
    },
    {
      key: "base",
      count: result.base,
      meta: getExerciseVolumeReasonMeta({ volumeTrend: "base" }),
    },
  ];
}
