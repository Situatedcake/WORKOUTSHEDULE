import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import {
  REST_DURATION_SECONDS,
  formatDuration,
} from "../shared/activeWorkout";
import {
  clearActiveWorkoutDraft,
  getActiveWorkoutDraft,
  saveActiveWorkoutResultDraft,
} from "../utils/activeWorkoutSession";

const clampTwoLinesStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

function PreviousIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 6L10 12L18 18V6Z"
        fill="currentColor"
      />
      <path d="M7 6V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FinishSetIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 12.5L10 16.5L18 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 6L14 12L6 18V6Z"
        fill="currentColor"
      />
      <path d="M17 6V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CircularProgress({ progressPercent }) {
  const normalizedPercent = Math.max(Math.min(progressPercent, 100), 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - normalizedPercent / 100);

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="#252B38"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="#01BB96"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-medium text-white">
          {Math.round(normalizedPercent)}%
        </span>
      </div>
    </div>
  );
}

function sumValues(values = []) {
  return values.reduce((total, value) => total + value, 0);
}

export default function TraningPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const workoutDraft = useMemo(() => getActiveWorkoutDraft(), []);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState(
    () => workoutDraft?.exercises?.map(() => 0) ?? [],
  );
  const [exerciseElapsedSeconds, setExerciseElapsedSeconds] = useState(
    () => workoutDraft?.exercises?.map(() => 0) ?? [],
  );
  const [phase, setPhase] = useState("exercise");
  const [restRemainingSeconds, setRestRemainingSeconds] = useState(REST_DURATION_SECONDS);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [restContinuePressCount, setRestContinuePressCount] = useState(0);
  const [hasUnlockedForceContinue, setHasUnlockedForceContinue] = useState(false);

  const currentExercise = workoutDraft?.exercises?.[currentExerciseIndex] ?? null;
  const totalSets = workoutDraft?.totalSets ?? 0;
  const completedSetsCount = sumValues(completedSetsByExercise);
  const progressPercent = totalSets
    ? (completedSetsCount / totalSets) * 100
    : 0;
  const remainingSeconds = Math.max(
    (workoutDraft?.totalEstimatedSeconds ?? 0) - elapsedSeconds,
    0,
  );
  const nextExercise =
    workoutDraft?.exercises?.[currentExerciseIndex + 1] ?? null;
  const currentExerciseCompletedSets =
    completedSetsByExercise[currentExerciseIndex] ?? 0;
  const currentSetNumber = currentExercise
    ? Math.min(currentExerciseCompletedSets + 1, currentExercise.sets)
    : 0;
  const remainingSetsInExercise = currentExercise
    ? Math.max(currentExercise.sets - currentExerciseCompletedSets, 0)
    : 0;
  const canForceContinueRest =
    phase === "rest" && (hasUnlockedForceContinue || restContinuePressCount >= 5);

  const finishWorkout = useCallback(
    (completedSetsOverride = completedSetsByExercise) => {
      if (!workoutDraft) {
        return;
      }

      saveActiveWorkoutResultDraft({
        scheduledWorkoutId: workoutDraft.scheduledWorkoutId,
        title: workoutDraft.title,
        emphasis: workoutDraft.emphasis,
        date: workoutDraft.scheduledDate,
        time: workoutDraft.scheduledTime,
        durationSeconds: elapsedSeconds,
        completedExercisesCount: completedSetsOverride.filter(
          (setsCount, index) =>
            setsCount >= (workoutDraft.exercises[index]?.sets ?? 0),
        ).length,
        completedSetsCount: sumValues(
          completedSetsOverride.map((setsCount, index) =>
            Math.min(setsCount, workoutDraft.exercises[index]?.sets ?? setsCount),
          ),
        ),
      });
      clearActiveWorkoutDraft();
      navigate(ROUTES.WORKOUT_FINISH);
    },
    [completedSetsByExercise, elapsedSeconds, navigate, workoutDraft],
  );

  const applyPendingTransition = useCallback(
    (nextTransition) => {
      if (!workoutDraft || !nextTransition) {
        setPhase("exercise");
        setPendingTransition(null);
        return;
      }

      if (nextTransition.type === "nextExercise") {
        setCurrentExerciseIndex((previousIndex) =>
          Math.min(previousIndex + 1, workoutDraft.exercises.length - 1),
        );
      }

      setRestRemainingSeconds(REST_DURATION_SECONDS);
      setRestContinuePressCount(0);
      setPendingTransition(null);
      setPhase("exercise");
    },
    [workoutDraft],
  );

  useEffect(() => {
    if (!workoutDraft) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((previousValue) => previousValue + 1);

      if (phase === "rest") {
        setRestRemainingSeconds((previousValue) => {
          if (previousValue <= 1) {
            window.setTimeout(() => {
              if (pendingTransition?.type === "finish") {
                finishWorkout();
                return;
              }

              applyPendingTransition(pendingTransition);
            }, 0);

            return 0;
          }

          return previousValue - 1;
        });

        return;
      }

      setExerciseElapsedSeconds((previousValue) =>
        previousValue.map((value, index) =>
          index === currentExerciseIndex ? value + 1 : value,
        ),
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    applyPendingTransition,
    currentExerciseIndex,
    finishWorkout,
    pendingTransition,
    phase,
    workoutDraft,
  ]);

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!workoutDraft || !currentExercise) {
    return <Navigate to={ROUTES.WORKOUT_PLAN} replace />;
  }

  function handleFinishSet() {
    const nextCompletedSetsByExercise = completedSetsByExercise.map((value, index) =>
      index === currentExerciseIndex
        ? Math.min(value + 1, currentExercise.sets)
        : value,
    );
    const isExerciseCompleted =
      nextCompletedSetsByExercise[currentExerciseIndex] >= currentExercise.sets;
    const isLastExercise =
      currentExerciseIndex >= workoutDraft.exercises.length - 1;

    setCompletedSetsByExercise(nextCompletedSetsByExercise);

    if (isExerciseCompleted && isLastExercise) {
      finishWorkout(nextCompletedSetsByExercise);
      return;
    }

    setPhase("rest");
    setRestRemainingSeconds(REST_DURATION_SECONDS);
    setPendingTransition({
      type: isExerciseCompleted ? "nextExercise" : "nextSet",
    });
  }

  function handlePreviousExercise() {
    if (currentExerciseIndex === 0) {
      return;
    }

    const previousIndex = currentExerciseIndex - 1;

    setCompletedSetsByExercise((previousValue) =>
      previousValue.map((value, index) => (index >= previousIndex ? 0 : value)),
    );
    setExerciseElapsedSeconds((previousValue) =>
      previousValue.map((value, index) => (index >= previousIndex ? 0 : value)),
    );
    setCurrentExerciseIndex(previousIndex);
    setPhase("exercise");
    setRestContinuePressCount(0);
    setPendingTransition(null);
    setRestRemainingSeconds(REST_DURATION_SECONDS);
  }

  function handleNextExercise() {
    if (currentExerciseIndex >= workoutDraft.exercises.length - 1) {
      const nextCompletedSetsByExercise = completedSetsByExercise.map((value, index) =>
        index === currentExerciseIndex ? currentExercise.sets : value,
      );
      finishWorkout(nextCompletedSetsByExercise);
      return;
    }

    setCompletedSetsByExercise((previousValue) =>
      previousValue.map((value, index) =>
        index === currentExerciseIndex ? currentExercise.sets : value,
      ),
    );
    setCurrentExerciseIndex((previousIndex) => previousIndex + 1);
    setPhase("exercise");
    setRestContinuePressCount(0);
    setPendingTransition(null);
    setRestRemainingSeconds(REST_DURATION_SECONDS);
  }

  function handlePrimaryAction() {
    if (phase === "rest") {
      setRestContinuePressCount((previousValue) => {
        const nextValue = previousValue + 1;

        if (nextValue >= 5) {
          setHasUnlockedForceContinue(true);
        }

        return nextValue;
      });
      return;
    }

    handleFinishSet();
  }

  function handleForceContinue() {
    if (!canForceContinueRest) {
      return;
    }

    if (pendingTransition?.type === "finish") {
      finishWorkout();
      return;
    }

    applyPendingTransition(pendingTransition);
  }

  return (
    <PageShell className="pt-5" showNavMenu={false}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="rounded-[24px] border border-[#2A3140] bg-[#12151C] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]"
                style={{ lineHeight: "15px" }}
              >
                Тренировка
              </p>
              <h1 className="mt-1 text-xl font-medium text-white">
                {workoutDraft.title}
              </h1>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-medium text-white">
                  {formatDuration(elapsedSeconds)}
                </span>
                <span className="pb-0.5 text-xs text-[#6F7A8D]">
                  осталось {formatDuration(remainingSeconds)}
                </span>
              </div>
            </div>

            <CircularProgress progressPercent={progressPercent} />
          </div>
        </header>

        <section className="flex-1 rounded-[24px] border border-[#2A3140] bg-[#12151C] p-4">
          {phase === "rest" ? (
            <div
              className="mb-3 inline-flex rounded-full bg-[#2A3140] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#D8E0EE]"
              style={{ lineHeight: "15px" }}
            >
              Отдых {formatDuration(restRemainingSeconds)}
            </div>
          ) : null}
          {canForceContinueRest ? (
            <button
              type="button"
              onClick={handleForceContinue}
              className="mb-3 rounded-2xl border border-[#4C5A6A] px-3 py-2 text-xs font-medium text-white"
            >
              Принудительно продолжить
            </button>
          ) : null}

          <p
            className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]"
            style={{ lineHeight: "15px" }}
          >
            {phase === "rest" ? "Следующее действие" : "Текущее упражнение"}
          </p>
          <h2
            className="mt-2 h-16 overflow-hidden text-xl font-medium text-white"
            style={{ ...clampTwoLinesStyle, lineHeight: "15px" }}
          >
            {currentExercise.name}
          </h2>
          <p
            className="mt-2 h-10 overflow-hidden text-[11px] text-[#8E97A8]"
            style={{ ...clampTwoLinesStyle, lineHeight: "15px" }}
          >
            {currentExercise.prescription}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-2xl bg-[#0B0E15] px-2 py-3 text-center">
              <p
                className="overflow-hidden text-[10px] uppercase tracking-[0.14em] text-[#8E97A8] whitespace-nowrap text-ellipsis"
                style={{ lineHeight: "15px" }}
              >
                Подход
              </p>
              <p className="mt-1 overflow-hidden text-xl font-medium text-white text-center whitespace-nowrap text-ellipsis">
                {currentSetNumber}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl bg-[#0B0E15] px-2 py-3 text-center">
              <p
                className="overflow-hidden text-[10px] uppercase tracking-[0.14em] text-[#8E97A8] whitespace-nowrap text-ellipsis"
                style={{ lineHeight: "15px" }}
              >
                Осталось
              </p>
              <p className="mt-1 overflow-hidden text-xl font-medium text-white text-center whitespace-nowrap text-ellipsis">
                {remainingSetsInExercise}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl bg-[#0B0E15] px-2 py-3 text-center">
              <p
                className="overflow-hidden text-[10px] uppercase tracking-[0.14em] text-[#8E97A8] whitespace-nowrap text-ellipsis"
                style={{ lineHeight: "15px" }}
              >
                На упражнении
              </p>
              <p className="mt-1 overflow-hidden text-xl font-medium text-white text-center whitespace-nowrap text-ellipsis">
                {formatDuration(exerciseElapsedSeconds[currentExerciseIndex] ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePreviousExercise}
              disabled={currentExerciseIndex === 0 || phase === "rest"}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[#2A3140] bg-[#0B0E15] text-white disabled:opacity-35"
              aria-label="Вернуться к прошлому упражнению"
            >
              <PreviousIcon />
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className={`flex h-18 w-18 items-center justify-center rounded-full ${
                phase === "rest"
                  ? "bg-[#4F5B63] text-[#D8E0EE] opacity-70"
                  : "bg-[#01BB96] text-[#000214]"
              }`}
              aria-label={phase === "rest" ? "Пропустить отдых" : "Закончить подход"}
            >
              <FinishSetIcon />
            </button>

            <button
              type="button"
              onClick={handleNextExercise}
              disabled={phase === "rest"}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[#2A3140] bg-[#0B0E15] text-white disabled:opacity-35"
              aria-label="Перейти к следующему упражнению"
            >
              <NextIcon />
            </button>
          </div>
        </section>

        <p className="px-1 text-lg font-medium text-white">Следующее упражнение</p>

        <section className="rounded-[22px] border border-[#2A3140] bg-[#12151C] px-4 py-3">
          <p
            className="hidden text-[10px] uppercase tracking-[0.14em] text-[#8E97A8]"
            style={{ lineHeight: "15px" }}
          >
            Следующее упражнение
          </p>
          <p
            className="mt-1 h-5 overflow-hidden text-sm font-medium text-white"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: "15px",
            }}
          >
            {nextExercise ? nextExercise.name : "Финиш тренировки"}
          </p>
          <p
            className="mt-1 h-8 overflow-hidden text-[11px] text-[#8E97A8]"
            style={{ ...clampTwoLinesStyle, lineHeight: "15px" }}
          >
            {nextExercise
              ? nextExercise.prescription
              : "После последнего подхода откроется экран завершения."}
          </p>
        </section>
      </section>
    </PageShell>
  );
}
