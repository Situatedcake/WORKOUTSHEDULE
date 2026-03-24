import { randomUUID } from "node:crypto";
import { getMySqlPool } from "../db/mysqlPool.js";
import {
  cancelWorkout as removeScheduledWorkout,
  rebalanceScheduledWorkouts,
  scheduleWorkout as addScheduledWorkout,
} from "../../src/shared/workoutSchedule.js";

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
    name: row.name,
    email: row.email,
    profilePhoto: row.profile_photo,
    trainingLevel: row.training_level,
    lastTestScore: row.last_test_score,
    trainingPlan: parseJsonField(row.training_plan_json),
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

  async login({ name, password }) {
    const userRow = await findUserRowByName(name);

    if (!userRow || userRow.password !== password) {
      return null;
    }

    return mapPublicUser(userRow);
  },

  async register({ name, password }) {
    const existingUser = await findUserRowByName(name);

    if (existingUser) {
      throw new Error("Пользователь с таким именем уже существует.");
    }

    const pool = getMySqlPool();
    const userId = `user_${randomUUID()}`;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      `
        INSERT INTO users (
          id,
          name,
          password,
          email,
          profile_photo,
          training_level,
          last_test_score,
          training_plan_json,
          scheduled_workouts_json,
          workout_history_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name.trim(),
        password,
        null,
        null,
        "Не определен",
        null,
        null,
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

  async saveTrainingPlan(userId, trainingPlan) {
    const currentUserRow = await findUserRowById(userId);

    if (!currentUserRow) {
      return null;
    }

    const pool = getMySqlPool();
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const rebalancedWorkouts = rebalanceScheduledWorkouts({
      scheduledWorkouts: parseJsonField(currentUserRow.scheduled_workouts_json) ?? [],
      trainingPlan,
    });

    await pool.execute(
      `
        UPDATE users
        SET training_plan_json = ?, scheduled_workouts_json = ?, updated_at = ?
        WHERE id = ?
      `,
      [
        JSON.stringify(trainingPlan),
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
      scheduledWorkouts: parseJsonField(currentUserRow.scheduled_workouts_json) ?? [],
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

    const scheduledWorkouts = removeScheduledWorkout({
      scheduledWorkouts: parseJsonField(currentUserRow.scheduled_workouts_json) ?? [],
      trainingPlan: parseJsonField(currentUserRow.training_plan_json),
      scheduledWorkoutId,
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
      weightKg = null,
      burnedCalories = null,
    } = completionPayload;
    const scheduledWorkouts = parseJsonField(currentUserRow.scheduled_workouts_json) ?? [];
    const scheduledWorkout = scheduledWorkouts.find(
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
    const nextScheduledWorkouts = scheduledWorkouts.map((item) =>
      item.id === scheduledWorkoutId
        ? {
            ...item,
            status: "completed",
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
