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
} from "../../src/shared/workoutSchedule.js";

function findUserByName(users, name) {
  const normalizedName = normalizeUserName(name);

  return (
    users.find((item) => normalizeUserName(item.name) === normalizedName) ?? null
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

  async login({ name, password }) {
    const database = await readDatabase();
    const user = findUserByName(database.users, name);

    if (!user || user.password !== password) {
      return null;
    }

    return sanitizeUser(user);
  },

  async register({ name, password }) {
    const database = await readDatabase();
    const existingUser = findUserByName(database.users, name);

    if (existingUser) {
      throw new Error("Пользователь с таким именем уже существует.");
    }

    const timestamp = new Date().toISOString();
    const nextUser = {
      id: createUserId(),
      name: name.trim(),
      password,
      email: null,
      profilePhoto: null,
      trainingLevel: "Не определен",
      lastTestScore: null,
      trainingPlan: null,
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
      database.users.some(
        (item) =>
          item.id !== userId &&
          normalizeUserName(item.name) === normalizeUserName(trimmedName),
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

  async saveTrainingPlan(userId, trainingPlan) {
    const database = await readDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
    const nextUser = {
      ...currentUser,
      trainingPlan,
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
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: removeScheduledWorkout({
        scheduledWorkouts: currentUser.scheduledWorkouts ?? [],
        trainingPlan: currentUser.trainingPlan,
        scheduledWorkoutId,
      }),
      updatedAt: new Date().toISOString(),
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
    const nextWorkoutHistoryEntry = {
      id: createWorkoutHistoryId(),
      scheduledWorkoutId,
      title: scheduledWorkout.title,
      emphasis: scheduledWorkout.emphasis,
      date: scheduledWorkout.date,
      time: scheduledWorkout.time,
      durationSeconds,
      completedExercisesCount,
      completedSetsCount,
      metrics: {
        weightKg,
        burnedCalories,
      },
      completedAt,
    };
    const nextUser = {
      ...currentUser,
      scheduledWorkouts: (currentUser.scheduledWorkouts ?? []).map((item) =>
        item.id === scheduledWorkoutId
          ? {
              ...item,
              status: "completed",
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
