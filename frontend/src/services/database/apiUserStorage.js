import { DATABASE_CONFIG } from "./databaseConfig";

async function requestJson(endpoint, options = {}) {
  const response = await fetch(`${DATABASE_CONFIG.apiBaseUrl}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message ?? "Database request failed.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const apiUserStorage = {
  async getById(userId) {
    try {
      const payload = await requestJson(`/users/${encodeURIComponent(userId)}`);
      return payload.user ?? null;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async login({ name, password }) {
    const payload = await requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    });

    return payload.user ?? null;
  },

  async register({ name, password }) {
    const payload = await requestJson("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    });

    return payload.user ?? null;
  },

  async updateProfile(userId, profilePayload) {
    const payload = await requestJson(`/users/${encodeURIComponent(userId)}/profile`, {
      method: "PATCH",
      body: JSON.stringify(profilePayload),
    });

    return payload.user ?? null;
  },

  async updateTrainingResult(userId, { score, trainingLevel }) {
    try {
      const payload = await requestJson(
        `/users/${encodeURIComponent(userId)}/training-result`,
        {
          method: "PATCH",
          body: JSON.stringify({ score, trainingLevel }),
        },
      );

      return payload.user ?? null;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async saveTrainingPlan(userId, trainingPlanPayload) {
    const payload = await requestJson(
      `/users/${encodeURIComponent(userId)}/training-plan`,
      {
        method: "PUT",
        body: JSON.stringify(trainingPlanPayload),
      },
    );

    return payload.user ?? null;
  },

  async scheduleWorkout(userId, workoutPayload) {
    const payload = await requestJson(
      `/users/${encodeURIComponent(userId)}/scheduled-workouts`,
      {
        method: "POST",
        body: JSON.stringify(workoutPayload),
      },
    );

    return payload.user ?? null;
  },

  async cancelWorkout(userId, scheduledWorkoutId) {
    const payload = await requestJson(
      `/users/${encodeURIComponent(userId)}/scheduled-workouts/${encodeURIComponent(scheduledWorkoutId)}`,
      {
        method: "DELETE",
      },
    );

    return payload.user ?? null;
  },

  async completeWorkout(userId, scheduledWorkoutId, completionPayload) {
    const payload = await requestJson(
      `/users/${encodeURIComponent(userId)}/scheduled-workouts/${encodeURIComponent(scheduledWorkoutId)}/complete`,
      {
        method: "POST",
        body: JSON.stringify(completionPayload),
      },
    );

    return payload.user ?? null;
  },
};
