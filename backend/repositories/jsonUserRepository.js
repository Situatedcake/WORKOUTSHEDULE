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
  scheduleWorkout as addScheduledWorkout,
} from "../shared/workoutSchedule.js";
import {
  normalizeTrainingPlanAdaptationHistory,
} from "../services/trainingPlanAdaptationHistory.js";
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

function createWorkoutHistoryId() {
  return `workout_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const jsonUserRepository = {
  async getById(userId) {
    const database = await readDatabase();
    const user = database.users.find((item) => item.id === userId) ?? null;

    return sanitizeUser(user);
  },

  async login({ login, password }) {
    const database = await readDatabase();
    const user = findUserByLogin(database.users, login);

    if (!user || user.password !== password) {
      return null;
    }

    return sanitizeUser(user);
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
      profilePhoto: null,
      trainingLevel: "Не определен",
      lastTestScore: null,
      trainingPlan: null,
      trainingPlanAdaptationHistory: [],
      scheduledWorkouts: [],
      workoutHistory: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    database.users.push(nextUser);
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async updateProfile(userId, { name, email, password, profilePhoto }) {
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
      password: String(password ?? "").trim() || currentUser.password,
      profilePhoto: profilePhoto || currentUser.profilePhoto || null,
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    await writeDatabase(database);

    return sanitizeUser(nextUser);
  },

  async saveTrainingPlan(userId, trainingPlan, adaptationEvent = null) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
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

    const currentUser = database.users[userIndex];
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

  async cancelWorkout(userId, scheduledWorkoutId) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
    const scheduledWorkout = (currentUser.scheduledWorkouts ?? []).find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("РўСЂРµРЅРёСЂРѕРІРєР° РЅРµ РЅР°Р№РґРµРЅР° РІ РєР°Р»РµРЅРґР°СЂРµ.");
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

    const currentUser = database.users[userIndex];
    const scheduledWorkout = (currentUser.scheduledWorkouts ?? []).find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("РўСЂРµРЅРёСЂРѕРІРєР° РЅРµ РЅР°Р№РґРµРЅР° РІ РєР°Р»РµРЅРґР°СЂРµ.");
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
      scheduledWorkouts: removeScheduledWorkout({
        scheduledWorkouts: currentUser.scheduledWorkouts ?? [],
        trainingPlan: currentUser.trainingPlan,
        scheduledWorkoutId,
      }),
      workoutHistory: [
        ...(currentUser.workoutHistory ?? []),
        nextWorkoutHistoryEntry,
      ],
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
    const currentUser = database.users[userIndex];
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
};
