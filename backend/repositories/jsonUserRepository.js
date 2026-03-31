import {
  createUserId,
  normalizeUserName,
  readDatabase,
  sanitizeUser,
  writeDatabase,
} from "../jsonDatabase.js";
import {
  cancelWorkout as removeScheduledWorkout,
  rebalanceScheduledWorkouts,
  rescheduleWorkout as updateScheduledWorkout,
  scheduleWorkout as addScheduledWorkout,
} from "../shared/workoutSchedule.js";
import {
  normalizeTrainingPlanAdaptationHistory,
} from "../services/trainingPlanAdaptationHistory.js";
import { syncExpiredScheduledWorkouts } from "../services/expiredScheduledWorkouts.js";
import {
  buildWorkoutOutcomeFeedbackEvents,
  normalizeTrainingMlFeedbackHistory,
} from "../services/trainingMlFeedback.js";
import { createWorkoutHistoryEntry } from "../services/workoutHistory.js";

function findUserByLogin(users, login) {
  const normalizedLogin = normalizeUserName(login);

  return (
    users.find(
      (item) => normalizeUserName(item.login ?? item.name) === normalizedLogin,
    ) ?? null
  );
}

function findUserByName(users, name) {
  const normalizedName = normalizeUserName(name);

  return (
    users.find((item) => normalizeUserName(item.name) === normalizedName) ??
    null
  );
}

function normalizeGenderValue(gender) {
  const normalizedGender =
    typeof gender === "string" ? gender.trim().toLowerCase() : "";

  if (normalizedGender === "male" || normalizedGender === "female") {
    return normalizedGender;
  }

  return "not_specified";
}

function createWorkoutHistoryId() {
  return `workout_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mergeTrainingMlFeedbackHistory(existingHistory = [], nextEvents = []) {
  return normalizeTrainingMlFeedbackHistory([
    ...(existingHistory ?? []),
    ...nextEvents,
  ]);
}

function syncUserExpiredWorkouts(currentUser) {
  const syncedWorkouts = syncExpiredScheduledWorkouts({
    scheduledWorkouts: currentUser?.scheduledWorkouts ?? [],
    workoutHistory: currentUser?.workoutHistory ?? [],
    trainingPlan: currentUser?.trainingPlan ?? null,
    historyEntryIdFactory: createWorkoutHistoryId,
  });

  if (!syncedWorkouts.didChange) {
    return {
      didChange: false,
      user: currentUser,
    };
  }

  const appendedWorkoutHistory = syncedWorkouts.workoutHistory.slice(
    (currentUser?.workoutHistory ?? []).length,
  );
  const feedbackEvents = appendedWorkoutHistory.flatMap((workoutEntry) =>
    buildWorkoutOutcomeFeedbackEvents(workoutEntry, "schedule_sync"),
  );

  return {
    didChange: true,
    user: {
      ...currentUser,
      scheduledWorkouts: syncedWorkouts.scheduledWorkouts,
      workoutHistory: syncedWorkouts.workoutHistory,
      trainingMlFeedbackHistory: mergeTrainingMlFeedbackHistory(
        currentUser?.trainingMlFeedbackHistory,
        feedbackEvents,
      ),
      updatedAt: syncedWorkouts.lastUpdatedAt ?? new Date().toISOString(),
    },
  };
}

export const jsonUserRepository = {
  async getById(userId) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const user = syncResult.user;

    if (syncResult.didChange) {
      database.users[userIndex] = user;
      await writeDatabase(database);
    }

    return sanitizeUser(user);
  },

  async login({ login, password }) {
    const database = await readDatabase();
    const user = findUserByLogin(database.users, login);

    if (!user || user.password !== password) {
      return null;
    }

    return this.getById(user.id);
  },

  async register({ login, password }) {
    const database = await readDatabase();
    const trimmedLogin = String(login).trim();
    const existingUser = findUserByLogin(database.users, trimmedLogin);

    if (existingUser) {
      throw new Error("Пользователь с таким логином уже существует.");
    }

    const timestamp = new Date().toISOString();
    const nextUser = {
      id: createUserId(),
      login: trimmedLogin,
      name: trimmedLogin,
      password,
      email: null,
      gender: "not_specified",
      profilePhoto: null,
      trainingLevel: "Не определен",
      lastTestScore: null,
      trainingPlan: null,
      trainingPlanAdaptationHistory: [],
      trainingMlFeedbackHistory: [],
      scheduledWorkouts: [],
      workoutHistory: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    database.users.push(nextUser);
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async updateProfile(userId, { name, email, password, profilePhoto, gender }) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
    const trimmedName = String(name ?? currentUser.name).trim();

    if (
      trimmedName &&
      normalizeUserName(trimmedName) !== normalizeUserName(currentUser.name) &&
      findUserByName(
        database.users.filter((item) => item.id !== userId),
        trimmedName,
      )
    ) {
      throw new Error("Пользователь с таким именем уже существует.");
    }

    const nextUser = {
      ...currentUser,
      name: trimmedName || currentUser.name,
      email: String(email ?? "").trim() || null,
      gender: normalizeGenderValue(gender ?? currentUser.gender),
      password: String(password ?? "").trim() || currentUser.password,
      profilePhoto: profilePhoto || currentUser.profilePhoto || null,
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async saveTrainingPlan(
    userId,
    trainingPlan,
    adaptationEvent = null,
    mlFeedbackEvents = [],
  ) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const trainingPlanAdaptationHistory = adaptationEvent
      ? normalizeTrainingPlanAdaptationHistory([
          ...(currentUser.trainingPlanAdaptationHistory ?? []),
          adaptationEvent,
        ])
      : normalizeTrainingPlanAdaptationHistory(
          currentUser.trainingPlanAdaptationHistory,
        );
    const nextUser = {
      ...currentUser,
      trainingPlan,
      trainingPlanAdaptationHistory,
      trainingMlFeedbackHistory: mergeTrainingMlFeedbackHistory(
        currentUser.trainingMlFeedbackHistory,
        mlFeedbackEvents,
      ),
      scheduledWorkouts: rebalanceScheduledWorkouts({
        scheduledWorkouts: currentUser.scheduledWorkouts ?? [],
        trainingPlan,
      }),
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async scheduleWorkout(userId, { date, time }) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: addScheduledWorkout({
        scheduledWorkouts: currentUser.scheduledWorkouts ?? [],
        trainingPlan: currentUser.trainingPlan,
        date,
        time,
      }),
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async rescheduleWorkout(userId, scheduledWorkoutId, { date, time }) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: updateScheduledWorkout({
        scheduledWorkouts: currentUser.scheduledWorkouts ?? [],
        trainingPlan: currentUser.trainingPlan,
        scheduledWorkoutId,
        date,
        time,
      }),
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async cancelWorkout(userId, scheduledWorkoutId) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const scheduledWorkout = (currentUser.scheduledWorkouts ?? []).find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("Тренировка не найдена в календаре.");
    }

    const canceledAt = new Date().toISOString();
    const nextWorkoutHistoryEntry = createWorkoutHistoryEntry({
      scheduledWorkout,
      completionPayload: {
        status: "canceled",
        plannedDurationSeconds:
          (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      },
      trainingPlan: currentUser.trainingPlan,
      historyEntryId: createWorkoutHistoryId(),
      completedAt: canceledAt,
    });
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: removeScheduledWorkout({
        scheduledWorkouts: currentUser.scheduledWorkouts ?? [],
        trainingPlan: currentUser.trainingPlan,
        scheduledWorkoutId,
      }),
      workoutHistory: [
        ...(currentUser.workoutHistory ?? []),
        nextWorkoutHistoryEntry,
      ],
      updatedAt: canceledAt,
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async skipWorkout(userId, scheduledWorkoutId) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const scheduledWorkout = (currentUser.scheduledWorkouts ?? []).find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("Тренировка не найдена в календаре.");
    }

    const skippedAt = new Date().toISOString();
    const nextWorkoutHistoryEntry = createWorkoutHistoryEntry({
      scheduledWorkout,
      completionPayload: {
        status: "skipped",
        plannedDurationSeconds:
          (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      },
      trainingPlan: currentUser.trainingPlan,
      historyEntryId: createWorkoutHistoryId(),
      completedAt: skippedAt,
    });
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: (currentUser.scheduledWorkouts ?? []).map((item) =>
        item.id === scheduledWorkoutId
          ? {
              ...item,
              status: "skipped",
              completedAt: skippedAt,
              result: nextWorkoutHistoryEntry,
            }
          : item,
      ),
      workoutHistory: [
        ...(currentUser.workoutHistory ?? []),
        nextWorkoutHistoryEntry,
      ],
      trainingMlFeedbackHistory: mergeTrainingMlFeedbackHistory(
        currentUser.trainingMlFeedbackHistory,
        buildWorkoutOutcomeFeedbackEvents(nextWorkoutHistoryEntry),
      ),
      updatedAt: skippedAt,
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async completeWorkout(userId, completionPayload) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const {
      scheduledWorkoutId,
      durationSeconds = 0,
      completedExercisesCount = 0,
      completedSetsCount = 0,
      exerciseSetWeights = [],
      weightKg = null,
      burnedCalories = null,
    } = completionPayload;
    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const scheduledWorkout = (currentUser.scheduledWorkouts ?? []).find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("Тренировка не найдена в календаре.");
    }

    const completedAt = new Date().toISOString();
    const nextWorkoutHistoryEntry = createWorkoutHistoryEntry({
      scheduledWorkout,
      completionPayload: {
        ...completionPayload,
        durationSeconds,
        completedExercisesCount,
        completedSetsCount,
        exerciseSetWeights,
        weightKg,
        burnedCalories,
      },
      trainingPlan: currentUser.trainingPlan,
      historyEntryId: createWorkoutHistoryId(),
      completedAt,
    });
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: (currentUser.scheduledWorkouts ?? []).map((item) =>
        item.id === scheduledWorkoutId
          ? {
              ...item,
              status: nextWorkoutHistoryEntry.status,
              completedAt,
              result: nextWorkoutHistoryEntry,
            }
          : item,
      ),
      workoutHistory: [
        ...(currentUser.workoutHistory ?? []),
        nextWorkoutHistoryEntry,
      ],
      trainingMlFeedbackHistory: mergeTrainingMlFeedbackHistory(
        currentUser.trainingMlFeedbackHistory,
        buildWorkoutOutcomeFeedbackEvents(nextWorkoutHistoryEntry),
      ),
      updatedAt: completedAt,
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async updateTrainingResult(userId, { score, trainingLevel }) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const nextUser = {
      ...database.users[userIndex],
      trainingLevel,
      lastTestScore: score,
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async appendTrainingMlFeedback(userId, feedbackEvents = []) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const nextUser = {
      ...database.users[userIndex],
      trainingMlFeedbackHistory: mergeTrainingMlFeedbackHistory(
        database.users[userIndex].trainingMlFeedbackHistory,
        feedbackEvents,
      ),
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },
};
