export const DEFAULT_WORKOUT_TIME = "19:00";

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTimeHour(time) {
  return Number.parseInt(String(time).split(":")[0] ?? "", 10);
}

function compareScheduledWorkouts(left, right) {
  const leftKey = `${left.date}T${left.time ?? DEFAULT_WORKOUT_TIME}:00`;
  const rightKey = `${right.date}T${right.time ?? DEFAULT_WORKOUT_TIME}:00`;

  return leftKey.localeCompare(rightKey);
}

function createScheduledWorkoutId() {
  return `scheduled_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getMonthDays(currentMonthDate) {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDayOfMonth.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - startOffset + 1;
    const cellDate = new Date(year, month, day);
    return {
      date: formatDateKey(cellDate),
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
    };
  });
}

export function formatWorkoutRelativeLabel(workout, now = new Date()) {
  if (!workout) {
    return "Ближайшая тренировка не запланирована";
  }

  const workoutDate = new Date(`${workout.date}T${workout.time ?? DEFAULT_WORKOUT_TIME}:00`);
  const currentDateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const workoutDateStart = new Date(
    workoutDate.getFullYear(),
    workoutDate.getMonth(),
    workoutDate.getDate(),
  );
  const daysDiff = Math.round(
    (workoutDateStart.getTime() - currentDateStart.getTime()) / 86400000,
  );

  if (daysDiff === 0) {
    return "Тренировка сегодня";
  }

  if (daysDiff === 1) {
    return "Тренировка завтра";
  }

  if (daysDiff > 1 && daysDiff < 5) {
    return `Тренировка через ${daysDiff} дня`;
  }

  return `Тренировка ${workoutDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })}`;
}

export function getNearestScheduledWorkout(
  scheduledWorkouts = [],
  now = new Date(),
) {
  return [...scheduledWorkouts]
    .filter((workout) => (workout.status ?? "planned") === "planned")
    .sort(compareScheduledWorkouts)
    .find((workout) => {
      const workoutDate = new Date(
        `${workout.date}T${workout.time ?? DEFAULT_WORKOUT_TIME}:00`,
      );
      return workoutDate >= now;
    }) ?? null;
}

export function rebalanceScheduledWorkouts({
  scheduledWorkouts = [],
  trainingPlan,
}) {
  if (!trainingPlan?.sessions?.length) {
    return [];
  }

  const sortedWorkouts = [...scheduledWorkouts]
    .map((workout) => cloneValue(workout))
    .sort(compareScheduledWorkouts);

  let sessionCounter = 0;

  return sortedWorkouts.map((workout) => {
    const session =
      trainingPlan.sessions[sessionCounter % trainingPlan.sessions.length];
    sessionCounter += 1;

    if (workout.status && workout.status !== "planned") {
      return {
        ...workout,
        sessionId: workout.sessionId ?? session.id,
        sessionIndex: workout.sessionIndex ?? session.index,
        time: workout.time ?? DEFAULT_WORKOUT_TIME,
      };
    }

    return {
      ...workout,
      sessionId: session.id,
      sessionIndex: session.index,
      title: session.title,
      emphasis: session.emphasis,
      estimatedDurationMin: session.estimatedDurationMin,
      exercises: session.exercises,
      status: workout.status ?? "planned",
      time: workout.time ?? DEFAULT_WORKOUT_TIME,
    };
  });
}

export function scheduleWorkout({
  scheduledWorkouts = [],
  trainingPlan,
  date,
  time = DEFAULT_WORKOUT_TIME,
}) {
  if (!trainingPlan?.sessions?.length) {
    throw new Error("Сначала составьте программу тренировок.");
  }

  if (!date) {
    throw new Error("Дата тренировки обязательна.");
  }

  const today = formatDateKey(new Date());

  if (date < today) {
    throw new Error("Нельзя планировать тренировку на прошедшую дату.");
  }

  if (date === today) {
    const currentHour = new Date().getHours();
    const selectedHour = getTimeHour(time);

    if (Number.isNaN(selectedHour) || selectedHour < currentHour) {
      throw new Error("На сегодня можно выбрать только не прошедшее время.");
    }
  }

  if (scheduledWorkouts.some((workout) => workout.date === date)) {
    throw new Error("На этот день уже запланирована тренировка.");
  }

  const nextWorkouts = [
    ...scheduledWorkouts,
    {
      id: createScheduledWorkoutId(),
      date,
      time,
      status: "planned",
      createdAt: new Date().toISOString(),
    },
  ];

  return rebalanceScheduledWorkouts({
    scheduledWorkouts: nextWorkouts,
    trainingPlan,
  });
}

export function cancelWorkout({
  scheduledWorkouts = [],
  trainingPlan,
  scheduledWorkoutId,
}) {
  if (!scheduledWorkoutId) {
    throw new Error("Не удалось определить тренировку для отмены.");
  }

  const nextWorkouts = scheduledWorkouts.filter(
    (workout) => workout.id !== scheduledWorkoutId,
  );

  return rebalanceScheduledWorkouts({
    scheduledWorkouts: nextWorkouts,
    trainingPlan,
  });
}
