import { formatDateKey } from "../shared/workoutSchedule.js";
import {
  createWorkoutHistoryEntry,
  normalizeWorkoutHistory,
} from "./workoutHistory.js";

function getExpiredWorkoutCompletedAt(dateKey, now = new Date()) {
  if (typeof dateKey !== "string" || !dateKey) {
    return now.toISOString();
  }

  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return now.toISOString();
  }

  return new Date(year, month - 1, day + 1, 0, 0, 0, 0).toISOString();
}

export function isScheduledWorkoutExpired(scheduledWorkout, now = new Date()) {
  if (!scheduledWorkout?.date) {
    return false;
  }

  return (
    (scheduledWorkout.status ?? "planned") === "planned" &&
    formatDateKey(now) > scheduledWorkout.date
  );
}

export function syncExpiredScheduledWorkouts({
  scheduledWorkouts = [],
  workoutHistory = [],
  trainingPlan = null,
  now = new Date(),
  historyEntryIdFactory = () =>
    `workout_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
}) {
  let didChange = false;
  let lastUpdatedAt = null;
  const nextWorkoutHistory = normalizeWorkoutHistory(workoutHistory);
  const nextScheduledWorkouts = scheduledWorkouts.map((scheduledWorkout) => {
    if (!isScheduledWorkoutExpired(scheduledWorkout, now)) {
      return scheduledWorkout;
    }

    didChange = true;
    const skippedAt = getExpiredWorkoutCompletedAt(scheduledWorkout.date, now);
    lastUpdatedAt = skippedAt;
    const workoutResult = createWorkoutHistoryEntry({
      scheduledWorkout,
      completionPayload: {
        status: "skipped",
        plannedDurationSeconds:
          (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      },
      trainingPlan,
      historyEntryId: historyEntryIdFactory(),
      completedAt: skippedAt,
    });

    nextWorkoutHistory.push(workoutResult);

    return {
      ...scheduledWorkout,
      status: "skipped",
      completedAt: skippedAt,
      result: workoutResult,
    };
  });

  return {
    didChange,
    lastUpdatedAt,
    scheduledWorkouts: nextScheduledWorkouts,
    workoutHistory: nextWorkoutHistory,
  };
}
