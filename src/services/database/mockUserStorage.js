import seedDatabase from "../../data/mockDatabase.json";
import { buildTrainingPlan } from "../../shared/trainingPlanBuilder";
import {
  cancelWorkout as removeScheduledWorkout,
  rebalanceScheduledWorkouts,
  scheduleWorkout as addScheduledWorkout,
} from "../../shared/workoutSchedule";

const DATABASE_STORAGE_KEY = "workoutshedule-mock-db";

let inMemoryDatabase = createInitialDatabase();

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createInitialDatabase() {
  return JSON.parse(JSON.stringify(seedDatabase));
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadDatabase() {
  if (!canUseLocalStorage()) {
    return cloneValue(inMemoryDatabase);
  }

  const rawDatabase = window.localStorage.getItem(DATABASE_STORAGE_KEY);

  if (!rawDatabase) {
    const initialDatabase = createInitialDatabase();
    saveDatabase(initialDatabase);
    return initialDatabase;
  }

  try {
    const parsedDatabase = JSON.parse(rawDatabase);
    return {
      users: Array.isArray(parsedDatabase.users) ? parsedDatabase.users : [],
    };
  } catch {
    const fallbackDatabase = createInitialDatabase();
    saveDatabase(fallbackDatabase);
    return fallbackDatabase;
  }
}

function saveDatabase(database) {
  const normalizedDatabase = {
    users: Array.isArray(database.users) ? database.users : [],
  };

  if (!canUseLocalStorage()) {
    inMemoryDatabase = cloneValue(normalizedDatabase);
    return;
  }

  window.localStorage.setItem(
    DATABASE_STORAGE_KEY,
    JSON.stringify(normalizedDatabase),
  );
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function createUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createWorkoutHistoryId() {
  return `workout_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapPublicUser(user) {
  if (!user) {
    return null;
  }

  const { password: _password, ...publicUser } = user;
  return cloneValue(publicUser);
}

function findUserByName(name) {
  const database = loadDatabase();
  const normalizedName = normalizeName(name);

  return (
    database.users.find((item) => normalizeName(item.name) === normalizedName) ??
    null
  );
}

export const mockUserStorage = {
  async getById(userId) {
    const database = loadDatabase();
    const user = database.users.find((item) => item.id === userId);

    return mapPublicUser(user);
  },

  async login({ name, password }) {
    const user = findUserByName(name);

    if (!user || user.password !== password) {
      return null;
    }

    return mapPublicUser(user);
  },

  async register({ name, password }) {
    const database = loadDatabase();
    const existingUser = findUserByName(name);

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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async updateProfile(userId, { name, email, password, profilePhoto }) {
    const database = loadDatabase();
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
          normalizeName(item.name) === normalizeName(trimmedName),
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async updateTrainingResult(userId, { score, trainingLevel }) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
    const nextUser = {
      ...currentUser,
      trainingLevel,
      lastTestScore: score,
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async saveTrainingPlan(userId, { workoutsPerWeek, focusKey, sessionSelections }) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
    const trainingPlan = buildTrainingPlan({
      workoutsPerWeek,
      focusKey,
      trainingLevel: currentUser.trainingLevel,
      sessionSelections,
    });
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async scheduleWorkout(userId, { date, time }) {
    const database = loadDatabase();
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async cancelWorkout(userId, scheduledWorkoutId) {
    const database = loadDatabase();
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async completeWorkout(userId, scheduledWorkoutId, completionPayload) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

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
      durationSeconds: completionPayload.durationSeconds ?? 0,
      completedExercisesCount: completionPayload.completedExercisesCount ?? 0,
      completedSetsCount: completionPayload.completedSetsCount ?? 0,
      metrics: {
        weightKg: completionPayload.weightKg ?? null,
        burnedCalories: completionPayload.burnedCalories ?? null,
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },
};
