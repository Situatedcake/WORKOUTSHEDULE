import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import {
  buildWorkoutDraft,
  formatDuration,
  removeWorkoutExercise,
  replaceWorkoutExercise,
  updateWorkoutExerciseSets,
} from "../shared/activeWorkout";
import { getNearestScheduledWorkout } from "../shared/workoutSchedule";
import {
  clearActiveWorkoutResultDraft,
  saveActiveWorkoutDraft,
} from "../utils/activeWorkoutSession";

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11.75 4.5L6.25 10L11.75 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3.75 5.25H14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.5 2.75H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.25 5.25V13C5.25 13.9665 6.0335 14.75 7 14.75H11C11.9665 14.75 12.75 13.9665 12.75 13V5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 9H13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 4.5V13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.5 9H13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ isExpanded }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`transition ${isExpanded ? "rotate-180" : ""}`}
    >
      <path
        d="M4.5 6.75L9 11.25L13.5 6.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WorkoutPlanPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const nearestWorkout = useMemo(
    () => getNearestScheduledWorkout(currentUser?.scheduledWorkouts ?? []),
    [currentUser?.scheduledWorkouts],
  );
  const initialDraft = useMemo(
    () =>
      buildWorkoutDraft({
        scheduledWorkout: nearestWorkout,
        trainingPlan: currentUser?.trainingPlan ?? null,
      }),
    [currentUser?.trainingPlan, nearestWorkout],
  );
  const [workoutDraft, setWorkoutDraft] = useState(initialDraft);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);

  useEffect(() => {
    setWorkoutDraft(initialDraft);
  }, [initialDraft]);

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!currentUser.trainingPlan || !nearestWorkout || !workoutDraft) {
    return (
      <PageShell className="pt-5" showNavMenu={false}>
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
              Тренировка
            </p>
            <h1 className="text-3xl font-medium text-white">
              Активная тренировка не найдена
            </h1>
            <p className="text-sm leading-6 text-[#8E97A8]">
              Сначала поставь тренировку в календарь, и после этого кнопка
              "Приступить" откроет план занятия.
            </p>
          </div>

          <Link
            to={ROUTES.CALENDAR}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
          >
            Открыть календарь
          </Link>
        </section>
      </PageShell>
    );
  }

  function handleExerciseReplace(exerciseIndex, nextExerciseName) {
    setWorkoutDraft((previousDraft) =>
      replaceWorkoutExercise({
        workoutDraft: previousDraft,
        exerciseIndex,
        nextExerciseName,
      }),
    );
  }

  function handleDecreaseSets(exerciseIndex) {
    setWorkoutDraft((previousDraft) => {
      const currentSets = previousDraft.exercises[exerciseIndex]?.sets ?? 1;
      return updateWorkoutExerciseSets(
        previousDraft,
        exerciseIndex,
        Math.max(currentSets - 1, 1),
      );
    });
  }

  function handleIncreaseSets(exerciseIndex) {
    setWorkoutDraft((previousDraft) => {
      const currentSets = previousDraft.exercises[exerciseIndex]?.sets ?? 1;
      return updateWorkoutExerciseSets(
        previousDraft,
        exerciseIndex,
        currentSets + 1,
      );
    });
  }

  function handleRemoveExercise(exerciseIndex) {
    setWorkoutDraft((previousDraft) =>
      removeWorkoutExercise(previousDraft, exerciseIndex),
    );
  }

  function handleStartWorkout() {
    clearActiveWorkoutResultDraft();
    saveActiveWorkoutDraft(workoutDraft);
    navigate(ROUTES.WORKOUT_ACTIVE);
  }

  function toggleExerciseDetails(exerciseIndex) {
    setExpandedExerciseIndex((previousIndex) =>
      previousIndex === exerciseIndex ? null : exerciseIndex,
    );
  }

  return (
    <PageShell className="pt-5 pb-36" showNavMenu={false}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link
            to={ROUTES.HOME}
            className="rounded-2xl border border-[#2A3140] p-3 text-white"
            aria-label="Назад"
          >
            <BackIcon />
          </Link>

          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
              План тренировки
            </p>
            <h1 className="mt-1 text-xl font-medium text-white">
              {workoutDraft.title}
            </h1>
          </div>

          <div className="w-12" aria-hidden="true" />
        </header>

        <div className="flex flex-col gap-3">
          {workoutDraft.exercises.map((exercise, exerciseIndex) => (
            <section
              key={exercise.id}
              className="overflow-hidden rounded-[20px] border border-[#2A3140] bg-[#12151C]"
            >
              <button
                type="button"
                onClick={() => toggleExerciseDetails(exerciseIndex)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={expandedExerciseIndex === exerciseIndex}
              >
                <div className="min-w-0 flex-1">
                  <h2
                    className="overflow-hidden text-sm font-medium leading-5 text-white"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {exercise.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-[#0D3A33] px-3 py-1 text-[10px] text-[#B5F7DF]">
                      {exercise.difficultyLabel}
                    </span>
                    <span className="inline-flex rounded-full bg-[#0B0E15] px-3 py-1 text-[10px] text-white">
                      {exercise.sets} подход.
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[#8E97A8]">
                  <ChevronIcon isExpanded={expandedExerciseIndex === exerciseIndex} />
                </span>
              </button>

              {expandedExerciseIndex === exerciseIndex ? (
                <div className="border-t border-[#2A3140] px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecreaseSets(exerciseIndex)}
                      className="rounded-2xl border border-[#2A3140] p-2 text-[#D9E1EE]"
                      aria-label="Уменьшить количество подходов"
                    >
                      <MinusIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncreaseSets(exerciseIndex)}
                      className="rounded-2xl border border-[#2A3140] p-2 text-[#D9E1EE]"
                      aria-label="Увеличить количество подходов"
                    >
                      <PlusIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      disabled={workoutDraft.exercises.length === 1}
                      className="ml-auto rounded-2xl border border-[#2A3140] p-2 text-[#FF9B9B] disabled:opacity-40"
                      aria-label="Убрать упражнение"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <label className="mt-4 flex flex-col gap-2">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[#8E97A8]">
                      Замена
                    </span>
                    <select
                      value={exercise.name}
                      onChange={(event) =>
                        handleExerciseReplace(exerciseIndex, event.target.value)
                      }
                      className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-sm text-white outline-none"
                    >
                      {workoutDraft.exerciseOptions.map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-4 rounded-2xl bg-[#0B0E15] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8E97A8]">
                      Рекомендация
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white">
                      {exercise.prescription}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>

      </section>

      <div className="fixed inset-x-0 bottom-[calc(2rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-5">
        <button
          type="button"
          onClick={handleStartWorkout}
          className="w-full max-w-md rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-[#000214]"
        >
          Начать тренировку • {formatDuration(workoutDraft.totalEstimatedSeconds)}
        </button>
      </div>
    </PageShell>
  );
}
