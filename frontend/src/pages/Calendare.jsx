import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useAuth } from "../hooks/useAuth";
import {
  DEFAULT_WORKOUT_TIME,
  formatDateKey,
  getMonthDays,
  getNearestScheduledWorkout,
} from "../shared/workoutSchedule";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const workoutTimeOptions = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
];

const WORKOUT_STATUS_PRIORITY = {
  planned: 1,
  canceled: 2,
  skipped: 3,
  partial: 4,
  completed: 5,
};

function normalizeWorkoutStatus(status, fallback = "planned") {
  const normalizedStatus =
    typeof status === "string" && status.trim() ? status.trim() : fallback;

  return WORKOUT_STATUS_PRIORITY[normalizedStatus] ? normalizedStatus : fallback;
}

function getWorkoutPriority(workout) {
  return WORKOUT_STATUS_PRIORITY[normalizeWorkoutStatus(workout?.status)] ?? 0;
}

function getWorkoutSortTimestamp(workout) {
  const timestamp = Date.parse(
    workout?.completedAt ?? workout?.updatedAt ?? workout?.createdAt ?? "",
  );

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildCalendarWorkoutMap(scheduledWorkouts, workoutHistory) {
  const calendarMap = new Map();
  const plannedWorkouts = Array.isArray(scheduledWorkouts) ? scheduledWorkouts : [];
  const historyWorkouts = Array.isArray(workoutHistory) ? workoutHistory : [];

  plannedWorkouts.forEach((workout) => {
    if (!workout?.date) {
      return;
    }

    calendarMap.set(workout.date, {
      ...workout,
      status: normalizeWorkoutStatus(workout.status, "planned"),
    });
  });

  historyWorkouts.forEach((workout) => {
    if (!workout?.date) {
      return;
    }

    const normalizedHistoryWorkout = {
      ...workout,
      status: normalizeWorkoutStatus(workout.status, "completed"),
    };
    const currentDayWorkout = calendarMap.get(workout.date);

    if (!currentDayWorkout) {
      calendarMap.set(workout.date, normalizedHistoryWorkout);
      return;
    }

    const currentPriority = getWorkoutPriority(currentDayWorkout);
    const nextPriority = getWorkoutPriority(normalizedHistoryWorkout);

    if (nextPriority > currentPriority) {
      calendarMap.set(workout.date, normalizedHistoryWorkout);
      return;
    }

    if (
      nextPriority === currentPriority &&
      getWorkoutSortTimestamp(normalizedHistoryWorkout) >
        getWorkoutSortTimestamp(currentDayWorkout)
    ) {
      calendarMap.set(workout.date, normalizedHistoryWorkout);
    }
  });

  return calendarMap;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function getWorkoutStatusLabel(status) {
  if (status === "canceled") {
    return "Отменена";
  }

  if (status === "planned") {
    return "Запланирована";
  }

  switch (status) {
    case "completed":
      return "Выполнена";
    case "partial":
      return "Частично";
    case "skipped":
      return "Пропущена";
    default:
      return "";
  }
}

function getWorkoutStatusBadgeClassName(status) {
  if (status === "canceled") {
    return "bg-[#301725] text-[#F8BDD5]";
  }

  switch (status) {
    case "completed":
      return "bg-[#103328] text-[#B7EED1]";
    case "partial":
      return "bg-[#1E2B40] text-[#B7D9FF]";
    case "skipped":
      return "bg-[#35270E] text-[#F9E2A7]";
    default:
      return "";
  }
}

function getWorkoutDayClassName(workout) {
  if (workout?.status === "canceled") {
    return "border-2 border-[#FF4FA0] bg-[#4A1731] text-[#FFD3E6] shadow-[0_0_0_1px_rgba(255,79,160,0.35),0_10px_24px_rgba(58,18,38,0.45)]";
  }

  switch (workout?.status) {
    case "completed":
      return "border-2 border-[#39E29A] bg-[#0F3F2F] text-[#E6FFF2] shadow-[0_0_0_1px_rgba(57,226,154,0.35),0_10px_24px_rgba(8,42,30,0.45)]";
    case "partial":
      return "border-2 border-[#61AAFF] bg-[#122D47] text-[#E3F1FF] shadow-[0_0_0_1px_rgba(97,170,255,0.35),0_10px_24px_rgba(12,32,52,0.45)]";
    case "skipped":
      return "border-2 border-[#FFCB57] bg-[#4A350F] text-[#FFE8AE] shadow-[0_0_0_1px_rgba(255,203,87,0.35),0_10px_24px_rgba(56,38,10,0.45)]";
    default:
      return workout
        ? "border-2 border-[#4EA0FF] bg-[#123B74] text-[#EAF3FF] shadow-[0_0_0_1px_rgba(78,160,255,0.35),0_10px_24px_rgba(9,28,56,0.5)]"
        : "";
  }
}

function getSchedulePopupPositionClassName(dayIndex) {
  const weekColumnIndex = dayIndex % 7;

  if (weekColumnIndex <= 1) {
    return "left-0";
  }

  if (weekColumnIndex >= 5) {
    return "right-0";
  }

  return "left-1/2 -translate-x-1/2";
}

function getAvailableTimeOptionsForDate(selectedDate, today) {
  if (selectedDate !== today) {
    return workoutTimeOptions;
  }

  const currentHour = new Date().getHours();

  return workoutTimeOptions.filter((timeOption) => {
    const optionHour = Number.parseInt(timeOption.split(":")[0] ?? "", 10);
    return optionHour >= currentHour;
  });
}

export default function Calendare() {
  const {
    currentUser,
    scheduleCurrentUserWorkout,
    rescheduleCurrentUserWorkout,
    cancelCurrentUserWorkout,
  } = useAuth();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(DEFAULT_WORKOUT_TIME);
  const [rescheduleTime, setRescheduleTime] = useState(DEFAULT_WORKOUT_TIME);
  const [scheduleError, setScheduleError] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [hasFocusedNearestMonth, setHasFocusedNearestMonth] = useState(false);

  const monthDays = useMemo(
    () => getMonthDays(currentMonthDate),
    [currentMonthDate],
  );
  const scheduledWorkoutMap = useMemo(
    () =>
      buildCalendarWorkoutMap(
        currentUser?.scheduledWorkouts,
        currentUser?.workoutHistory,
      ),
    [currentUser?.scheduledWorkouts, currentUser?.workoutHistory],
  );
  const today = formatDateKey(new Date());
  const selectedWorkout = selectedDate
    ? scheduledWorkoutMap.get(selectedDate)
    : null;
  const selectedDayIsPast = Boolean(selectedDate) && selectedDate < today;
  const nearestWorkout = useMemo(
    () => getNearestScheduledWorkout(currentUser?.scheduledWorkouts ?? []),
    [currentUser?.scheduledWorkouts],
  );
  const availableTimeOptions = useMemo(
    () => getAvailableTimeOptionsForDate(selectedDate, today),
    [selectedDate, today],
  );
  const todayTimeOptions = useMemo(
    () => getAvailableTimeOptionsForDate(today, today),
    [today],
  );
  const rescheduleTimeOptions = useMemo(
    () =>
      getAvailableTimeOptionsForDate(selectedWorkout?.date ?? today, today),
    [selectedWorkout?.date, today],
  );

  const selectedTimeIsAvailable = availableTimeOptions.includes(selectedTime);
  const rescheduleTimeIsAvailable =
    rescheduleTimeOptions.includes(rescheduleTime);
  const canRescheduleSelectedWorkout = Boolean(
    selectedWorkout &&
      (selectedWorkout.status ?? "planned") === "planned" &&
      selectedWorkout.date === today,
  );

  useEffect(() => {
    if (!selectedTimeIsAvailable && availableTimeOptions.length > 0) {
      setSelectedTime(availableTimeOptions[0]);
    }
  }, [availableTimeOptions, selectedTime, selectedTimeIsAvailable]);

  useEffect(() => {
    if (!rescheduleTimeIsAvailable && rescheduleTimeOptions.length > 0) {
      setRescheduleTime(rescheduleTimeOptions[0]);
    }
  }, [rescheduleTime, rescheduleTimeIsAvailable, rescheduleTimeOptions]);

  useEffect(() => {
    if (isCancelConfirmOpen && !selectedWorkout) {
      setIsCancelConfirmOpen(false);
    }
  }, [isCancelConfirmOpen, selectedWorkout]);

  useEffect(() => {
    if (!selectedWorkout || !canRescheduleSelectedWorkout) {
      setIsRescheduleOpen(false);
      return;
    }

    setRescheduleTime(selectedWorkout.time ?? DEFAULT_WORKOUT_TIME);
  }, [
    canRescheduleSelectedWorkout,
    selectedWorkout,
    selectedWorkout?.id,
    selectedWorkout?.time,
  ]);

  useEffect(() => {
    if (hasFocusedNearestMonth || !nearestWorkout?.date) {
      return;
    }

    const [year, month] = nearestWorkout.date.split("-").map(Number);

    if (!year || !month) {
      return;
    }

    setCurrentMonthDate(new Date(year, month - 1, 1));
    setHasFocusedNearestMonth(true);
  }, [hasFocusedNearestMonth, nearestWorkout?.date]);

  async function handleAddWorkout() {
    if (!currentUser || !selectedDate) {
      setScheduleError(
        "Выберите день и войдите в аккаунт, чтобы сохранить тренировку.",
      );
      return;
    }

    setIsScheduling(true);
    setScheduleError("");

    try {
      await scheduleCurrentUserWorkout({
        date: selectedDate,
        time: selectedTime,
      });
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : "Не удалось поставить тренировку в календарь.",
      );
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleQuickScheduleToday() {
    if (scheduledWorkoutMap.get(today)) {
      setSelectedDate(today);
      setScheduleError("");
      return;
    }

    if (todayTimeOptions.length === 0) {
      setScheduleError("На сегодня свободное время уже закончилось.");
      return;
    }

    setSelectedDate(today);
    setSelectedTime(todayTimeOptions[0]);
    setIsScheduling(true);
    setScheduleError("");

    try {
      await scheduleCurrentUserWorkout({
        date: today,
        time: todayTimeOptions[0],
      });
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : "Не удалось быстро поставить тренировку на сегодня.",
      );
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleCancelWorkout() {
    if (!selectedWorkout) {
      return;
    }

    setIsScheduling(true);
    setScheduleError("");

    try {
      await cancelCurrentUserWorkout(selectedWorkout.id);
      setSelectedDate("");
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : "Не удалось отменить тренировку.",
      );
    } finally {
      setIsScheduling(false);
    }
  }

  async function handleRescheduleWorkout() {
    if (!selectedWorkout) {
      return;
    }

    setIsScheduling(true);
    setScheduleError("");

    try {
      await rescheduleCurrentUserWorkout(selectedWorkout.id, {
        time: rescheduleTime,
      });
      setIsRescheduleOpen(false);
    } catch (error) {
      setScheduleError(
        error instanceof Error
          ? error.message
          : "Не удалось перенести тренировку.",
      );
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
        {selectedDate && !selectedWorkout ? (
          <button
            type="button"
            aria-label="Закрыть добавление тренировки"
            onClick={() => setSelectedDate("")}
            className="fixed inset-0 z-10 cursor-default"
          />
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setCurrentMonthDate(
                (prevDate) =>
                  new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1),
              )
            }
            className="rounded-2xl border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            Назад
          </button>

          <h1 className="text-xl font-medium capitalize text-[var(--text-primary)]">
            {formatMonthLabel(currentMonthDate)}
          </h1>

          <button
            type="button"
            onClick={() =>
              setCurrentMonthDate(
                (prevDate) =>
                  new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1),
              )
            }
            className="rounded-2xl border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            Вперёд
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleQuickScheduleToday()}
          disabled={
            isScheduling ||
            !currentUser ||
            Boolean(scheduledWorkoutMap.get(today)) ||
            todayTimeOptions.length === 0
          }
          className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] disabled:opacity-40"
        >
          {scheduledWorkoutMap.get(today)
            ? "На сегодня уже есть тренировка"
            : todayTimeOptions.length === 0
              ? "Сегодня свободное время закончилось"
              : `Поставить на сегодня • ${todayTimeOptions[0]}`}
        </button>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-[var(--text-muted)]">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, dayIndex) => {
            const workout = scheduledWorkoutMap.get(day.date);
            const isActive = selectedDate === day.date;
            const isPastDay = day.date < today;
            const hasWorkout = Boolean(workout);

            return (
              <div key={day.date} className="relative">
                <button
                  type="button"
                  disabled={!day.isCurrentMonth}
                  onClick={() => {
                    setSelectedDate((prevDate) =>
                      prevDate === day.date ? "" : day.date,
                    );
                    setScheduleError("");
                  }}
                  className={`flex h-12 w-full items-center justify-center rounded-2xl border text-sm transition ${
                    day.isCurrentMonth
                      ? "border-[var(--border-primary)] bg-[var(--surface-secondary)]"
                      : "border-transparent bg-[#11141B] opacity-30"
                  } ${getWorkoutDayClassName(workout)} ${
                    isActive
                      ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/50"
                      : hasWorkout
                        ? "scale-[1.03] font-semibold"
                        : ""
                  } ${
                    hasWorkout
                      ? "font-bold"
                      : isPastDay
                        ? "text-[#6E7585]"
                        : "text-[var(--text-primary)]"
                  }`}
                >
                  {day.dayNumber}
                </button>
                {isActive && !workout && day.isCurrentMonth ? (
                  <div
                    className={`absolute top-full z-20 mt-2 w-40 max-w-[calc(100vw-3rem)] rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3 shadow-lg ${getSchedulePopupPositionClassName(dayIndex)}`}
                  >
                    <label className="flex flex-col gap-2">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Время
                      </span>
                      <select
                        value={selectedTime}
                        onChange={(event) =>
                          setSelectedTime(event.target.value)
                        }
                        className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                      >
                        {availableTimeOptions.map((timeOption) => (
                          <option key={timeOption} value={timeOption}>
                            {timeOption}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleAddWorkout()}
                      disabled={
                        isScheduling ||
                        selectedDayIsPast ||
                        availableTimeOptions.length === 0
                      }
                      className="mt-3 w-full rounded-xl bg-[var(--accent-primary)] px-3 py-2 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-50"
                    >
                      Добавить
                    </button>

                    {availableTimeOptions.length === 0 ? (
                      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                        На сегодня доступное время уже закончилось.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {selectedWorkout ? (
          <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
            <p className="text-sm text-[var(--text-muted)]">
              Тренировка на {selectedDate}
            </p>
            <h2 className="mt-2 text-xl font-medium text-[var(--text-primary)]">
              {selectedWorkout.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {selectedWorkout.time} • {selectedWorkout.emphasis}
            </p>

            {selectedWorkout.status !== "planned" ? (
              <div
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs ${getWorkoutStatusBadgeClassName(selectedWorkout.status)}`}
              >
                {getWorkoutStatusLabel(selectedWorkout.status)}
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              {selectedWorkout.exercises?.map((exercise) => (
                <div
                  key={`${selectedWorkout.id}_${exercise.name}`}
                  className="rounded-xl bg-[var(--surface-primary)] px-3 py-3"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {exercise.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {exercise.prescription}
                  </p>
                </div>
              ))}
            </div>

            {selectedWorkout.status === "completed" ? (
              <div className="mt-4 rounded-2xl bg-[var(--surface-primary)] px-4 py-4 text-sm text-[var(--text-muted)]">
                <p>Тренировка завершена и уже учтена в статистике.</p>
                {selectedWorkout.result?.metrics?.burnedCalories != null ? (
                  <p className="mt-2">
                    Калории: {selectedWorkout.result.metrics.burnedCalories}
                  </p>
                ) : null}
                {selectedWorkout.result?.metrics?.weightKg != null ? (
                  <p className="mt-1">
                    Вес: {selectedWorkout.result.metrics.weightKg} кг
                  </p>
                ) : null}
              </div>
            ) : selectedWorkout.status === "partial" ? (
              <div className="mt-4 rounded-2xl bg-[var(--surface-primary)] px-4 py-4 text-sm text-[var(--text-muted)]">
                <p>Тренировка завершена частично и уже учтена в статистике.</p>
                {selectedWorkout.result?.metrics?.burnedCalories != null ? (
                  <p className="mt-2">
                    Калории: {selectedWorkout.result.metrics.burnedCalories}
                  </p>
                ) : null}
                {selectedWorkout.result?.metrics?.weightKg != null ? (
                  <p className="mt-1">
                    Вес: {selectedWorkout.result.metrics.weightKg} кг
                  </p>
                ) : null}
              </div>
            ) : selectedWorkout.status === "skipped" ? (
              <div className="mt-4 rounded-2xl bg-[var(--surface-primary)] px-4 py-4 text-sm text-[var(--text-muted)]">
                <p>
                  Эта тренировка считается пропущенной, потому что до 00:00
                  следующего дня она не была выполнена.
                </p>
              </div>
            ) : selectedWorkout.status === "planned" ? (
              <div className="mt-4 flex flex-col gap-3">
                {canRescheduleSelectedWorkout ? (
                  <div className="rounded-2xl bg-[var(--surface-primary)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          Перенести тренировку
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                          Перенос доступен только по времени в день тренировки и
                          не влияет на статистику.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setIsRescheduleOpen((previousValue) => !previousValue)
                        }
                        className="rounded-2xl border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      >
                        {isRescheduleOpen ? "Скрыть" : "Перенести"}
                      </button>
                    </div>

                    {isRescheduleOpen ? (
                      <div className="mt-4 flex flex-col gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            Время
                          </span>
                          <select
                            value={rescheduleTime}
                            onChange={(event) =>
                              setRescheduleTime(event.target.value)
                            }
                            className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                          >
                            {rescheduleTimeOptions.map((timeOption) => (
                              <option
                                key={`reschedule_${timeOption}`}
                                value={timeOption}
                              >
                                {timeOption}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() => void handleRescheduleWorkout()}
                          disabled={isScheduling || rescheduleTimeOptions.length === 0}
                          className="rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-medium text-[var(--accent-contrast)] disabled:opacity-50"
                        >
                          Сохранить перенос
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(true)}
                  disabled={isScheduling}
                  className="text-left text-sm font-medium text-[#FF7D7D] disabled:opacity-50"
                >
                  Отменить тренировку
                </button>
              </div>
            ) : null}
            
          </section>
        ) : selectedDate ? (
          <section className="rounded-2xl border border-dashed border-[var(--border-primary)] px-4 py-5 text-sm leading-6 text-[var(--text-muted)]">
            На {selectedDate} тренировка пока не поставлена. Выбери время во
            всплывающем меню у дня и подтверди добавление.
          </section>
        ) : null}

        {scheduleError ? (
          <div className="rounded-2xl border border-[#603838] bg-[#2B1717] px-4 py-3 text-sm text-[#FFB3B3]">
            {scheduleError}
          </div>
        ) : null}

        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          Запланированные дни закрашиваются. Если добавить тренировку на более
          раннюю дату, следующий порядок автоматически перестроится по всей
          программе. Сегодняшнюю тренировку можно перенести только по времени в
          пределах этого дня. Если тренировка не выполнена до 00:00 следующего
          дня, она автоматически считается пропущенной.
        </div>
      </section>

      {isCancelConfirmOpen && selectedWorkout ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#030712]/80 px-5 pb-6 pt-20">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Отмена тренировки
            </p>
            <h2 className="mt-2 text-xl font-medium text-[var(--text-primary)]">
              Убрать тренировку из календаря?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Тренировка на {selectedWorkout.date} в {selectedWorkout.time} будет
              удалена из расписания, а порядок следующих дней пересоберётся.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() =>
                  void handleCancelWorkout().then(() =>
                    setIsCancelConfirmOpen(false),
                  )
                }
                disabled={isScheduling}
                className="rounded-3xl border border-[#5C2A2A] px-5 py-4 text-base font-medium text-[#FFB3B3] disabled:opacity-50"
              >
                Подтвердить отмену
              </button>
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="rounded-3xl border border-[var(--border-primary)] px-5 py-4 text-base font-medium text-[var(--text-primary)]"
              >
                Оставить тренировку
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
