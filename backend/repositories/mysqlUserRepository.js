import { randomUUID } from "node:crypto";
import { getMySqlPool } from "../db/mysqlPool.js";
import {
  cancelWorkout as removeScheduledWorkout,
  rebalanceScheduledWorkouts,
  scheduleWorkout as addScheduledWorkout,
} from "../shared/workoutSchedule.js";
import {
  normalizeTrainingPlanAdaptationHistory,
} from "../services/trainingPlanAdaptationHistory.js";
import { createWorkoutHistoryEntry } from "../services/workoutHistory.js";

function parseJsonField(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapPublicUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    login: row.login ?? row.name,
    name: row.name,
    email: row.email,
    profilePhoto: row.profile_photo,
    trainingLevel: row.training_level,
    lastTestScore: row.last_test_score,
    trainingPlan: parseJsonField(row.training_plan_json),
    trainingPlanAdaptationHistory:
      parseJsonField(row.training_plan_adaptation_history_json) ?? [],
    scheduledWorkouts: parseJsonField(row.scheduled_workouts_json) ?? [],
    workoutHistory: parseJsonField(row.workout_history_json) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createWorkoutHistoryId() {
  return `workout_history_${randomUUID()}`;
}

async function findUserRowById(userId) {
  const pool = getMySqlPool();
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  return rows[0] ?? null;
}

async function findUserRowByLogin(login) {
  const pool = getMySqlPool();
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE LOWER(COALESCE(login, name)) = LOWER(?) LIMIT 1",
    [login.trim()],
  );

  return rows[0] ?? null;
}

async function findUserRowByName(name) {
  const pool = getMySqlPool();
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [name.trim()],
  );

  return rows[0] ?? null;
}

export const mysqlUserRepository = {
  async getById(userId) {
    const userRow = await findUserRowById(userId);
    return mapPublicUser(userRow);
  },

  async login({ login, password }) {
    const userRow = await findUserRowByLogin(login);

    if (!userRow || userRow.password !== password) {
      return null;
    }

    return mapPublicUser(userRow);
  },

  async register({ login, password }) {
    const trimmedLogin = String(login).trim();
    const existingUser = await findUserRowByLogin(trimmedLogin);

    if (existingUser) {
      throw new Error("Пользователь с таким логином уже существует.");
    }

    const pool = getMySqlPool();
    const userId = `user_${randomUUID()}`;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        INSERT INTO users (
          id,
          login,
          name,
          password,
          email,
          profile_photo,
          training_level,
          last_test_score,
          training_plan_json,
          training_plan_adaptation_history_json,
          scheduled_workouts_json,
          workout_history_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        trimmedLogin,
        trimmedLogin,
        password,
        null,
        null,
        "Не определен",
        null,
        null,
        JSON.stringify([]),
        null,
        null,
        timestamp,
        timestamp,
      ],
    );

    return this.getById(userId);
  },

  async updateProfile(userId, { name, email, password, profilePhoto }) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
      return null;
    }

    const trimmedName = String(name ?? currentUserRow.name).trim();

    if (trimmedName && trimmedName.toLowerCase() !== currentUserRow.name.toLowerCase()) {
      const existingUser = await findUserRowByName(trimmedName);

      if (existingUser && existingUser.id !== userId) {
        throw new Error("Пользователь с таким именем уже существует.");
      }
    }

    const pool = getMySqlPool();
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        UPDATE users
        SET name = ?, email = ?, password = ?, profile_photo = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        trimmedName || currentUserRow.name,
        String(email ?? "").trim() || null,
        String(password ?? "").trim() || currentUserRow.password,
        profilePhoto || currentUserRow.profile_photo || null,
        timestamp,
        userId,
      ],
    );

    return this.getById(userId);
  },

  async updateTrainingResult(userId, { score, trainingLevel }) {
    const pool = getMySqlPool();
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        UPDATE users
        SET training_level = ?, last_test_score = ?, updated_at = ?
        WHERE id = ?
      `,
      [trainingLevel, score, timestamp, userId],
    );

    return this.getById(userId);
  },

  async saveTrainingPlan(userId, trainingPlan, adaptationEvent = null) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
      return null;
    }

    const pool = getMySqlPool();
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const currentAdaptationHistory = normalizeTrainingPlanAdaptationHistory(
      parseJsonField(currentUserRow.training_plan_adaptation_history_json) ?? [],
    );
    const nextAdaptationHistory = adaptationEvent
      ? normalizeTrainingPlanAdaptationHistory([
          ...currentAdaptationHistory,
          adaptationEvent,
        ])
      : currentAdaptationHistory;
    const rebalancedWorkouts = rebalanceScheduledWorkouts({
      scheduledWorkouts:
        parseJsonField(currentUserRow.scheduled_workouts_json) ?? [],
      trainingPlan,
    });

    await pool.execute(
      `
        UPDATE users
        SET training_plan_json = ?, training_plan_adaptation_history_json = ?, scheduled_workouts_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        JSON.stringify(trainingPlan),
        JSON.stringify(nextAdaptationHistory),
        JSON.stringify(rebalancedWorkouts),
        timestamp,
        userId,
      ],
    );

    return this.getById(userId);
  },

  async scheduleWorkout(userId, { date, time }) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
      return null;
    }

    const scheduledWorkouts = addScheduledWorkout({
      scheduledWorkouts:
        parseJsonField(currentUserRow.scheduled_workouts_json) ?? [],
      trainingPlan: parseJsonField(currentUserRow.training_plan_json),
      date,
      time,
    });
    const pool = getMySqlPool();
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        UPDATE users
        SET scheduled_workouts_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [JSON.stringify(scheduledWorkouts), timestamp, userId],
    );

    return this.getById(userId);
  },

  async cancelWorkout(userId, scheduledWorkoutId) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
      return null;
    }

    const currentTrainingPlan = parseJsonField(currentUserRow.training_plan_json);
    const currentScheduledWorkouts =
      parseJsonField(currentUserRow.scheduled_workouts_json) ?? [];
    const scheduledWorkout = currentScheduledWorkouts.find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("РўСЂРµРЅРёСЂРѕРІРєР° РЅРµ РЅР°Р№РґРµРЅР° РІ РєР°Р»РµРЅРґР°СЂРµ.");
    }

    const scheduledWorkouts = removeScheduledWorkout({
      scheduledWorkouts: currentScheduledWorkouts,
      trainingPlan: currentTrainingPlan,
      scheduledWorkoutId,
    });
    const canceledAt = new Date().toISOString();
    const nextWorkoutHistoryEntry = createWorkoutHistoryEntry({
      scheduledWorkout,
      completionPayload: {
        status: "canceled",
        plannedDurationSeconds:
          (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      },
      trainingPlan: currentTrainingPlan,
      historyEntryId: createWorkoutHistoryId(),
      completedAt: canceledAt,
    });
    const nextWorkoutHistory = [
      ...(parseJsonField(currentUserRow.workout_history_json) ?? []),
      nextWorkoutHistoryEntry,
    ];
    const pool = getMySqlPool();
    const timestamp = canceledAt.slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        UPDATE users
        SET scheduled_workouts_json = ?, workout_history_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        JSON.stringify(scheduledWorkouts),
        JSON.stringify(nextWorkoutHistory),
        timestamp,
        userId,
      ],
    );

    return this.getById(userId);
  },

  async skipWorkout(userId, scheduledWorkoutId) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
      return null;
    }

    const currentTrainingPlan = parseJsonField(currentUserRow.training_plan_json);
    const currentScheduledWorkouts =
      parseJsonField(currentUserRow.scheduled_workouts_json) ?? [];
    const scheduledWorkout = currentScheduledWorkouts.find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("РўСЂРµРЅРёСЂРѕРІРєР° РЅРµ РЅР°Р№РґРµРЅР° РІ РєР°Р»РµРЅРґР°СЂРµ.");
    }

    const scheduledWorkouts = removeScheduledWorkout({
      scheduledWorkouts: currentScheduledWorkouts,
      trainingPlan: currentTrainingPlan,
      scheduledWorkoutId,
    });
    const skippedAt = new Date().toISOString();
    const nextWorkoutHistoryEntry = createWorkoutHistoryEntry({
      scheduledWorkout,
      completionPayload: {
        status: "skipped",
        plannedDurationSeconds:
          (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      },
      trainingPlan: currentTrainingPlan,
      historyEntryId: createWorkoutHistoryId(),
      completedAt: skippedAt,
    });
    const nextWorkoutHistory = [
      ...(parseJsonField(currentUserRow.workout_history_json) ?? []),
      nextWorkoutHistoryEntry,
    ];
    const pool = getMySqlPool();
    const timestamp = skippedAt.slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        UPDATE users
        SET scheduled_workouts_json = ?, workout_history_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        JSON.stringify(scheduledWorkouts),
        JSON.stringify(nextWorkoutHistory),
        timestamp,
        userId,
      ],
    );

    return this.getById(userId);
  },

  async completeWorkout(userId, completionPayload) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
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
    const scheduledWorkouts =
      parseJsonField(currentUserRow.scheduled_workouts_json) ?? [];
    const scheduledWorkout = scheduledWorkouts.find(
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
      trainingPlan: parseJsonField(currentUserRow.training_plan_json),
      historyEntryId: createWorkoutHistoryId(),
      completedAt,
    });
    const nextScheduledWorkouts = scheduledWorkouts.map((item) =>
      item.id === scheduledWorkoutId
        ? {
            ...item,
            status: nextWorkoutHistoryEntry.status,
            completedAt,
            result: nextWorkoutHistoryEntry,
          }
        : item,
    );
    const nextWorkoutHistory = [
      ...(parseJsonField(currentUserRow.workout_history_json) ?? []),
      nextWorkoutHistoryEntry,
    ];
    const pool = getMySqlPool();
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        UPDATE users
        SET scheduled_workouts_json = ?, workout_history_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        JSON.stringify(nextScheduledWorkouts),
        JSON.stringify(nextWorkoutHistory),
        timestamp,
        userId,
      ],
    );

    return this.getById(userId);
  },
};
