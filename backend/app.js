import express from "express";
import { buildTrainingPlan } from "./shared/trainingPlanBuilder.js";
import { DEFAULT_WORKOUT_TIME } from "./shared/workoutSchedule.js";

export function createServerApp({ userRepository, databaseProvider }) {
  const app = express();

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_, response) => {
    response.json({ ok: true, databaseProvider });
  });

  app.get("/api/users/:id", async (request, response) => {
    const user = await userRepository.getById(request.params.id);

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    response.json({ user });
  });

  app.post("/api/auth/login", async (request, response) => {
    const { name = "", password = "" } = request.body ?? {};

    if (!String(name).trim() || !String(password).trim()) {
      response.status(400).json({ message: "Name and password are required." });
      return;
    }

    const user = await userRepository.login({
      name: String(name),
      password: String(password),
    });

    if (!user) {
      response.status(401).json({ message: "Неверное имя или пароль." });
      return;
    }

    response.json({ user });
  });

  app.post("/api/auth/register", async (request, response) => {
    const { name = "", password = "" } = request.body ?? {};

    if (!String(name).trim() || !String(password).trim()) {
      response.status(400).json({ message: "Name and password are required." });
      return;
    }

    try {
      const user = await userRepository.register({
        name: String(name),
        password: String(password),
      });

      response.status(201).json({ user });
    } catch (error) {
      response.status(409).json({
        message:
          error instanceof Error ? error.message : "Registration failed.",
      });
    }
  });

  app.patch("/api/users/:id/profile", async (request, response) => {
    const {
      name = "",
      email = "",
      password = "",
      profilePhoto = null,
    } = request.body ?? {};

    if (!String(name).trim()) {
      response.status(400).json({ message: "Name is required." });
      return;
    }

    try {
      const user = await userRepository.updateProfile(request.params.id, {
        name: String(name),
        email: String(email),
        password: String(password),
        profilePhoto,
      });

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      response.json({ user });
    } catch (error) {
      response.status(409).json({
        message:
          error instanceof Error ? error.message : "Profile update failed.",
      });
    }
  });

  app.patch("/api/users/:id/training-result", async (request, response) => {
    const { score, trainingLevel } = request.body ?? {};

    if (typeof score !== "number" || typeof trainingLevel !== "string") {
      response.status(400).json({
        message: "Score and trainingLevel are required.",
      });
      return;
    }

    const user = await userRepository.updateTrainingResult(request.params.id, {
      score,
      trainingLevel,
    });

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    response.json({ user });
  });

  app.put("/api/users/:id/training-plan", async (request, response) => {
    const {
      workoutsPerWeek,
      focusKey,
      sessionSelections = [],
    } = request.body ?? {};

    if (
      typeof workoutsPerWeek !== "number" ||
      !Number.isInteger(workoutsPerWeek) ||
      typeof focusKey !== "string" ||
      !focusKey.trim()
    ) {
      response.status(400).json({
        message: "workoutsPerWeek and focusKey are required.",
      });
      return;
    }

    const user = await userRepository.getById(request.params.id);

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    const trainingPlan = buildTrainingPlan({
      workoutsPerWeek,
      focusKey,
      trainingLevel: user.trainingLevel,
      sessionSelections,
    });
    const updatedUser = await userRepository.saveTrainingPlan(
      request.params.id,
      trainingPlan,
    );

    if (!updatedUser) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    response.status(201).json({ user: updatedUser, trainingPlan });
  });

  app.post("/api/users/:id/scheduled-workouts", async (request, response) => {
    const { date, time = DEFAULT_WORKOUT_TIME } = request.body ?? {};

    if (!String(date).trim()) {
      response.status(400).json({ message: "date is required." });
      return;
    }

    try {
      const user = await userRepository.scheduleWorkout(request.params.id, {
        date: String(date),
        time: String(time),
      });

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      response.status(201).json({ user });
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Schedule failed.",
      });
    }
  });

  app.delete(
    "/api/users/:id/scheduled-workouts/:scheduledWorkoutId",
    async (request, response) => {
      try {
        const user = await userRepository.cancelWorkout(
          request.params.id,
          request.params.scheduledWorkoutId,
        );

        if (!user) {
          response.status(404).json({ message: "User not found." });
          return;
        }

        response.json({ user });
      } catch (error) {
        response.status(400).json({
          message: error instanceof Error ? error.message : "Cancel failed.",
        });
      }
    },
  );

  app.post(
    "/api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete",
    async (request, response) => {
      const {
        durationSeconds = 0,
        completedExercisesCount = 0,
        completedSetsCount = 0,
        weightKg = null,
        burnedCalories = null,
      } = request.body ?? {};

      try {
        const user = await userRepository.completeWorkout(request.params.id, {
          scheduledWorkoutId: request.params.scheduledWorkoutId,
          durationSeconds: Number(durationSeconds) || 0,
          completedExercisesCount: Number(completedExercisesCount) || 0,
          completedSetsCount: Number(completedSetsCount) || 0,
          weightKg:
            weightKg == null || weightKg === ""
              ? null
              : Number(weightKg) || null,
          burnedCalories:
            burnedCalories == null || burnedCalories === ""
              ? null
              : Number(burnedCalories) || null,
        });

        if (!user) {
          response.status(404).json({ message: "User not found." });
          return;
        }

        response.json({ user });
      } catch (error) {
        response.status(400).json({
          message: error instanceof Error ? error.message : "Complete failed.",
        });
      }
    },
  );

  app.use((error, request, response, next) => {
    void request;
    void next;
    response.status(500).json({
      message:
        error instanceof Error ? error.message : "Unexpected server error.",
    });
  });

  return app;
}
