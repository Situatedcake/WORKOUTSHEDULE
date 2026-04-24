import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import AchievementUnlockOverlay from "../../components/AchievementUnlockOverlay";
import PageShell from "../../components/PageShell";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import {
  REST_DURATION_SECONDS,
  formatDuration,
} from "../../shared/activeWorkout";
import {
  buildLiveWorkoutAchievementUnlocks,
  getUnlockedAchievementIds,
} from "../../shared/liveWorkoutAchievements";
import { getCelebrationTimeout } from "../../shared/gamificationCelebration";
import {
  clearActiveWorkoutDraft,
  clearActiveWorkoutRuntime,
  clearEntireActiveWorkoutSession,
  getActiveWorkoutDraft,
  getActiveWorkoutRuntime,
  saveActiveWorkoutRuntime,
  saveActiveWorkoutResultDraft,
} from "../../utils/activeWorkoutSession";
import { markGamificationCelebrationShown } from "../../utils/gamificationCelebrationSession";

const clampTwoLinesStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

function PreviousIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L10 12L18 18V6Z" fill="currentColor" />
      <path
        d="M7 6V18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FinishSetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L14 12L6 18V6Z" fill="currentColor" />
      <path
        d="M17 6V18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PauseIcon({ paused = false }) {
  if (paused) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M7 5.5L13.5 10L7 14.5V5.5Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="5.5" y="4.5" width="3.2" height="11" rx="1.2" fill="currentColor" />
      <rect x="11.3" y="4.5" width="3.2" height="11" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5L14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 5.5L5.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
        <circle cx="55" cy="55" r={radius} stroke="#252B38" strokeWidth="8" fill="none" />
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="var(--accent-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-medium text-[var(--text-primary)]">
          {Math.round(normalizedPercent)}%
        </span>
      </div>
    </div>
  );
}

function sumValues(values = []) {
  return values.reduce((total, value) => total + value, 0);
}

function createExerciseSetWeights(exercises = []) {
  return exercises.map((exercise) =>
    Array.from({ length: Math.max(exercise.sets ?? 0, 1) }, () => ""),
  );
}

function createSkippedExerciseFlags(exercises = []) {
  return Array.from({ length: exercises.length }, () => false);
}

function normalizeWeightValue(value) {
  const normalizedValue = String(value ?? "").trim().replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeWeightMatrix(exercises = [], savedMatrix = []) {
  return exercises.map((exercise, exerciseIndex) => {
    const targetLength = Math.max(exercise.sets ?? 0, 1);
    const sourceWeights = Array.isArray(savedMatrix?.[exerciseIndex])
      ? savedMatrix[exerciseIndex]
      : [];

    return Array.from({ length: targetLength }, (_, weightIndex) => {
      const value = sourceWeights[weightIndex];
      return value == null ? "" : String(value);
    });
  });
}

function normalizeSkippedFlags(exercises = [], savedFlags = []) {
  return exercises.map((_, index) => Boolean(savedFlags?.[index]));
}

function buildInitialRuntimeState(workoutDraft, runtimeState) {
  const exerciseCount = workoutDraft?.exercises?.length ?? 0;
  const nowIso = new Date().toISOString();

  if (!workoutDraft || !exerciseCount) {
    return null;
  }

  const hasCompatibleRuntime =
    runtimeState?.scheduledWorkoutId === workoutDraft.scheduledWorkoutId;

  if (!hasCompatibleRuntime) {
    return {
      startedAt: nowIso,
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      completedSetsByExercise: Array.from({ length: exerciseCount }, () => 0),
      exerciseElapsedSeconds: Array.from({ length: exerciseCount }, () => 0),
      setWeightsByExercise: createExerciseSetWeights(workoutDraft.exercises),
      skippedExercisesByIndex: createSkippedExerciseFlags(workoutDraft.exercises),
      phase: "exercise",
      restRemainingSeconds:
        workoutDraft.exercises[0]?.restSeconds ?? REST_DURATION_SECONDS,
      pendingTransition: null,
      restContinuePressCount: 0,
      hasUnlockedForceContinue: false,
      isPaused: false,
      lastTickAt: nowIso,
      pausedAt: null,
    };
  }

  const safeExerciseIndex = Math.max(
    0,
    Math.min(Number(runtimeState.currentExerciseIndex) || 0, exerciseCount - 1),
  );

  return {
    startedAt: runtimeState.startedAt ?? new Date().toISOString(),
    elapsedSeconds: Math.max(Number(runtimeState.elapsedSeconds) || 0, 0),
    currentExerciseIndex: safeExerciseIndex,
    completedSetsByExercise: Array.from({ length: exerciseCount }, (_, index) =>
      Math.max(Number(runtimeState.completedSetsByExercise?.[index]) || 0, 0),
    ),
    exerciseElapsedSeconds: Array.from({ length: exerciseCount }, (_, index) =>
      Math.max(Number(runtimeState.exerciseElapsedSeconds?.[index]) || 0, 0),
    ),
    setWeightsByExercise: normalizeWeightMatrix(
      workoutDraft.exercises,
      runtimeState.setWeightsByExercise,
    ),
    skippedExercisesByIndex: normalizeSkippedFlags(
      workoutDraft.exercises,
      runtimeState.skippedExercisesByIndex,
    ),
    phase: runtimeState.phase === "rest" ? "rest" : "exercise",
    restRemainingSeconds: Math.max(
      Number(runtimeState.restRemainingSeconds) ||
        workoutDraft.exercises[safeExerciseIndex]?.restSeconds ||
        REST_DURATION_SECONDS,
      0,
    ),
    pendingTransition:
      runtimeState.pendingTransition &&
      typeof runtimeState.pendingTransition === "object"
        ? runtimeState.pendingTransition
        : null,
    restContinuePressCount: Math.max(
      Number(runtimeState.restContinuePressCount) || 0,
      0,
    ),
    hasUnlockedForceContinue: Boolean(runtimeState.hasUnlockedForceContinue),
    isPaused: Boolean(runtimeState.isPaused),
    lastTickAt:
      runtimeState.lastTickAt ??
      runtimeState.savedAt ??
      runtimeState.startedAt ??
      nowIso,
    pausedAt:
      runtimeState.isPaused
        ? runtimeState.pausedAt ??
          runtimeState.savedAt ??
          runtimeState.lastTickAt ??
          nowIso
        : null,
  };
}

function cloneRuntimeSnapshot(snapshot) {
  return {
    ...snapshot,
    completedSetsByExercise: [...(snapshot?.completedSetsByExercise ?? [])],
    exerciseElapsedSeconds: [...(snapshot?.exerciseElapsedSeconds ?? [])],
    setWeightsByExercise: (snapshot?.setWeightsByExercise ?? []).map((weights) => [
      ...(weights ?? []),
    ]),
    skippedExercisesByIndex: [...(snapshot?.skippedExercisesByIndex ?? [])],
    pendingTransition:
      snapshot?.pendingTransition && typeof snapshot.pendingTransition === "object"
        ? { ...snapshot.pendingTransition }
        : null,
  };
}

function getExerciseRestSeconds(workoutDraft, exerciseIndex) {
  return (
    workoutDraft?.exercises?.[exerciseIndex]?.restSeconds ?? REST_DURATION_SECONDS
  );
}

function applyPendingTransitionToSnapshot(snapshot, workoutDraft) {
  const nextSnapshot = cloneRuntimeSnapshot(snapshot);

  if (nextSnapshot.pendingTransition?.type === "nextExercise") {
    nextSnapshot.currentExerciseIndex = Math.min(
      nextSnapshot.currentExerciseIndex + 1,
      Math.max((workoutDraft?.exercises?.length ?? 1) - 1, 0),
    );
  }

  nextSnapshot.phase = "exercise";
  nextSnapshot.pendingTransition = null;
  nextSnapshot.restContinuePressCount = 0;
  nextSnapshot.restRemainingSeconds = getExerciseRestSeconds(
    workoutDraft,
    nextSnapshot.currentExerciseIndex,
  );

  return nextSnapshot;
}

function advanceRuntimeSnapshot(snapshot, workoutDraft, deltaSeconds) {
  const nextSnapshot = cloneRuntimeSnapshot(snapshot);
  const normalizedDelta = Math.max(Math.floor(deltaSeconds), 0);

  if (!normalizedDelta || !workoutDraft) {
    return {
      snapshot: nextSnapshot,
      shouldFinishWorkout: false,
    };
  }

  nextSnapshot.elapsedSeconds += normalizedDelta;

  let remainingDelta = normalizedDelta;

  while (remainingDelta > 0) {
    if (nextSnapshot.phase === "rest") {
      const currentRestSeconds = Math.max(nextSnapshot.restRemainingSeconds ?? 0, 0);

      if (currentRestSeconds <= 0) {
        if (nextSnapshot.pendingTransition?.type === "finish") {
          return {
            snapshot: nextSnapshot,
            shouldFinishWorkout: true,
          };
        }

        Object.assign(
          nextSnapshot,
          applyPendingTransitionToSnapshot(nextSnapshot, workoutDraft),
        );
        continue;
      }

      const consumedRestSeconds = Math.min(currentRestSeconds, remainingDelta);
      nextSnapshot.restRemainingSeconds = currentRestSeconds - consumedRestSeconds;
      remainingDelta -= consumedRestSeconds;

      if (nextSnapshot.restRemainingSeconds <= 0) {
        if (nextSnapshot.pendingTransition?.type === "finish") {
          return {
            snapshot: nextSnapshot,
            shouldFinishWorkout: true,
          };
        }

        Object.assign(
          nextSnapshot,
          applyPendingTransitionToSnapshot(nextSnapshot, workoutDraft),
        );
      }

      continue;
    }

    const safeExerciseIndex = Math.max(
      0,
      Math.min(
        nextSnapshot.currentExerciseIndex,
        Math.max((workoutDraft.exercises?.length ?? 1) - 1, 0),
      ),
    );

    nextSnapshot.exerciseElapsedSeconds[safeExerciseIndex] =
      Math.max(nextSnapshot.exerciseElapsedSeconds[safeExerciseIndex] ?? 0, 0) +
      remainingDelta;
    remainingDelta = 0;
  }

  return {
    snapshot: nextSnapshot,
    shouldFinishWorkout: false,
  };
}

export default function TraningPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const workoutDraft = useMemo(() => getActiveWorkoutDraft(), []);
  const runtimeState = useMemo(() => getActiveWorkoutRuntime(), []);
  const initialRuntimeState = useMemo(
    () => buildInitialRuntimeState(workoutDraft, runtimeState),
    [runtimeState, workoutDraft],
  );
  const [startedAt] = useState(
    () => initialRuntimeState?.startedAt ?? new Date().toISOString(),
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(
    () => initialRuntimeState?.elapsedSeconds ?? 0,
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    () => initialRuntimeState?.currentExerciseIndex ?? 0,
  );
  const [completedSetsByExercise, setCompletedSetsByExercise] = useState(
    () => initialRuntimeState?.completedSetsByExercise ?? [],
  );
  const [exerciseElapsedSeconds, setExerciseElapsedSeconds] = useState(
    () => initialRuntimeState?.exerciseElapsedSeconds ?? [],
  );
  const [setWeightsByExercise, setSetWeightsByExercise] = useState(
    () => initialRuntimeState?.setWeightsByExercise ?? [],
  );
  const [skippedExercisesByIndex, setSkippedExercisesByIndex] = useState(
    () => initialRuntimeState?.skippedExercisesByIndex ?? [],
  );
  const [phase, setPhase] = useState(
    () => initialRuntimeState?.phase ?? "exercise",
  );
  const [restRemainingSeconds, setRestRemainingSeconds] = useState(
    () => initialRuntimeState?.restRemainingSeconds ?? REST_DURATION_SECONDS,
  );
  const [pendingTransition, setPendingTransition] = useState(
    () => initialRuntimeState?.pendingTransition ?? null,
  );
  const [restContinuePressCount, setRestContinuePressCount] = useState(
    () => initialRuntimeState?.restContinuePressCount ?? 0,
  );
  const [hasUnlockedForceContinue, setHasUnlockedForceContinue] = useState(
    () => initialRuntimeState?.hasUnlockedForceContinue ?? false,
  );
  const [isPaused, setIsPaused] = useState(
    () => initialRuntimeState?.isPaused ?? false,
  );
  const [lastTickAt, setLastTickAt] = useState(
    () => initialRuntimeState?.lastTickAt ?? new Date().toISOString(),
  );
  const [pausedAt, setPausedAt] = useState(
    () => initialRuntimeState?.pausedAt ?? null,
  );
  const [isExitPromptOpen, setIsExitPromptOpen] = useState(false);
  const [achievementUnlockQueue, dispatchAchievementUnlockQueue] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "append":
          return [...state, ...(action.items ?? [])];
        case "shift":
          return state.slice(1);
        default:
          return state;
      }
    },
    [],
  );
  const runtimeSnapshotRef = useRef(null);
  const seenAchievementUnlockIdsRef = useRef(
    getUnlockedAchievementIds(currentUser?.gamification),
  );
  const delayedFinishTimeoutRef = useRef(null);
  const latestWorkoutMetricsRef = useRef({
    startedAt: initialRuntimeState?.startedAt ?? new Date().toISOString(),
    elapsedSeconds: initialRuntimeState?.elapsedSeconds ?? 0,
    completedSetsByExercise: initialRuntimeState?.completedSetsByExercise ?? [],
    setWeightsByExercise: initialRuntimeState?.setWeightsByExercise ?? [],
    skippedExercisesByIndex: initialRuntimeState?.skippedExercisesByIndex ?? [],
    trainingPlanId: currentUser?.trainingPlan?.id ?? null,
  });
  const activeAchievementUnlock = achievementUnlockQueue[0] ?? null;

  const currentExercise =
    workoutDraft?.exercises?.[currentExerciseIndex] ?? null;
  const currentExerciseRestSeconds =
    currentExercise?.restSeconds ?? REST_DURATION_SECONDS;
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
    phase === "rest" &&
    (hasUnlockedForceContinue || restContinuePressCount >= 5);
  const canSavePartialWorkout = completedSetsCount > 0;
  const currentSetWeight =
    setWeightsByExercise[currentExerciseIndex]?.[
      Math.max(currentSetNumber - 1, 0)
    ] ?? "";
  const isCurrentExerciseSkipped =
    skippedExercisesByIndex[currentExerciseIndex] === true;

  useEffect(() => {
    const unlockedIds = getUnlockedAchievementIds(currentUser?.gamification);

    unlockedIds.forEach((achievementId) => {
      seenAchievementUnlockIdsRef.current.add(achievementId);
    });
  }, [currentUser?.gamification]);

  useEffect(() => {
    latestWorkoutMetricsRef.current = {
      startedAt,
      elapsedSeconds,
      completedSetsByExercise,
      setWeightsByExercise,
      skippedExercisesByIndex,
      trainingPlanId: currentUser?.trainingPlan?.id ?? null,
    };
  }, [
    completedSetsByExercise,
    currentUser?.trainingPlan?.id,
    elapsedSeconds,
    skippedExercisesByIndex,
    setWeightsByExercise,
    startedAt,
  ]);

  useEffect(() => {
    if (!activeAchievementUnlock) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatchAchievementUnlockQueue({ type: "shift" });
    }, getCelebrationTimeout(activeAchievementUnlock));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeAchievementUnlock]);

  const queueAchievementUnlocks = useCallback((achievementUnlocks = []) => {
    const nextUnlocks = achievementUnlocks.filter((achievement) => {
      if (!achievement?.id || seenAchievementUnlockIdsRef.current.has(achievement.id)) {
        return false;
      }

      seenAchievementUnlockIdsRef.current.add(achievement.id);
      markGamificationCelebrationShown(`achievement:${achievement.id}`);
      return true;
    });

    if (!nextUnlocks.length) {
      return false;
    }

    dispatchAchievementUnlockQueue({ type: "append", items: nextUnlocks });
    return true;
  }, []);

  const finishWorkout = useCallback(
    (
      completedSetsOverrideInput = null,
      runtimeSnapshotOverride = null,
      skippedExercisesOverrideInput = null,
    ) => {
      if (!workoutDraft) {
        return;
      }

      if (delayedFinishTimeoutRef.current) {
        window.clearTimeout(delayedFinishTimeoutRef.current);
        delayedFinishTimeoutRef.current = null;
      }

      const latestWorkoutMetrics = latestWorkoutMetricsRef.current;
      const completedSetsOverride =
        completedSetsOverrideInput ?? latestWorkoutMetrics.completedSetsByExercise;
      const effectiveSnapshot = runtimeSnapshotOverride ?? runtimeSnapshotRef.current;
      const effectiveElapsedSeconds =
        effectiveSnapshot?.elapsedSeconds ?? latestWorkoutMetrics.elapsedSeconds;
      const effectiveSetWeightsByExercise =
        effectiveSnapshot?.setWeightsByExercise ??
        latestWorkoutMetrics.setWeightsByExercise;
      const skippedExercisesOverride =
        skippedExercisesOverrideInput ??
        effectiveSnapshot?.skippedExercisesByIndex ??
        latestWorkoutMetrics.skippedExercisesByIndex;
      const effectiveStartedAt =
        effectiveSnapshot?.startedAt ?? latestWorkoutMetrics.startedAt;

      saveActiveWorkoutResultDraft({
        scheduledWorkoutId: workoutDraft.scheduledWorkoutId,
        trainingPlanId: latestWorkoutMetrics.trainingPlanId,
        sessionId: workoutDraft.sessionId,
        title: workoutDraft.title,
        emphasis: workoutDraft.emphasis,
        date: workoutDraft.scheduledDate,
        time: workoutDraft.scheduledTime,
        startedAt: effectiveStartedAt,
        plannedDurationSeconds: workoutDraft.totalEstimatedSeconds ?? 0,
        durationSeconds: effectiveElapsedSeconds,
        totalExercisesCount: workoutDraft.exercises?.length ?? 0,
        completedExercisesCount: completedSetsOverride.filter(
          (setsCount, index) =>
            setsCount >= (workoutDraft.exercises[index]?.sets ?? 0),
        ).length,
        totalSets: workoutDraft.totalSets ?? 0,
        completedSetsCount: sumValues(
          completedSetsOverride.map((setsCount, index) =>
            Math.min(setsCount, workoutDraft.exercises[index]?.sets ?? setsCount),
          ),
        ),
        exerciseSetWeights: (workoutDraft.exercises ?? []).map(
          (exercise, index) => ({
            exerciseId: exercise.sourceExerciseId ?? exercise.id,
            sourceExerciseId: exercise.sourceExerciseId ?? exercise.id,
            exerciseName: exercise.name,
            sets: exercise.sets,
            plannedSetsCount: exercise.sets,
            completedSetsCount: Math.min(
              completedSetsOverride[index] ?? 0,
              exercise.sets,
            ),
            status:
              skippedExercisesOverride?.[index] === true ? "skipped" : undefined,
            isSkipped: skippedExercisesOverride?.[index] === true,
            repRange: exercise.repRange,
            restSeconds: exercise.restSeconds,
            weightsKg: (effectiveSetWeightsByExercise[index] ?? [])
              .slice(0, exercise.sets)
              .map(normalizeWeightValue),
          }),
        ),
      });
      clearActiveWorkoutDraft();
      clearActiveWorkoutRuntime();
      navigate(ROUTES.WORKOUT_FINISH);
    },
    [navigate, workoutDraft],
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

      setRestRemainingSeconds(
        workoutDraft.exercises[
          nextTransition.type === "nextExercise"
            ? Math.min(currentExerciseIndex + 1, workoutDraft.exercises.length - 1)
            : currentExerciseIndex
        ]?.restSeconds ?? REST_DURATION_SECONDS,
      );
      setRestContinuePressCount(0);
      setPendingTransition(null);
      setPhase("exercise");
    },
    [currentExerciseIndex, workoutDraft],
  );

  const applyRuntimeSnapshot = useCallback((snapshot) => {
    setElapsedSeconds(snapshot.elapsedSeconds);
    setCurrentExerciseIndex(snapshot.currentExerciseIndex);
    setCompletedSetsByExercise(snapshot.completedSetsByExercise);
    setExerciseElapsedSeconds(snapshot.exerciseElapsedSeconds);
    setSetWeightsByExercise(snapshot.setWeightsByExercise);
    setSkippedExercisesByIndex(snapshot.skippedExercisesByIndex ?? []);
    setPhase(snapshot.phase);
    setRestRemainingSeconds(snapshot.restRemainingSeconds);
    setPendingTransition(snapshot.pendingTransition);
    setRestContinuePressCount(snapshot.restContinuePressCount);
    setHasUnlockedForceContinue(snapshot.hasUnlockedForceContinue);
    setIsPaused(snapshot.isPaused);
    setLastTickAt(snapshot.lastTickAt);
    setPausedAt(snapshot.pausedAt ?? null);
  }, []);

  useEffect(() => {
    if (!workoutDraft) {
      runtimeSnapshotRef.current = null;
      return;
    }

    runtimeSnapshotRef.current = {
      scheduledWorkoutId: workoutDraft.scheduledWorkoutId,
      startedAt,
      elapsedSeconds,
      currentExerciseIndex,
      completedSetsByExercise,
      exerciseElapsedSeconds,
      setWeightsByExercise,
      skippedExercisesByIndex,
      phase,
      restRemainingSeconds,
      pendingTransition,
      restContinuePressCount,
      hasUnlockedForceContinue,
      isPaused,
      lastTickAt,
      pausedAt,
    };
  }, [
    completedSetsByExercise,
    currentExerciseIndex,
    elapsedSeconds,
    exerciseElapsedSeconds,
    hasUnlockedForceContinue,
    isPaused,
    lastTickAt,
    pausedAt,
    pendingTransition,
    phase,
    restContinuePressCount,
    restRemainingSeconds,
    skippedExercisesByIndex,
    setWeightsByExercise,
    startedAt,
    workoutDraft,
  ]);

  const flushRuntimeState = useCallback((snapshotOverride = null) => {
    if (!workoutDraft) {
      return;
    }

    const runtimeSnapshot = snapshotOverride ?? runtimeSnapshotRef.current;

    if (!runtimeSnapshot) {
      return;
    }

    saveActiveWorkoutRuntime({
      scheduledWorkoutId: workoutDraft.scheduledWorkoutId,
      startedAt: runtimeSnapshot.startedAt,
      elapsedSeconds: runtimeSnapshot.elapsedSeconds,
      currentExerciseIndex: runtimeSnapshot.currentExerciseIndex,
      completedSetsByExercise: runtimeSnapshot.completedSetsByExercise,
      exerciseElapsedSeconds: runtimeSnapshot.exerciseElapsedSeconds,
      setWeightsByExercise: runtimeSnapshot.setWeightsByExercise,
      skippedExercisesByIndex: runtimeSnapshot.skippedExercisesByIndex,
      phase: runtimeSnapshot.phase,
      restRemainingSeconds: runtimeSnapshot.restRemainingSeconds,
      pendingTransition: runtimeSnapshot.pendingTransition,
      restContinuePressCount: runtimeSnapshot.restContinuePressCount,
      hasUnlockedForceContinue: runtimeSnapshot.hasUnlockedForceContinue,
      isPaused: runtimeSnapshot.isPaused,
      lastTickAt: runtimeSnapshot.lastTickAt,
      pausedAt: runtimeSnapshot.pausedAt,
      savedAt: new Date().toISOString(),
    });
  }, [workoutDraft]);

  const syncRuntimeWithClock = useCallback(
    (referenceDate = new Date()) => {
      if (!workoutDraft || !runtimeSnapshotRef.current) {
        return null;
      }

      const currentSnapshot = runtimeSnapshotRef.current;
      const nowIso = referenceDate.toISOString();

      if (currentSnapshot.isPaused) {
        const pausedSnapshot = {
          ...cloneRuntimeSnapshot(currentSnapshot),
          lastTickAt: nowIso,
          pausedAt: currentSnapshot.pausedAt ?? nowIso,
        };

        runtimeSnapshotRef.current = pausedSnapshot;
        applyRuntimeSnapshot(pausedSnapshot);
        return pausedSnapshot;
      }

      const lastTickTimestamp = Date.parse(
        currentSnapshot.lastTickAt ??
          currentSnapshot.savedAt ??
          currentSnapshot.startedAt ??
          nowIso,
      );
      const deltaSeconds = Number.isFinite(lastTickTimestamp)
        ? Math.max(
            Math.floor((referenceDate.getTime() - lastTickTimestamp) / 1000),
            0,
          )
        : 0;
      const { snapshot: nextSnapshot, shouldFinishWorkout } = advanceRuntimeSnapshot(
        currentSnapshot,
        workoutDraft,
        deltaSeconds,
      );
      const normalizedSnapshot = {
        ...nextSnapshot,
        lastTickAt: nowIso,
      };

      runtimeSnapshotRef.current = normalizedSnapshot;
      applyRuntimeSnapshot(normalizedSnapshot);

      if (shouldFinishWorkout) {
        finishWorkout(
          normalizedSnapshot.completedSetsByExercise,
          normalizedSnapshot,
        );
      }

      return normalizedSnapshot;
    },
    [applyRuntimeSnapshot, finishWorkout, workoutDraft],
  );

  useEffect(() => {
    if (!workoutDraft || isPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      syncRuntimeWithClock(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, syncRuntimeWithClock, workoutDraft]);

  useEffect(() => {
    if (!workoutDraft) {
      return;
    }

    flushRuntimeState(runtimeSnapshotRef.current);
  }, [
    completedSetsByExercise,
    currentExerciseIndex,
    elapsedSeconds,
    exerciseElapsedSeconds,
    flushRuntimeState,
    hasUnlockedForceContinue,
    isPaused,
    lastTickAt,
    pausedAt,
    pendingTransition,
    phase,
    restContinuePressCount,
    restRemainingSeconds,
    setWeightsByExercise,
    startedAt,
    workoutDraft,
  ]);

  useEffect(() => {
    if (!workoutDraft) {
      return;
    }

    syncRuntimeWithClock(new Date());
  }, [syncRuntimeWithClock, workoutDraft]);

  useEffect(() => {
    if (!workoutDraft) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [workoutDraft]);

  useEffect(() => {
    if (!workoutDraft) {
      return undefined;
    }

    const handlePageVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const syncedSnapshot = syncRuntimeWithClock(new Date());
        flushRuntimeState(syncedSnapshot);
        return;
      }

      syncRuntimeWithClock(new Date());
    };
    const handlePageHide = () => {
      const syncedSnapshot = syncRuntimeWithClock(new Date());
      flushRuntimeState(syncedSnapshot);
    };

    document.addEventListener("visibilitychange", handlePageVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handlePageVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [flushRuntimeState, syncRuntimeWithClock, workoutDraft]);

  useEffect(() => {
    return () => {
      if (delayedFinishTimeoutRef.current) {
        window.clearTimeout(delayedFinishTimeoutRef.current);
      }
    };
  }, []);

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!workoutDraft || !currentExercise || !initialRuntimeState) {
    return <Navigate to={ROUTES.WORKOUT_PLAN} replace />;
  }

  function handleFinishSet() {
    const actionTimestamp = new Date();
    const actionTimestampIso = actionTimestamp.toISOString();
    const nextSetWeightsByExercise = setWeightsByExercise.map((weights, index) => {
      if (index !== currentExerciseIndex) {
        return weights;
      }

      const nextWeights = [...weights];
      const currentWeightIndex = Math.max(currentSetNumber - 1, 0);
      const nextWeightIndex = currentWeightIndex + 1;

      if (
        nextWeightIndex < nextWeights.length &&
        !nextWeights[nextWeightIndex] &&
        nextWeights[currentWeightIndex]
      ) {
        nextWeights[nextWeightIndex] = nextWeights[currentWeightIndex];
      }

      return nextWeights;
    });

    setSetWeightsByExercise(nextSetWeightsByExercise);

    const nextCompletedSetsByExercise = completedSetsByExercise.map(
      (value, index) =>
        index === currentExerciseIndex
          ? Math.min(value + 1, currentExercise.sets)
          : value,
    );
    const isExerciseCompleted =
      nextCompletedSetsByExercise[currentExerciseIndex] >= currentExercise.sets;
    const isLastExercise =
      currentExerciseIndex >= workoutDraft.exercises.length - 1;
    const achievementUnlocks = buildLiveWorkoutAchievementUnlocks({
      currentUser,
      completedSetsByExercise: nextCompletedSetsByExercise,
      setWeightsByExercise: nextSetWeightsByExercise,
      willCompleteWorkout: isExerciseCompleted && isLastExercise,
      workoutStatus: "completed",
      referenceDate: actionTimestamp,
    });
    const hasNewAchievementUnlocks = queueAchievementUnlocks(achievementUnlocks);

    setCompletedSetsByExercise(nextCompletedSetsByExercise);
    setSkippedExercisesByIndex((previousValue) =>
      previousValue.map((isSkipped, index) =>
        index === currentExerciseIndex ? false : isSkipped,
      ),
    );

    if (isExerciseCompleted && isLastExercise) {
      if (hasNewAchievementUnlocks) {
        delayedFinishTimeoutRef.current = window.setTimeout(() => {
          finishWorkout(nextCompletedSetsByExercise);
        }, getCelebrationTimeout());
      } else {
        finishWorkout(nextCompletedSetsByExercise);
      }

      return;
    }

    setPhase("rest");
    setRestRemainingSeconds(currentExerciseRestSeconds);
    setPendingTransition({
      type: isExerciseCompleted ? "nextExercise" : "nextSet",
    });
    setLastTickAt(actionTimestampIso);
    setPausedAt(null);
  }

  function handlePreviousExercise() {
    if (currentExerciseIndex === 0 || isPaused) {
      return;
    }

    const previousIndex = currentExerciseIndex - 1;
    const actionTimestamp = new Date().toISOString();

    setCompletedSetsByExercise((previousValue) =>
      previousValue.map((value, index) => (index >= previousIndex ? 0 : value)),
    );
    setExerciseElapsedSeconds((previousValue) =>
      previousValue.map((value, index) => (index >= previousIndex ? 0 : value)),
    );
    setSetWeightsByExercise((previousValue) =>
      previousValue.map((weights, index) =>
        index >= previousIndex
          ? Array.from(
              { length: Math.max(workoutDraft.exercises[index]?.sets ?? 0, 1) },
              () => "",
            )
          : weights,
      ),
    );
    setSkippedExercisesByIndex((previousValue) =>
      previousValue.map((isSkipped, index) =>
        index >= previousIndex ? false : isSkipped,
      ),
    );
    setCurrentExerciseIndex(previousIndex);
    setPhase("exercise");
    setRestContinuePressCount(0);
    setPendingTransition(null);
    setRestRemainingSeconds(
      workoutDraft.exercises[previousIndex]?.restSeconds ?? REST_DURATION_SECONDS,
    );
    setLastTickAt(actionTimestamp);
    setPausedAt(null);
  }

  function handleNextExercise() {
    if (phase === "rest" || isPaused) {
      return;
    }

    const actionTimestamp = new Date().toISOString();

    if (currentExerciseIndex >= workoutDraft.exercises.length - 1) {
      const nextCompletedSetsByExercise = completedSetsByExercise.map(
        (value, index) =>
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
    setRestRemainingSeconds(
      workoutDraft.exercises[currentExerciseIndex + 1]?.restSeconds ??
        REST_DURATION_SECONDS,
    );
    setLastTickAt(actionTimestamp);
    setPausedAt(null);
  }

  function handleSkipCurrentExercise() {
    if (phase === "rest" || isPaused) {
      return;
    }

    const actionTimestamp = new Date().toISOString();
    const nextSkippedExercisesByIndex = skippedExercisesByIndex.map(
      (isSkipped, index) => (index === currentExerciseIndex ? true : isSkipped),
    );
    const isLastExercise =
      currentExerciseIndex >= workoutDraft.exercises.length - 1;

    setSkippedExercisesByIndex(nextSkippedExercisesByIndex);

    if (isLastExercise) {
      finishWorkout(completedSetsByExercise, null, nextSkippedExercisesByIndex);
      return;
    }

    setCurrentExerciseIndex((previousIndex) => previousIndex + 1);
    setPhase("exercise");
    setRestContinuePressCount(0);
    setPendingTransition(null);
    setRestRemainingSeconds(
      workoutDraft.exercises[currentExerciseIndex + 1]?.restSeconds ??
        REST_DURATION_SECONDS,
    );
    setLastTickAt(actionTimestamp);
    setPausedAt(null);
  }

  function handlePrimaryAction() {
    if (isPaused) {
      return;
    }

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

  function handleCurrentSetWeightChange(value) {
    setSetWeightsByExercise((previousValue) =>
      previousValue.map((weights, index) => {
        if (index !== currentExerciseIndex) {
          return weights;
        }

        const nextWeights = [...weights];
        nextWeights[Math.max(currentSetNumber - 1, 0)] = value;
        return nextWeights;
      }),
    );
  }

  function handleForceContinue() {
    if (!canForceContinueRest || isPaused) {
      return;
    }

    const actionTimestamp = new Date().toISOString();

    if (pendingTransition?.type === "finish") {
      finishWorkout();
      return;
    }

    applyPendingTransition(pendingTransition);
    setLastTickAt(actionTimestamp);
    setPausedAt(null);
  }

  function handleTogglePause() {
    const syncedSnapshot = syncRuntimeWithClock(new Date());
    const isCurrentlyPaused = syncedSnapshot?.isPaused ?? isPaused;
    const nextPausedValue = !isCurrentlyPaused;
    const actionTimestamp = new Date().toISOString();

    setIsPaused(nextPausedValue);
    setPausedAt(nextPausedValue ? actionTimestamp : null);
    setLastTickAt(actionTimestamp);
  }

  function handleContinueLater() {
    const syncedSnapshot = syncRuntimeWithClock(new Date());
    setIsExitPromptOpen(false);
    flushRuntimeState(syncedSnapshot);
    navigate(ROUTES.HOME);
  }

  function handleSavePartialWorkout() {
    syncRuntimeWithClock(new Date());
    setIsExitPromptOpen(false);
    finishWorkout(completedSetsByExercise);
  }

  function handleDiscardWorkout() {
    clearEntireActiveWorkoutSession();
    navigate(ROUTES.HOME);
  }

  return (
    <PageShell className="pt-5" showNavMenu={false}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-4 pb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Активная сессия
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Прогресс сохраняется автоматически.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePause}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)]"
              aria-label={
                isPaused ? "Продолжить тренировку" : "Поставить на паузу"
              }
            >
              <PauseIcon paused={isPaused} />
            </button>
            <button
              type="button"
              onClick={() => setIsExitPromptOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)]"
              aria-label="Выйти из тренировки"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <header className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]"
                style={{ lineHeight: "15px" }}
              >
                Тренировка
              </p>
              <h1 className="mt-1 text-xl font-medium text-[var(--text-primary)]">
                {workoutDraft.title}
              </h1>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-medium text-[var(--text-primary)]">
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

        <section className="flex-1 rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
          <div className="flex flex-wrap gap-2">
            {phase === "rest" ? (
              <div
                className="inline-flex rounded-full bg-[var(--border-primary)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--tooltip-text)]"
                style={{ lineHeight: "15px" }}
              >
                Отдых {formatDuration(restRemainingSeconds)}
              </div>
            ) : null}

            {isPaused ? (
              <div className="inline-flex rounded-full bg-[#27303E] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--tooltip-text)]">
                Пауза
              </div>
            ) : null}

            {canForceContinueRest ? (
              <button
                type="button"
                onClick={handleForceContinue}
                className="rounded-full border border-[#4C5A6A] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-primary)]"
              >
                Принудительно продолжить
              </button>
            ) : null}

            {isCurrentExerciseSkipped ? (
              <div className="inline-flex rounded-full border border-[#7B4F4F] bg-[#321C1C] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#FFB3B3]">
                РџСЂРѕРїСѓС‰РµРЅРѕ
              </div>
            ) : null}
          </div>

          {isPaused ? (
            <div className="mt-3 rounded-2xl border border-[#30425C] bg-[#102338] px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">Тренировка на паузе</p>
              <p className="mt-1 text-sm leading-6 text-[#BFD6F0]">
                Таймер остановлен. Можно продолжить позже без потери прогресса.
              </p>
            </div>
          ) : null}

          <p
            className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]"
            style={{ lineHeight: "15px" }}
          >
            {phase === "rest" ? "Следующее действие" : "Текущее упражнение"}
          </p>

          <h2
            className="mt-2 h-16 overflow-hidden text-xl font-medium text-[var(--text-primary)]"
            style={{ ...clampTwoLinesStyle, lineHeight: "18px" }}
          >
            {currentExercise.name}
          </h2>

          <p
            className="mt-2 h-10 overflow-hidden text-[11px] text-[var(--text-muted)]"
            style={{ ...clampTwoLinesStyle, lineHeight: "15px" }}
          >
            {currentExercise.prescription}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-2xl bg-[var(--surface-secondary)] px-2 py-3 text-center">
              <p
                className="overflow-hidden text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] text-ellipsis whitespace-nowrap"
                style={{ lineHeight: "15px" }}
              >
                Подход
              </p>
              <p className="mt-1 overflow-hidden text-xl font-medium text-[var(--text-primary)] text-ellipsis whitespace-nowrap">
                {currentSetNumber}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl bg-[var(--surface-secondary)] px-2 py-3 text-center">
              <p
                className="overflow-hidden text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] text-ellipsis whitespace-nowrap"
                style={{ lineHeight: "15px" }}
              >
                Осталось
              </p>
              <p className="mt-1 overflow-hidden text-xl font-medium text-[var(--text-primary)] text-ellipsis whitespace-nowrap">
                {remainingSetsInExercise}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl bg-[var(--surface-secondary)] px-2 py-3 text-center">
              <p
                className="overflow-hidden text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] text-ellipsis whitespace-nowrap"
                style={{ lineHeight: "15px" }}
              >
                На упражнении
              </p>
              <p className="mt-1 overflow-hidden text-xl font-medium text-[var(--text-primary)] text-ellipsis whitespace-nowrap">
                {formatDuration(exerciseElapsedSeconds[currentExerciseIndex] ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[var(--surface-secondary)] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p
                className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]"
                style={{ lineHeight: "15px" }}
              >
                Вес текущего подхода
              </p>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {currentSetNumber}
              </span>
            </div>

            <input
              value={currentSetWeight}
              onChange={(event) =>
                handleCurrentSetWeightChange(event.target.value)
              }
              inputMode="decimal"
              placeholder="Например, 25"
              disabled={phase === "rest" || isPaused}
              className="mt-3 w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[#5D6677] disabled:opacity-60"
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePreviousExercise}
              disabled={currentExerciseIndex === 0 || phase === "rest" || isPaused}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] disabled:opacity-35"
              aria-label="Вернуться к прошлому упражнению"
            >
              <PreviousIcon />
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isPaused}
              className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${
                phase === "rest"
                  ? "bg-[#4F5B63] text-[var(--tooltip-text)] opacity-70"
                  : "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
              } ${isPaused ? "opacity-40" : ""}`}
              aria-label={
                phase === "rest" ? "Ожидание окончания отдыха" : "Закончить подход"
              }
            >
              <FinishSetIcon />
            </button>

            <button
              type="button"
              onClick={handleNextExercise}
              disabled={phase === "rest" || isPaused}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] disabled:opacity-35"
              aria-label="Перейти к следующему упражнению"
            >
              <NextIcon />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSkipCurrentExercise}
            disabled={phase === "rest" || isPaused}
            className="mt-3 w-full rounded-2xl border border-[#7B4F4F] bg-[#321C1C] px-4 py-3 text-sm font-medium text-[#FFB3B3] disabled:opacity-40"
          >
            Skip exercise
          </button>
        </section>

        <p className="px-1 text-lg font-medium text-[var(--text-primary)]">Следующее упражнение</p>

        <section className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3">
          <p
            className="mt-1 h-5 overflow-hidden text-sm font-medium text-[var(--text-primary)]"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: "18px",
            }}
          >
            {nextExercise ? nextExercise.name : "Финиш тренировки"}
          </p>
          <p
            className="mt-1 h-8 overflow-hidden text-[11px] text-[var(--text-muted)]"
            style={{ ...clampTwoLinesStyle, lineHeight: "15px" }}
          >
            {nextExercise
              ? nextExercise.prescription
              : "После последнего подхода откроется экран завершения."}
          </p>
        </section>
      </section>

      <AchievementUnlockOverlay achievement={activeAchievementUnlock} />

      {isExitPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#030712]/80 px-5 pb-6 pt-20">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Выход из тренировки
            </p>
            <h2 className="mt-2 text-xl font-medium text-[var(--text-primary)]">
              Что сделать с текущей сессией?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Можно выйти и продолжить позже, либо полностью сбросить текущий
              прогресс.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {canSavePartialWorkout ? (
                <button
                  type="button"
                  onClick={handleSavePartialWorkout}
                  className="rounded-3xl bg-[var(--accent-primary)] px-5 py-4 text-base font-medium text-[var(--accent-contrast)]"
                >
                  Сохранить как частично выполненную
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleContinueLater}
                className={`rounded-3xl px-5 py-4 text-base font-medium ${
                  canSavePartialWorkout
                    ? "border border-[var(--border-primary)] text-[var(--text-primary)]"
                    : "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                }`}
              >
                Продолжить позже
              </button>
              <button
                type="button"
                onClick={handleDiscardWorkout}
                className="rounded-3xl border border-[#5C2A2A] px-5 py-4 text-base font-medium text-[#FFB3B3]"
              >
                Сбросить тренировку
              </button>
              <button
                type="button"
                onClick={() => setIsExitPromptOpen(false)}
                className="rounded-3xl border border-[var(--border-primary)] px-5 py-4 text-base font-medium text-[var(--text-primary)]"
              >
                Остаться
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
