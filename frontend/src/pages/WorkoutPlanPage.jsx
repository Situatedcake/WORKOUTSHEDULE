import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import PageShell from "../components/PageShell";
import VolumeTrendIcon from "../components/VolumeTrendIcon";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import {
  getExerciseVolumeChangeChips,
  getExerciseVolumeReason,
  getExerciseVolumeReasonMeta,
  getExerciseVolumeReasonTitle,
} from "../shared/trainingPlanBuilder";
import {
  addWorkoutExercise,
  buildWorkoutDraft,
  formatDuration,
  getAddableWorkoutExerciseOptions,
  removeWorkoutExercise,
  replaceWorkoutExercise,
  updateWorkoutExerciseSets,
} from "../shared/activeWorkout";
import { getNearestScheduledWorkout } from "../shared/workoutSchedule";
import {
  clearActiveWorkoutResultDraft,
  getActiveWorkoutDraft,
  clearActiveWorkoutRuntime,
  getActiveWorkoutRuntime,
  saveActiveWorkoutDraft,
} from "../utils/activeWorkoutSession";
import { createTrainingFeedbackEvent } from "../shared/trainingMlFeedback";

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

function getLastTrackedWeight(exerciseWeights = []) {
  for (let index = exerciseWeights.length - 1; index >= 0; index -= 1) {
    const value = Number(exerciseWeights[index]);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function formatTrackedWeight(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value) ? `${value} кг` : `${value.toFixed(1)} кг`;
}

function buildLatestExerciseWeightMap(workoutHistory = []) {
  const exerciseWeightMap = new Map();

  for (let workoutIndex = workoutHistory.length - 1; workoutIndex >= 0; workoutIndex -= 1) {
    const workout = workoutHistory[workoutIndex];

    for (const exercise of workout?.exerciseSetWeights ?? []) {
      const latestWeight = getLastTrackedWeight(exercise?.weightsKg ?? []);

      if (!Number.isFinite(latestWeight)) {
        continue;
      }

      [exercise?.sourceExerciseId, exercise?.exerciseId, exercise?.exerciseName]
        .filter(Boolean)
        .forEach((key) => {
          if (!exerciseWeightMap.has(key)) {
            exerciseWeightMap.set(key, latestWeight);
          }
        });
    }
  }

  return exerciseWeightMap;
}

export default function WorkoutPlanPage() {
  const navigate = useNavigate();
  const { currentUser, saveCurrentUserTrainingFeedback } = useAuth();
  const storedWorkoutDraft = useMemo(() => getActiveWorkoutDraft(), []);
  const activeWorkoutRuntime = useMemo(() => getActiveWorkoutRuntime(), []);
  const nearestWorkout = useMemo(
    () => getNearestScheduledWorkout(currentUser?.scheduledWorkouts ?? []),
    [currentUser?.scheduledWorkouts],
  );
  const initialDraft = useMemo(
    () => {
      const nextDraft = buildWorkoutDraft({
        scheduledWorkout: nearestWorkout,
        trainingPlan: currentUser?.trainingPlan ?? null,
      });

      if (
        storedWorkoutDraft?.scheduledWorkoutId &&
        activeWorkoutRuntime?.scheduledWorkoutId &&
        storedWorkoutDraft.scheduledWorkoutId ===
          activeWorkoutRuntime.scheduledWorkoutId &&
        nextDraft?.scheduledWorkoutId === storedWorkoutDraft.scheduledWorkoutId
      ) {
        return storedWorkoutDraft;
      }

      return nextDraft;
    },
    [
      activeWorkoutRuntime?.scheduledWorkoutId,
      currentUser?.trainingPlan,
      nearestWorkout,
      storedWorkoutDraft,
    ],
  );
  const [workoutDraft, setWorkoutDraft] = useState(initialDraft);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState(null);
  const [pendingFeedbackEvents, setPendingFeedbackEvents] = useState([]);
  const latestExerciseWeightMap = useMemo(
    () => buildLatestExerciseWeightMap(currentUser?.workoutHistory ?? []),
    [currentUser?.workoutHistory],
  );
  const addableExerciseOptions = useMemo(
    () => getAddableWorkoutExerciseOptions(workoutDraft),
    [workoutDraft],
  );
  const hasRuntimeForCurrentWorkout = Boolean(
    workoutDraft?.scheduledWorkoutId &&
      activeWorkoutRuntime?.scheduledWorkoutId === workoutDraft.scheduledWorkoutId,
  );

  useEffect(() => {
    const resetTimeoutId = window.setTimeout(() => {
      setWorkoutDraft(initialDraft);
      setPendingFeedbackEvents([]);
    }, 0);

    return () => {
      window.clearTimeout(resetTimeoutId);
    };
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
              &quot;Приступить&quot; откроет план занятия.
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
    const previousExercise = workoutDraft?.exercises?.[exerciseIndex];
    const nextExercise =
      workoutDraft?.exerciseOptions?.find(
        (option) => option.name === nextExerciseName,
      ) ?? null;

    if (
      previousExercise &&
      nextExercise &&
      previousExercise.name !== nextExercise.name
    ) {
      setPendingFeedbackEvents((previousEvents) => [
        ...previousEvents,
        createTrainingFeedbackEvent({
          type: "exercise_replaced",
          source: "workout_plan",
          trainingPlanId: currentUser?.trainingPlan?.id ?? null,
          scheduledWorkoutId: workoutDraft?.scheduledWorkoutId ?? null,
          sessionId: workoutDraft?.sessionId ?? null,
          exercise: previousExercise,
          nextExercise,
        }),
      ]);
    }

    setWorkoutDraft((previousDraft) =>
      replaceWorkoutExercise({
        workoutDraft: previousDraft,
        exerciseIndex,
        nextExerciseName,
      }),
    );
  }

  function handleDecreaseSets(exerciseIndex) {
    const previousExercise = workoutDraft?.exercises?.[exerciseIndex];
    const currentSets = previousExercise?.sets ?? 1;
    const nextSets = Math.max(currentSets - 1, 1);

    if (previousExercise && nextSets < currentSets) {
      setPendingFeedbackEvents((previousEvents) => [
        ...previousEvents,
        createTrainingFeedbackEvent({
          type: "sets_decreased",
          source: "workout_plan",
          trainingPlanId: currentUser?.trainingPlan?.id ?? null,
          scheduledWorkoutId: workoutDraft?.scheduledWorkoutId ?? null,
          sessionId: workoutDraft?.sessionId ?? null,
          exercise: previousExercise,
          previousSets: currentSets,
          nextSets,
        }),
      ]);
    }

    setWorkoutDraft((previousDraft) => {
      return updateWorkoutExerciseSets(
        previousDraft,
        exerciseIndex,
        nextSets,
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
    const previousExercise = workoutDraft?.exercises?.[exerciseIndex];

    if (previousExercise && (workoutDraft?.exercises?.length ?? 0) > 1) {
      setPendingFeedbackEvents((previousEvents) => [
        ...previousEvents,
        createTrainingFeedbackEvent({
          type: "exercise_removed",
          source: "workout_plan",
          trainingPlanId: currentUser?.trainingPlan?.id ?? null,
          scheduledWorkoutId: workoutDraft?.scheduledWorkoutId ?? null,
          sessionId: workoutDraft?.sessionId ?? null,
          exercise: previousExercise,
        }),
      ]);
    }

    setWorkoutDraft((previousDraft) =>
      removeWorkoutExercise(previousDraft, exerciseIndex),
    );
  }

  function handleAddExercise() {
    const nextRecommendedExerciseName = addableExerciseOptions[0]?.name ?? "";

    if (!nextRecommendedExerciseName) {
      return;
    }

    setWorkoutDraft((previousDraft) =>
      addWorkoutExercise(previousDraft, nextRecommendedExerciseName),
    );
  }

  async function handleStartWorkout() {
    if (pendingFeedbackEvents.length > 0) {
      try {
        await saveCurrentUserTrainingFeedback(pendingFeedbackEvents);
        setPendingFeedbackEvents([]);
      } catch {
        // don't block workout start if analytics/feedback saving fails
      }
    }

    if (hasRuntimeForCurrentWorkout) {
      saveActiveWorkoutDraft(workoutDraft);
      navigate(ROUTES.WORKOUT_ACTIVE);
      return;
    }

    clearActiveWorkoutResultDraft();
    clearActiveWorkoutRuntime();
    saveActiveWorkoutDraft(workoutDraft);
    navigate(ROUTES.WORKOUT_ACTIVE);
  }

  function toggleExerciseDetails(exerciseIndex) {
    setExpandedExerciseIndex((previousIndex) =>
      previousIndex === exerciseIndex ? null : exerciseIndex,
    );
  }

  return (
    <PageShell
      className="pt-5 pb-[calc(15rem+env(safe-area-inset-bottom))]"
      showNavMenu={false}
    >
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link
            to={ROUTES.HOME}
            className="rounded-2xl border border-[#2A3140] p-3 text-white"
            aria-label="Назад"
          >
            <BackIcon />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
              План тренировки
            </p>
            <h1 className="mt-1 break-words text-xl font-medium leading-7 text-white">
              {workoutDraft.title}
            </h1>
          </div>

          <div className="w-12" aria-hidden="true" />
        </header>

        {hasRuntimeForCurrentWorkout ? (
          <div className="rounded-[20px] border border-[#27455C] bg-[#102338] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8E97A8]">
              Активная сессия
            </p>
            <p className="mt-2 text-sm leading-6 text-[#D6E6F8]">
              Эта тренировка уже была начата. Можно сразу вернуться к ней с
              сохранённым прогрессом.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {workoutDraft.exercises.map((exercise, exerciseIndex) => {
            const volumeReasonMeta = getExerciseVolumeReasonMeta(exercise);
            const volumeReasonTitle = getExerciseVolumeReasonTitle(exercise);
            const volumeReasonChips = getExerciseVolumeChangeChips(
              exercise,
              workoutDraft.trainingLevel,
            );
            const latestExerciseWeight =
              latestExerciseWeightMap.get(exercise.sourceExerciseId) ??
              latestExerciseWeightMap.get(exercise.id) ??
              latestExerciseWeightMap.get(exercise.name) ??
              null;

            return (
              <section
                key={`${exercise.id}_${exerciseIndex}`}
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
                    {Number.isFinite(latestExerciseWeight) ? (
                      <p className="mt-2 text-xs text-[#8E97A8]">
                        В прошлый раз: {formatTrackedWeight(latestExerciseWeight)}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-[#8E97A8]">
                    <ChevronIcon
                      isExpanded={expandedExerciseIndex === exerciseIndex}
                    />
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
                        aria-label="Удалить упражнение"
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
                        {workoutDraft.exerciseOptions.map((option, optionIndex) => (
                          <option
                            key={`${option.id ?? option.name}_${optionIndex}`}
                            value={option.name}
                          >
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
                      {Number.isFinite(latestExerciseWeight) ? (
                        <p className="mt-2 text-xs leading-5 text-[#8E97A8]">
                          Последний рабочий вес: {formatTrackedWeight(latestExerciseWeight)}
                        </p>
                      ) : null}
                    </div>

                    <div
                      className={`mt-3 rounded-2xl px-4 py-3 ${volumeReasonMeta.surfaceClassName}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[#8E97A8]">
                            Причина адаптации
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <VolumeTrendIcon
                              iconType={volumeReasonMeta.iconType}
                              className={`h-4 w-4 ${volumeReasonMeta.textClassName}`}
                            />
                            <p
                              className={`text-sm font-medium ${volumeReasonMeta.textClassName}`}
                            >
                              {volumeReasonTitle}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${volumeReasonMeta.badgeClassName}`}
                        >
                          {volumeReasonMeta.label}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {volumeReasonChips.map((chip) => (
                          <span
                            key={`${exercise.id}_${chip}`}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${volumeReasonMeta.badgeClassName}`}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#8E97A8]">
                        {getExerciseVolumeReason(exercise)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        {addableExerciseOptions.length > 0 ? (
          <>
            <section className="rounded-[20px] border border-dashed border-[#2A3140] bg-[#12151C] p-3">
              <button
                type="button"
                onClick={handleAddExercise}
                aria-label="Добавить лучшее рекомендованное упражнение"
                className="flex min-h-[88px] w-full items-center justify-center rounded-[16px] border border-[#2A3140] bg-[#0B0E15] text-white transition active:scale-[0.98]"
              >
                <span className="text-5xl font-light leading-none">+</span>
              </button>
              <p className="mt-2 text-center text-[11px] leading-4 text-[#8E97A8]">
                Добавим лучшее упражнение из рекомендаций ML
              </p>
            </section>
          <section className="hidden rounded-[16px] border border-[#2A3140] bg-[#12151C] px-3 py-2.5">
            <p className="hidden">
              Добавить из рекомендаций
            </p>
            <p className="hidden">
              Можно расширить тренировку упражнениями из рекомендованного
              системой списка.
            </p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#8E97A8]">
              Добавить из рекомендаций
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#8E97A8]">
              Можно расширить тренировку упражнениями из рекомендованного
              системой списка.
            </p>

            <div className="mt-2.5 flex flex-col gap-2">
              <select
                value={addableExerciseOptions[0]?.name ?? ""}
                onChange={() => {}}
                className="rounded-[16px] border border-[#2A3140] bg-[#0B0E15] px-3 py-2 text-sm leading-5 text-white outline-none"
              >
                {addableExerciseOptions.map((exerciseOption, optionIndex) => (
                  <option
                    key={`${exerciseOption.id ?? exerciseOption.name}_${optionIndex}`}
                    value={exerciseOption.name}
                  >
                    {exerciseOption.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddExercise}
                data-label="Добавить упражнение"
                aria-label="Добавить упражнение"
                className="relative overflow-hidden rounded-[16px] border border-[#2A3140] bg-[#0B0E15] px-3 py-2 text-sm font-medium leading-5 text-transparent after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-white after:content-[attr(data-label)]"
              >
                Добавить упражнение
              </button>
            </div>
          </section>
          </>
        ) : null}
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-5">
        <button
          type="button"
          onClick={handleStartWorkout}
          data-label={
            hasRuntimeForCurrentWorkout
              ? `Продолжить тренировку • ${formatDuration(workoutDraft.totalEstimatedSeconds)}`
              : `Начать тренировку • ${formatDuration(workoutDraft.totalEstimatedSeconds)}`
          }
          aria-label={
            hasRuntimeForCurrentWorkout
              ? `Продолжить тренировку • ${formatDuration(workoutDraft.totalEstimatedSeconds)}`
              : `Начать тренировку • ${formatDuration(workoutDraft.totalEstimatedSeconds)}`
          }
          className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-transparent after:absolute after:inset-0 after:flex after:items-center after:justify-center after:px-5 after:text-center after:text-[#000214] after:content-[attr(data-label)]"
        >
          {hasRuntimeForCurrentWorkout
            ? `Продолжить тренировку • ${formatDuration(workoutDraft.totalEstimatedSeconds)}`
            : `Начать тренировку • ${formatDuration(workoutDraft.totalEstimatedSeconds)}`}
        </button>
      </div>
    </PageShell>
  );
}
