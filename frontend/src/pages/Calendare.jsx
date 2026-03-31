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

function formatMonthLabel(date) {
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function getWorkoutStatusLabel(status) {
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
  switch (workout?.status) {
    case "completed":
      return "border-[#1F5B46] bg-[#103328] text-[#DDF8EA]";
    case "partial":
      return "border-[#1E4B74] bg-[#102338] text-[#D6E6F8]";
    case "skipped":
      return "border-[#6A4B10] bg-[#35270E] text-[#F9E2A7]";
    default:
      return workout ? "border-[#1E4B74] bg-[#102338] text-[#D6E6F8]" : "";
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
      new Map(
        (currentUser?.scheduledWorkouts ?? []).map((workout) => [
          workout.date,
          workout,
        ]),
      ),
    [currentUser?.scheduledWorkouts],
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
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
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
            className="rounded-2xl border border-[#2A3140] px-3 py-2 text-sm text-white"
          >
            Назад
          </button>

          <h1 className="text-xl font-medium capitalize text-white">
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
            className="rounded-2xl border border-[#2A3140] px-3 py-2 text-sm text-white"
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
          className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-sm text-white disabled:opacity-40"
        >
          {scheduledWorkoutMap.get(today)
            ? "На сегодня уже есть тренировка"
            : todayTimeOptions.length === 0
              ? "Сегодня свободное время закончилось"
              : `Поставить на сегодня • ${todayTimeOptions[0]}`}
        </button>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-[#8E97A8]">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, dayIndex) => {
            const workout = scheduledWorkoutMap.get(day.date);
            const isActive = selectedDate === day.date;
            const isPastDay = day.date < today;

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
                      ? "border-[#2A3140] bg-[#0B0E15]"
                      : "border-transparent bg-[#11141B] opacity-30"
                  } ${getWorkoutDayClassName(workout)} ${
                    isActive ? "border-[#01BB96]" : ""
                  } ${isPastDay ? "text-[#6E7585]" : "text-white"}`}
                >
                  {day.dayNumber}
                </button>

                {isActive && !workout && day.isCurrentMonth ? (
                  <div
                    className={`absolute top-full z-20 mt-2 w-40 max-w-[calc(100vw-3rem)] rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-3 shadow-lg ${getSchedulePopupPositionClassName(dayIndex)}`}
                  >
                    <label className="flex flex-col gap-2">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#8E97A8]">
                        Время
                      </span>
                      <select
                        value={selectedTime}
                        onChange={(event) =>
                          setSelectedTime(event.target.value)
                        }
                        className="rounded-xl border border-[#2A3140] bg-[#12151C] px-3 py-2 text-sm text-white outline-none"
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
                      className="mt-3 w-full rounded-xl bg-[#01BB96] px-3 py-2 text-sm font-medium text-[#000214] disabled:opacity-50"
                    >
                      Добавить
                    </button>

                    {availableTimeOptions.length === 0 ? (
                      <p className="mt-2 text-xs leading-5 text-[#8E97A8]">
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
          <section className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-4">
            <p className="text-sm text-[#8E97A8]">
              Тренировка на {selectedDate}
            </p>
            <h2 className="mt-2 text-xl font-medium text-white">
              {selectedWorkout.title}
            </h2>
            <p className="mt-1 text-sm text-[#8E97A8]">
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
                  className="rounded-xl bg-[#12151C] px-3 py-3"
                >
                  <p className="text-sm font-medium text-white">
                    {exercise.name}
                  </p>
                  <p className="mt-1 text-sm text-[#8E97A8]">
                    {exercise.prescription}
                  </p>
                </div>
              ))}
            </div>

            {selectedWorkout.status === "completed" ? (
              <div className="mt-4 rounded-2xl bg-[#12151C] px-4 py-4 text-sm text-[#8E97A8]">
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
              <div className="mt-4 rounded-2xl bg-[#12151C] px-4 py-4 text-sm text-[#8E97A8]">
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
              <div className="mt-4 rounded-2xl bg-[#12151C] px-4 py-4 text-sm text-[#8E97A8]">
                <p>
                  Эта тренировка считается пропущенной, потому что до 00:00
                  следующего дня она не была выполнена.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {canRescheduleSelectedWorkout ? (
                  <div className="rounded-2xl bg-[#12151C] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Перенести тренировку
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#8E97A8]">
                          Перенос доступен только по времени в день тренировки и
                          не влияет на статистику.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setIsRescheduleOpen((previousValue) => !previousValue)
                        }
                        className="rounded-2xl border border-[#2A3140] px-3 py-2 text-sm text-white"
                      >
                        {isRescheduleOpen ? "Скрыть" : "Перенести"}
                      </button>
                    </div>

                    {isRescheduleOpen ? (
                      <div className="mt-4 flex flex-col gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-[#8E97A8]">
                            Время
                          </span>
                          <select
                            value={rescheduleTime}
                            onChange={(event) =>
                              setRescheduleTime(event.target.value)
                            }
                            className="rounded-xl border border-[#2A3140] bg-[#0B0E15] px-3 py-2 text-sm text-white outline-none"
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
                          className="rounded-2xl bg-[#01BB96] px-4 py-3 text-sm font-medium text-[#000214] disabled:opacity-50"
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
            )}
          </section>
        ) : selectedDate ? (
          <section className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-5 text-sm leading-6 text-[#8E97A8]">
            На {selectedDate} тренировка пока не поставлена. Выбери время во
            всплывающем меню у дня и подтверди добавление.
          </section>
        ) : null}

        {scheduleError ? (
          <div className="rounded-2xl border border-[#603838] bg-[#2B1717] px-4 py-3 text-sm text-[#FFB3B3]">
            {scheduleError}
          </div>
        ) : null}

        <div className="rounded-2xl bg-[#0B0E15] px-4 py-4 text-sm leading-6 text-[#8E97A8]">
          Запланированные дни закрашиваются. Если добавить тренировку на более
          раннюю дату, следующий порядок автоматически перестроится по всей
          программе. Сегодняшнюю тренировку можно перенести только по времени в
          пределах этого дня. Если тренировка не выполнена до 00:00 следующего
          дня, она автоматически считается пропущенной.
        </div>
      </section>

      {isCancelConfirmOpen && selectedWorkout ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#030712]/80 px-5 pb-6 pt-20">
          <div className="w-full max-w-md rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
              Отмена тренировки
            </p>
            <h2 className="mt-2 text-xl font-medium text-white">
              Убрать тренировку из календаря?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#8E97A8]">
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
                className="rounded-3xl border border-[#2A3140] px-5 py-4 text-base font-medium text-white"
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
