import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getMySqlPool } from "./db/mysqlPool.js";
import { exerciseCatalog } from "./data/exerciseCatalog.js";
import { buildUserProfile } from "./modules/userProfile.js";
import {
  evaluateTrainingLevel,
  validateTrainingLevelPayload,
} from "./services/trainingLevelEvaluator.js";
import {
  isProductiveWorkoutStatus,
  normalizeWorkoutHistory,
} from "./services/workoutHistory.js";
import { createTrainingPlanAdaptationEvent } from "./services/trainingPlanAdaptationHistory.js";
import { buildTrainingFeatures } from "./services/trainingFeatureBuilder.js";
import { normalizeTrainingMlFeedbackHistory } from "./services/trainingMlFeedback.js";
import { buildWorkoutStatsPayload } from "./services/workoutStats.js";
import { generateWorkoutAdvanced } from "./services/workoutGenerator.js";
import { generateSmartTrainingPlan } from "./services/smartTrainingPlan.js";
import { buildTrainingPlan } from "./shared/trainingPlanBuilder.js";
import { DEFAULT_WORKOUT_TIME } from "./shared/workoutSchedule.js";

const currentFilePath = fileURLToPath(import.meta.url);
const backendDir = path.dirname(currentFilePath);
const frontendDistDir = path.resolve(backendDir, "../frontend/dist");
const frontendIndexPath = path.join(frontendDistDir, "index.html");
const AUTO_REFRESH_WORKOUT_THRESHOLD = 4;

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatsPeriodDays(rawRange) {
  if (rawRange === "7") {
    return 7;
  }

  if (rawRange === "30") {
    return 30;
  }

  return null;
}

async function getSmartWorkoutExercises(databaseProvider) {
  if (databaseProvider !== "mysql") {
    return exerciseCatalog;
  }

  try {
    const pool = getMySqlPool();
    const [rows] = await pool.query("SELECT * FROM exercises");

    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
  } catch {
    return exerciseCatalog;
  }

  return exerciseCatalog;
}

function buildHighlightedExercisesFromPlan(trainingPlan) {
  return (trainingPlan?.sessions ?? [])
    .flatMap((session) => session.exercises ?? [])
    .slice(0, 8);
}

function hasUsableTrainingPlan(trainingPlan) {
  return Boolean(
    trainingPlan &&
      Array.isArray(trainingPlan.sessions) &&
      trainingPlan.sessions.length > 0,
  );
}

function resolveTrainingMlFeedbackEvents(rawEvents) {
  return normalizeTrainingMlFeedbackHistory(
    Array.isArray(rawEvents) ? rawEvents : [],
  );
}

function buildTrainingFeatureSnapshot(trainingFeatures) {
  return {
    readinessScore: trainingFeatures.readiness.readinessScore,
    skipRate: trainingFeatures.history.skipRate,
    partialRate: trainingFeatures.history.partialRate,
    averageSleepQuality: trainingFeatures.recovery.averageSleepQuality,
    averageEnergyLevel: trainingFeatures.recovery.averageEnergyLevel,
    averageEffortLevel: trainingFeatures.recovery.averageEffortLevel,
    recentBehaviorLoad: trainingFeatures.feedback.recentBehaviorLoad,
  };
}

function getCompletedWorkoutCount(user) {
  return normalizeWorkoutHistory(user?.workoutHistory).filter((workout) =>
    isProductiveWorkoutStatus(workout.status),
  ).length;
}

function getTrainingPlanRefreshBaseline(trainingPlan) {
  const refreshCount = Number(trainingPlan?.adaptiveMetadata?.lastAutoRefreshCompletedCount);

  return Number.isFinite(refreshCount) ? refreshCount : 0;
}

function buildAdaptiveProfileFromUser(user) {
  const workoutsPerWeek = Number(user?.trainingPlan?.workoutsPerWeek) || 3;
  const estimatedMinutesPerWeek = Number(user?.trainingPlan?.estimatedMinutesPerWeek) || 0;
  const averageSessionMinutes =
    estimatedMinutesPerWeek > 0
      ? Math.max(Math.round(estimatedMinutesPerWeek / workoutsPerWeek), 30)
      : 45;

  return buildUserProfile({
    trainingLevel: user?.trainingLevel,
    gender: user?.gender,
    focusKey: user?.trainingPlan?.focusKey,
    workoutsPerWeek,
    time: averageSessionMinutes,
  });
}

function enrichTrainingPlanVersion(previousPlan, nextPlan, trigger = "manual_builder") {
  const now = new Date().toISOString();
  const previousVersion = Number(previousPlan?.version);
  const nextVersion = Number.isFinite(previousVersion) ? previousVersion + 1 : 1;
  const sourcePlanCreatedAt =
    typeof previousPlan?.createdAt === "string" && previousPlan.createdAt
      ? previousPlan.createdAt
      : now;

  return {
    ...nextPlan,
    version: nextVersion,
    createdAt:
      typeof nextPlan?.createdAt === "string" && nextPlan.createdAt
        ? nextPlan.createdAt
        : sourcePlanCreatedAt,
    updatedAt: now,
    previousPlanId: previousPlan?.id ?? null,
    adaptiveMetadata: {
      ...(nextPlan?.adaptiveMetadata ?? {}),
      versionTrigger: trigger,
    },
  };
}

async function maybeRefreshTrainingPlanAfterWorkout({
  user,
  userRepository,
  databaseProvider,
}) {
  if (!user?.trainingPlan?.sessions?.length) {
    return {
      user,
      trainingPlanRefreshed: false,
      adaptationSummary: [],
    };
  }

  const completedWorkoutCount = getCompletedWorkoutCount(user);
  const refreshBaseline = getTrainingPlanRefreshBaseline(user.trainingPlan);

  if (
    completedWorkoutCount < AUTO_REFRESH_WORKOUT_THRESHOLD ||
    completedWorkoutCount - refreshBaseline < AUTO_REFRESH_WORKOUT_THRESHOLD
  ) {
    return {
      user,
      trainingPlanRefreshed: false,
      adaptationSummary: [],
    };
  }

  try {
    const exercises = await getSmartWorkoutExercises(databaseProvider);
    const profile = buildAdaptiveProfileFromUser(user);
    const result = generateSmartTrainingPlan({
      exercises,
      user: profile,
      workoutHistory: user.workoutHistory ?? [],
      trainingMlFeedbackHistory: user.trainingMlFeedbackHistory ?? [],
      focusKey: user.trainingPlan.focusKey,
      workoutsPerWeek: user.trainingPlan.workoutsPerWeek,
    });
    const refreshedTrainingPlan = enrichTrainingPlanVersion(
      user.trainingPlan,
      {
        ...result.trainingPlan,
        adaptiveMetadata: {
          ...(result.trainingPlan.adaptiveMetadata ?? {}),
          autoUpdated: true,
          autoRefreshThreshold: AUTO_REFRESH_WORKOUT_THRESHOLD,
          previousPlanId: user.trainingPlan.id ?? null,
          lastAutoRefreshCompletedCount: completedWorkoutCount,
          refreshedAt: new Date().toISOString(),
        },
      },
      "auto_refresh",
    );
    const adaptationEvent = createTrainingPlanAdaptationEvent({
      previousPlan: user.trainingPlan,
      nextPlan: refreshedTrainingPlan,
      trigger: "auto_refresh",
      adaptationSummary: result.adaptationSummary,
    });
    const refreshedUser = await userRepository.saveTrainingPlan(
      user.id,
      refreshedTrainingPlan,
      adaptationEvent,
    );

    return {
      user: refreshedUser ?? user,
      trainingPlanRefreshed: Boolean(refreshedUser),
      adaptationSummary: result.adaptationSummary,
    };
  } catch {
    return {
      user,
      trainingPlanRefreshed: false,
      adaptationSummary: [],
    };
  }
}

function configureFrontendHosting(app) {
  if (!existsSync(frontendIndexPath)) {
    return;
  }

  app.use(express.static(frontendDistDir));

  app.get(/^(?!\/api(?:\/|$)).*/, (_, response) => {
    response.sendFile(frontendIndexPath);
  });
}

export function createServerApp({ userRepository, databaseProvider }) {
  const app = express();

  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_, response) => {
    response.json({ ok: true, databaseProvider });
  });

  app.get("/api/exercises", async (_, response) => {
    try {
      const exercises = await getSmartWorkoutExercises(databaseProvider);

      response.json({
        exercises: Array.isArray(exercises) ? exercises : [],
        total: Array.isArray(exercises) ? exercises.length : 0,
        source: databaseProvider === "mysql" ? "mysql-or-fallback" : "catalog",
      });
    } catch (error) {
      response.status(500).json({
        message:
          error instanceof Error ? error.message : "Exercise catalog failed.",
      });
    }
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
    const { login = "", password = "" } = request.body ?? {};

    if (!String(login).trim() || !String(password).trim()) {
      response
        .status(400)
        .json({ message: "Login and password are required." });
      return;
    }

    const user = await userRepository.login({
      login: String(login),
      password: String(password),
    });

    if (!user) {
      response.status(401).json({ message: "Неверный логин или пароль." });
      return;
    }

    response.json({ user });
  });

  app.post("/api/auth/register", async (request, response) => {
    const { login = "", password = "" } = request.body ?? {};

    if (!String(login).trim() || !String(password).trim()) {
      response
        .status(400)
        .json({ message: "Login and password are required." });
      return;
    }

    try {
      const user = await userRepository.register({
        login: String(login),
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
      gender = "not_specified",
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
        gender: String(gender),
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

  app.post("/api/users/:id/training-feedback", async (request, response) => {
    const feedbackEvents = resolveTrainingMlFeedbackEvents(request.body?.events);

    if (feedbackEvents.length === 0) {
      const user = await userRepository.getById(request.params.id);

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      response.json({ user, savedEventsCount: 0 });
      return;
    }

    const user = await userRepository.appendTrainingMlFeedback(
      request.params.id,
      feedbackEvents,
    );

    if (!user) {
      response.status(404).json({ message: "User not found." });
      return;
    }

    response.status(201).json({ user, savedEventsCount: feedbackEvents.length });
  });

  app.post(
    "/api/users/:id/evaluate-training-level",
    async (request, response) => {
      const validationResult = validateTrainingLevelPayload(request.body ?? {});

      if (!validationResult.ok) {
        response.status(400).json({
          message: validationResult.message,
        });
        return;
      }

      const existingUser = await userRepository.getById(request.params.id);

      if (!existingUser) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      const evaluation = evaluateTrainingLevel(validationResult.testPayload);
      let user = await userRepository.updateTrainingResult(
        request.params.id,
        evaluation,
      );

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      const {
        focusKey = "",
        sessionSelections = [],
      } = request.body ?? {};
      let trainingPlan = null;

      if (typeof focusKey === "string" && focusKey.trim()) {
        trainingPlan = enrichTrainingPlanVersion(
          existingUser.trainingPlan,
          buildTrainingPlan({
            workoutsPerWeek: validationResult.testPayload.workoutsPerWeek,
            focusKey: focusKey.trim(),
            trainingLevel: evaluation.trainingLevel,
            sessionSelections: Array.isArray(sessionSelections)
              ? sessionSelections
              : [],
          }),
          "post_test",
        );

        user = await userRepository.saveTrainingPlan(
          request.params.id,
          trainingPlan,
          createTrainingPlanAdaptationEvent({
            previousPlan: existingUser.trainingPlan,
            nextPlan: trainingPlan,
            trigger: "post_test",
          }),
        );

        if (!user) {
          response.status(404).json({ message: "User not found." });
          return;
        }
      }

      response.json({
        evaluation,
        trainingPlan,
        user,
      });
    },
  );

  app.put("/api/users/:id/training-plan", async (request, response) => {
    const {
      workoutsPerWeek,
      focusKey,
      sessionSelections = [],
      trainingPlan: prebuiltTrainingPlan = null,
      mlFeedbackEvents: rawMlFeedbackEvents = [],
    } =
      request.body ?? {};

    if (
      !prebuiltTrainingPlan &&
      (
        typeof workoutsPerWeek !== "number" ||
        !Number.isInteger(workoutsPerWeek) ||
        typeof focusKey !== "string" ||
        !focusKey.trim()
      )
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

    const trainingPlan =
      prebuiltTrainingPlan &&
      typeof prebuiltTrainingPlan === "object" &&
      Array.isArray(prebuiltTrainingPlan.sessions)
        ? enrichTrainingPlanVersion(user.trainingPlan, prebuiltTrainingPlan, "manual_update")
        : enrichTrainingPlanVersion(user.trainingPlan, buildTrainingPlan({
            workoutsPerWeek,
            focusKey,
            trainingLevel: user.trainingLevel,
            sessionSelections,
          }), "manual_builder");
    const mlFeedbackEvents = resolveTrainingMlFeedbackEvents(rawMlFeedbackEvents);
    const adaptationEvent = createTrainingPlanAdaptationEvent({
      previousPlan: user.trainingPlan,
      nextPlan: trainingPlan,
      trigger:
        prebuiltTrainingPlan &&
        typeof prebuiltTrainingPlan === "object" &&
        Array.isArray(prebuiltTrainingPlan.sessions)
          ? "manual_update"
          : "manual_builder",
    });
    const updatedUser = await userRepository.saveTrainingPlan(
      request.params.id,
      trainingPlan,
      adaptationEvent,
      mlFeedbackEvents,
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
    "/api/users/:id/scheduled-workouts/:scheduledWorkoutId/skip",
    async (request, response) => {
      try {
        const user = await userRepository.skipWorkout(
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
          message: error instanceof Error ? error.message : "Skip failed.",
        });
      }
    },
  );

  app.post(
    "/api/users/:id/scheduled-workouts/:scheduledWorkoutId/complete",
    async (request, response) => {
      const {
        durationSeconds = 0,
        plannedDurationSeconds = 0,
        startedAt = null,
        status = "completed",
        completedExercisesCount = 0,
        completedSetsCount = 0,
        exerciseSetWeights = [],
        weightKg = null,
        burnedCalories = null,
        energyLevel = null,
        effortLevel = null,
        sleepQuality = null,
      } = request.body ?? {};

      try {
        const completedUser = await userRepository.completeWorkout(request.params.id, {
          scheduledWorkoutId: request.params.scheduledWorkoutId,
          durationSeconds: Number(durationSeconds) || 0,
          plannedDurationSeconds: Number(plannedDurationSeconds) || 0,
          startedAt:
            typeof startedAt === "string" && startedAt.trim() ? startedAt : null,
          status:
            typeof status === "string" && status.trim() ? status.trim() : "completed",
          completedExercisesCount: Number(completedExercisesCount) || 0,
          completedSetsCount: Number(completedSetsCount) || 0,
          exerciseSetWeights: Array.isArray(exerciseSetWeights)
            ? exerciseSetWeights
            : [],
          weightKg:
            weightKg == null || weightKg === ""
              ? null
              : Number(weightKg) || null,
          burnedCalories:
            burnedCalories == null || burnedCalories === ""
              ? null
              : Number(burnedCalories) || null,
          energyLevel:
            energyLevel == null || energyLevel === ""
              ? null
              : Number(energyLevel) || null,
          effortLevel:
            effortLevel == null || effortLevel === ""
              ? null
              : Number(effortLevel) || null,
          sleepQuality:
            sleepQuality == null || sleepQuality === ""
              ? null
              : Number(sleepQuality) || null,
        });

        if (!completedUser) {
          response.status(404).json({ message: "User not found." });
          return;
        }

        const {
          user,
          trainingPlanRefreshed,
          adaptationSummary,
        } = await maybeRefreshTrainingPlanAfterWorkout({
          user: completedUser,
          userRepository,
          databaseProvider,
        });

        response.json({
          user,
          trainingPlanRefreshed,
          adaptationSummary,
        });
      } catch (error) {
        response.status(400).json({
          message: error instanceof Error ? error.message : "Complete failed.",
        });
      }
    },
  );

  app.get("/api/users/:id/stats", async (request, response) => {
    try {
      const user = await userRepository.getById(request.params.id);
      const periodDays = getStatsPeriodDays(request.query.range);

      if (!user) {
        response.status(404).json({ message: "User not found." });
        return;
      }

      const stats = buildWorkoutStatsPayload({
        workoutHistory: user.workoutHistory ?? [],
        scheduledWorkouts: user.scheduledWorkouts ?? [],
        todayDateKey: formatDateKey(new Date()),
        trainingPlanAdaptationHistory: user.trainingPlanAdaptationHistory ?? [],
        trainingPlan: user.trainingPlan ?? null,
        periodDays,
      });

      response.json({ stats });
    } catch (error) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Stats failed.",
      });
    }
  });

  app.post("/api/workouts/smart", async (request, response) => {
    try {
      const profile = buildUserProfile(request.body);
      const exercises = await getSmartWorkoutExercises(databaseProvider);
      const trainingFeatures = buildTrainingFeatures({
        exercises,
        user: profile,
        workoutHistory: Array.isArray(request.body?.workoutHistory)
          ? request.body.workoutHistory
          : [],
        trainingMlFeedbackHistory: resolveTrainingMlFeedbackEvents(
          request.body?.trainingMlFeedbackHistory,
        ),
      });
      const workout = generateWorkoutAdvanced(exercises, profile, {
        workoutHistory: Array.isArray(request.body?.workoutHistory)
          ? request.body.workoutHistory
          : [],
        trainingFeatures,
      });

      response.json({
        workout,
        featureSnapshot: buildTrainingFeatureSnapshot(trainingFeatures),
        source: databaseProvider === "mysql" ? "mysql-or-fallback" : "catalog",
      });
    } catch (error) {
      response.status(500).json({
        message:
          error instanceof Error ? error.message : "Smart workout failed.",
      });
    }
  });

  app.post("/api/workouts/smart-plan", async (request, response) => {
    const profile = buildUserProfile(request.body);
    const workoutHistory = Array.isArray(request.body?.workoutHistory)
      ? request.body.workoutHistory
      : [];
    const trainingMlFeedbackHistory = resolveTrainingMlFeedbackEvents(
      request.body?.trainingMlFeedbackHistory,
    );

    try {
      const exercises = await getSmartWorkoutExercises(databaseProvider);
      const trainingFeatures = buildTrainingFeatures({
        exercises,
        user: profile,
        workoutHistory,
        trainingMlFeedbackHistory,
      });
      const result = generateSmartTrainingPlan({
        exercises,
        user: profile,
        workoutHistory,
        trainingMlFeedbackHistory,
        trainingFeatures,
        focusKey: profile.focusKey,
        workoutsPerWeek: profile.workoutsPerWeek,
      });

      if (!hasUsableTrainingPlan(result.trainingPlan)) {
        throw new Error("Smart training plan returned an empty plan.");
      }

      response.json({
        ...result,
        featureSnapshot: buildTrainingFeatureSnapshot(trainingFeatures),
        source: databaseProvider === "mysql" ? "mysql-or-fallback" : "catalog",
      });
    } catch (error) {
      console.error("Smart training plan fallback:", error);

      const fallbackTrainingPlan = buildTrainingPlan({
        workoutsPerWeek: profile.workoutsPerWeek,
        focusKey: profile.focusKey,
        trainingLevel: profile.trainingLevel,
        sessionSelections: [],
      });

      response.json({
        trainingPlan: fallbackTrainingPlan,
        adaptationSummary: [
          "Показали базовый план, пока персональная адаптация временно недоступна.",
        ],
        highlightedExercises: buildHighlightedExercisesFromPlan(
          fallbackTrainingPlan,
        ),
        source: "fallback-builder",
        fallbackReason:
          error instanceof Error ? error.message : "Smart training plan failed.",
      });
    }
  });

  app.post("/generate-smart-workout", async (request, response) => {
    try {
      const profile = buildUserProfile(request.body);
      const exercises = await getSmartWorkoutExercises(databaseProvider);
      const workout = generateWorkoutAdvanced(exercises, profile, {
        workoutHistory: Array.isArray(request.body?.workoutHistory)
          ? request.body.workoutHistory
          : [],
      });

      response.json({ workout });
    } catch (error) {
      response.status(500).json({
        error:
          error instanceof Error ? error.message : "Server error",
      });
    }
  });

  configureFrontendHosting(app);

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
