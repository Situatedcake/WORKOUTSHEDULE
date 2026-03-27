import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useAuth } from "../hooks/useAuth";
import {
  DEFAULT_WORKOUT_TIME,
  formatDateKey,
  getMonthDays,
} from "../shared/workoutSchedule";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const workoutTimeOptions = [
  "07:00",
  "08:00",
  "09:00",
  "12:00",
  "15:00",
  "18:00",
  "19:00",
  "20:00",
  "22:00",
];

function formatMonthLabel(date) {
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

export default function Calendare() {
  const { currentUser, scheduleCurrentUserWorkout, cancelCurrentUserWorkout } =
    useAuth();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(DEFAULT_WORKOUT_TIME);
  const [scheduleError, setScheduleError] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

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
  const selectedDayIsPast = selectedDate && selectedDate < today;
  const availableTimeOptions = useMemo(() => {
    if (selectedDate !== today) {
      return workoutTimeOptions;
    }

    const currentHour = new Date().getHours();

    return workoutTimeOptions.filter((timeOption) => {
      const optionHour = Number.parseInt(timeOption.split(":")[0] ?? "", 10);
      return optionHour >= currentHour;
    });
  }, [selectedDate, today]);

  const selectedTimeIsAvailable = availableTimeOptions.includes(selectedTime);

  useEffect(() => {
    if (!selectedTimeIsAvailable && availableTimeOptions.length > 0) {
      setSelectedTime(availableTimeOptions[0]);
    }
  }, [availableTimeOptions, selectedTime, selectedTimeIsAvailable]);

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
            Вперед
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-[#8E97A8]">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
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
                  } ${
                    workout?.status === "completed"
                      ? "border-[#1E4B74] bg-[#102338] text-[#D6E6F8]"
                      : workout
                        ? "bg-[#0D3A33] text-[#DFFCF0]"
                        : ""
                  } ${
                    isActive ? "border-[#01BB96]" : ""
                  } ${isPastDay ? "text-[#6E7585]" : "text-white"}`}
                >
                  {day.dayNumber}
                </button>

                {isActive && !workout && day.isCurrentMonth ? (
                  <div className="absolute left-1/2 top-full z-20 mt-2 w-40 -translate-x-1/2 rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-3 shadow-lg">
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
                        Boolean(selectedDayIsPast) ||
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
            {selectedWorkout.status === "completed" ? (
              <div className="mt-3 inline-flex rounded-full bg-[#102338] px-3 py-1 text-xs text-[#B7D3EE]">
                Выполнена
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
            ) : (
              <button
                type="button"
                onClick={() => void handleCancelWorkout()}
                disabled={isScheduling}
                className="mt-4 text-sm font-medium text-[#FF7D7D] disabled:opacity-50"
              >
                Отменить тренировку
              </button>
            )}
          </section>
        ) : selectedDate ? (
          <section className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-5 text-sm leading-6 text-[#8E97A8]">
            На {selectedDate} тренировка пока не поставлена. Выбери время в
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
          программе.
        </div>
      </section>
    </PageShell>
  );
}
