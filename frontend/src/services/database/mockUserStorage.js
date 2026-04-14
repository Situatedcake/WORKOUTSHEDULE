import seedDatabase from "../../data/mockDatabase.json";
import { buildTrainingPlan } from "./mockTrainingPlanBuilder";
import { buildWorkoutStats } from "../../shared/workoutStats";
import { getTrainingLevelByScore } from "../../utils/trainingLevel";
import {
  cancelWorkout as removeScheduledWorkout,
  rebalanceScheduledWorkouts,
  rescheduleWorkout as updateScheduledWorkout,
  scheduleWorkout as addScheduledWorkout,
} from "../../shared/workoutSchedule";

const DATABASE_STORAGE_KEY = "workoutshedule-mock-db";

let inMemoryDatabase = createInitialDatabase();

function normalizeGenderValue(gender) {
  const normalizedGender =
    typeof gender === "string" ? gender.trim().toLowerCase() : "";

  if (normalizedGender === "male" || normalizedGender === "female") {
    return normalizedGender;
  }

  return "not_specified";
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeUserRecord(user) {
  if (!user) {
    return user;
  }

  return {
    ...user,
    login: String(user.login ?? user.name ?? "").trim(),
    name: String(user.name ?? user.login ?? "").trim(),
    gender: normalizeGenderValue(user.gender),
    trainingPlanAdaptationHistory: Array.isArray(
      user.trainingPlanAdaptationHistory,
    )
      ? user.trainingPlanAdaptationHistory
      : [],
    trainingMlFeedbackHistory: Array.isArray(user.trainingMlFeedbackHistory)
      ? user.trainingMlFeedbackHistory
      : [],
  };
}

function normalizeTrainingFeedbackEvent(event) {
  if (!event || typeof event !== "object") {
    return null;
  }

  if (typeof event.type !== "string" || !event.type.trim()) {
    return null;
  }

  return {
    id:
      typeof event.id === "string" && event.id.trim()
        ? event.id
        : `ml_feedback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt:
      typeof event.createdAt === "string" && event.createdAt.trim()
        ? event.createdAt
        : new Date().toISOString(),
    type: event.type.trim(),
    source:
      typeof event.source === "string" && event.source.trim()
        ? event.source
        : "training_plan",
    trainingPlanId: event.trainingPlanId ?? null,
    scheduledWorkoutId: event.scheduledWorkoutId ?? null,
    sessionId: event.sessionId ?? null,
    sessionIndex: Number.isFinite(Number(event.sessionIndex))
      ? Number(event.sessionIndex)
      : null,
    exerciseId: event.exerciseId ?? null,
    sourceExerciseId: event.sourceExerciseId ?? null,
    exerciseName: event.exerciseName ?? null,
    nextExerciseId: event.nextExerciseId ?? null,
    nextSourceExerciseId: event.nextSourceExerciseId ?? null,
    nextExerciseName: event.nextExerciseName ?? null,
    previousSets: Number.isFinite(Number(event.previousSets))
      ? Number(event.previousSets)
      : null,
    nextSets: Number.isFinite(Number(event.nextSets))
      ? Number(event.nextSets)
      : null,
    metadata:
      event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
        ? { ...event.metadata }
        : {},
  };
}

function mergeTrainingFeedbackHistory(existingHistory = [], nextEvents = []) {
  return [...(existingHistory ?? []), ...(nextEvents ?? [])]
    .map(normalizeTrainingFeedbackEvent)
    .filter(Boolean)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function buildWorkoutOutcomeFeedbackEvents(workoutHistoryEntry, source = "workout_result") {
  const status = workoutHistoryEntry?.status;

  if (status !== "skipped" && status !== "partial") {
    return [];
  }

  return [
    normalizeTrainingFeedbackEvent({
      type: status === "skipped" ? "workout_skipped" : "workout_partial",
      source,
      trainingPlanId: workoutHistoryEntry.trainingPlanId ?? null,
      scheduledWorkoutId: workoutHistoryEntry.scheduledWorkoutId ?? null,
      sessionId: workoutHistoryEntry.sessionId ?? null,
      sessionIndex: workoutHistoryEntry.sessionIndex ?? null,
      metadata: {
        title: workoutHistoryEntry.title ?? null,
        date: workoutHistoryEntry.date ?? null,
        completedSetsCount: workoutHistoryEntry.summary?.completedSetsCount ?? 0,
        plannedSetsCount: workoutHistoryEntry.summary?.plannedSetsCount ?? 0,
      },
    }),
  ].filter(Boolean);
}

function createInitialDatabase() {
  return {
    users: Array.isArray(seedDatabase.users)
      ? seedDatabase.users.map(normalizeUserRecord)
      : [],
  };
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
      users: Array.isArray(parsedDatabase.users)
        ? parsedDatabase.users.map(normalizeUserRecord)
        : [],
    };
  } catch {
    const fallbackDatabase = createInitialDatabase();
    saveDatabase(fallbackDatabase);
    return fallbackDatabase;
  }
}

function saveDatabase(database) {
  const normalizedDatabase = {
    users: Array.isArray(database.users)
      ? database.users.map(normalizeUserRecord)
      : [],
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

function normalizeValue(value) {
  return value.trim().toLowerCase();
}

function createUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createWorkoutHistoryId() {
  return `workout_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildTrainingPlanVolumeBreakdown(trainingPlan = null) {
  const result = {
    progressing: 0,
    stalled: 0,
    manual: 0,
    base: 0,
  };

  (trainingPlan?.sessions ?? []).forEach((session) => {
    (session.exercises ?? []).forEach((exercise) => {
      const trend =
        typeof exercise?.volumeTrend === "string" && exercise.volumeTrend
          ? exercise.volumeTrend
          : "base";

      if (!Object.hasOwn(result, trend)) {
        result.base += 1;
        return;
      }

      result[trend] += 1;
    });
  });

  return result;
}

function buildExerciseSignature(exercise = {}) {
  return [
    String(exercise?.id ?? ""),
    String(exercise?.name ?? ""),
    String(exercise?.type ?? ""),
    Number(exercise?.sets ?? 0),
    String(exercise?.repRange ?? ""),
    Number(exercise?.restSeconds ?? 0),
  ].join("::");
}

function formatExerciseCountLabel(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} упражнение`;
  }

  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 12 || count % 100 > 14)
  ) {
    return `${count} упражнения`;
  }

  return `${count} упражнений`;
}

function getTrainingPlanExerciseCount(trainingPlan = null) {
  return (trainingPlan?.sessions ?? []).reduce(
    (total, session) => total + (session.exercises?.length ?? 0),
    0,
  );
}

function buildManualVolumeReason(previousExercise, nextExercise) {
  if (!previousExercise) {
    return "Упражнение добавлено вручную, поэтому система учитывает его как ручное изменение плана.";
  }

  if (String(previousExercise?.name ?? "") !== String(nextExercise?.name ?? "")) {
    return "Упражнение заменено вручную, поэтому блок адаптации показывает его как ручное изменение.";
  }

  return "План обновлён вручную, поэтому упражнение помечено как ручная корректировка.";
}

function annotateManualTrainingPlanChanges(previousPlan = null, nextPlan = null) {
  if (!nextPlan?.sessions?.length) {
    return nextPlan;
  }

  const clonedPlan = cloneValue(nextPlan);

  clonedPlan.sessions = (clonedPlan.sessions ?? []).map((session, sessionIndex) => {
    const previousSession =
      (previousPlan?.sessions ?? []).find(
        (item) =>
          String(item?.id ?? `session_${sessionIndex + 1}`) ===
          String(session?.id ?? `session_${sessionIndex + 1}`),
      ) ??
      previousPlan?.sessions?.[sessionIndex] ??
      null;

    return {
      ...session,
      exercises: (session.exercises ?? []).map((exercise, exerciseIndex) => {
        const previousExercise = previousSession?.exercises?.[exerciseIndex] ?? null;
        const currentTrend = String(exercise?.volumeTrend ?? "base");
        const didSlotChange =
          !previousExercise ||
          buildExerciseSignature(previousExercise) !==
            buildExerciseSignature(exercise);

        if (!didSlotChange || currentTrend === "manual") {
          return exercise;
        }

        if (currentTrend === "progressing" || currentTrend === "stalled") {
          return exercise;
        }

        return {
          ...exercise,
          volumeTrend: "manual",
          volumeReason:
            exercise?.volumeReason || buildManualVolumeReason(previousExercise, exercise),
        };
      }),
    };
  });

  return clonedPlan;
}

function buildManualTrainingPlanAdaptationSummary(previousPlan = null, nextPlan = null) {
  if (!nextPlan) {
    return [];
  }

  const previousExerciseCount = getTrainingPlanExerciseCount(previousPlan);
  const nextExerciseCount = getTrainingPlanExerciseCount(nextPlan);
  const manualVolumeBreakdown = buildTrainingPlanVolumeBreakdown(nextPlan);
  const changedExercisesCount = (nextPlan?.sessions ?? []).reduce(
    (total, session, sessionIndex) =>
      total +
      (session.exercises ?? []).reduce((sessionTotal, exercise, exerciseIndex) => {
        const previousExercise =
          previousPlan?.sessions?.[sessionIndex]?.exercises?.[exerciseIndex] ?? null;

        return (
          sessionTotal +
          (
            !previousExercise ||
            buildExerciseSignature(previousExercise) !==
              buildExerciseSignature(exercise)
              ? 1
              : 0
          )
        );
      }, 0),
    0,
  );
  const summary = [];

  if (changedExercisesCount > 0) {
    summary.push(
      `Ручная правка затронула ${formatExerciseCountLabel(changedExercisesCount)}.`,
    );
  }

  if (nextExerciseCount > previousExerciseCount) {
    summary.push(
      `В программу добавили ${formatExerciseCountLabel(
        nextExerciseCount - previousExerciseCount,
      )}.`,
    );
  } else if (previousExerciseCount > nextExerciseCount) {
    summary.push(
      `Из программы убрали ${formatExerciseCountLabel(
        previousExerciseCount - nextExerciseCount,
      )}.`,
    );
  }

  if (manualVolumeBreakdown.manual > 0) {
    summary.push(
      `Блок адаптации пометил ${formatExerciseCountLabel(
        manualVolumeBreakdown.manual,
      )} как ручные изменения.`,
    );
  }

  return summary.slice(0, 4);
}

function createTrainingPlanAdaptationEvent(previousPlan, nextPlan, adaptationSummary = []) {
  const volumeBreakdown = buildTrainingPlanVolumeBreakdown(nextPlan);
  const totalExercises = Object.values(volumeBreakdown).reduce(
    (total, value) => total + value,
    0,
  );

  return {
    id: `adaptation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    trigger: previousPlan ? "manual_update" : "manual_builder",
    previousPlanId: previousPlan?.id ?? null,
    nextPlanId: nextPlan?.id ?? null,
    changedExercisesCount:
      volumeBreakdown.progressing +
      volumeBreakdown.stalled +
      volumeBreakdown.manual,
    totalExercises,
    volumeBreakdown,
    adaptationSummary,
  };
}

function enrichTrainingPlanVersion(previousPlan, nextPlan, trigger = "manual_builder") {
  const now = new Date().toISOString();
  const previousVersion = Number(previousPlan?.version);
  const nextVersion = Number.isFinite(previousVersion) ? previousVersion + 1 : 1;

  return {
    ...nextPlan,
    version: nextVersion,
    createdAt:
      typeof nextPlan?.createdAt === "string" && nextPlan.createdAt
        ? nextPlan.createdAt
        : previousPlan?.createdAt ?? now,
    updatedAt: now,
    previousPlanId: previousPlan?.id ?? null,
    adaptiveMetadata: {
      ...(nextPlan?.adaptiveMetadata ?? {}),
      versionTrigger: trigger,
    },
  };
}

function normalizeNumber(value, fallbackValue = 0) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function syncUserExpiredWorkouts(user) {
  if (!user) {
    return {
      didChange: false,
      user,
    };
  }

  const today = formatDateKey(new Date());
  let didChange = false;
  const nextWorkoutHistory = [...(user.workoutHistory ?? [])];
  const nextScheduledWorkouts = (user.scheduledWorkouts ?? []).map(
    (scheduledWorkout) => {
      if (
        (scheduledWorkout?.status ?? "planned") !== "planned" ||
        !scheduledWorkout?.date ||
        scheduledWorkout.date >= today
      ) {
        return scheduledWorkout;
      }

      didChange = true;
      const skippedAt = getExpiredWorkoutCompletedAt(scheduledWorkout.date);
      const nextWorkoutHistoryEntry = {
        id: createWorkoutHistoryId(),
        scheduledWorkoutId: scheduledWorkout.id,
        trainingPlanId: user.trainingPlan?.id ?? null,
        sessionId: scheduledWorkout.sessionId ?? null,
        sessionIndex: scheduledWorkout.sessionIndex ?? null,
        title: scheduledWorkout.title,
        emphasis: scheduledWorkout.emphasis,
        date: scheduledWorkout.date,
        time: scheduledWorkout.time,
        status: "skipped",
        startedAt: null,
        finishedAt: skippedAt,
        plannedDurationSeconds: (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
        actualDurationSeconds: 0,
        durationSeconds: 0,
        completedExercisesCount: 0,
        completedSetsCount: 0,
        exerciseSetWeights: [],
        summary: {
          plannedExercisesCount: scheduledWorkout.exercises?.length ?? 0,
          completedExercisesCount: 0,
          plannedSetsCount: (scheduledWorkout.exercises ?? []).reduce(
            (total, exercise) => total + (Number(exercise?.sets) || 0),
            0,
          ),
          completedSetsCount: 0,
        },
        metrics: {
          weightKg: null,
          burnedCalories: null,
          energyLevel: null,
          effortLevel: null,
          sleepQuality: null,
        },
        completedAt: skippedAt,
      };

      nextWorkoutHistory.push(nextWorkoutHistoryEntry);

      return {
        ...scheduledWorkout,
        status: "skipped",
        completedAt: skippedAt,
        result: nextWorkoutHistoryEntry,
      };
    },
  );

  if (!didChange) {
    return {
      didChange: false,
      user,
    };
  }

  return {
    didChange: true,
    user: {
      ...user,
      scheduledWorkouts: nextScheduledWorkouts,
      workoutHistory: nextWorkoutHistory,
      trainingMlFeedbackHistory: mergeTrainingFeedbackHistory(
        user.trainingMlFeedbackHistory,
        nextWorkoutHistory.flatMap((entry, index) =>
          index >= (user.workoutHistory ?? []).length
            ? buildWorkoutOutcomeFeedbackEvents(entry, "schedule_sync")
            : [],
        ),
      ),
      updatedAt: new Date().toISOString(),
    },
  };
}

function mapPublicUser(user) {
  if (!user) {
    return null;
  }

  const { password: _password, ...publicUser } = normalizeUserRecord(user);
  return cloneValue(publicUser);
}

function findUserByLogin(login) {
  const database = loadDatabase();
  const normalizedLogin = normalizeValue(login);

  return (
    database.users.find(
      (item) => normalizeValue(item.login ?? item.name) === normalizedLogin,
    ) ?? null
  );
}

function findUserByName(name) {
  const database = loadDatabase();
  const normalizedName = normalizeValue(name);

  return (
    database.users.find(
      (item) => normalizeValue(item.name ?? item.login) === normalizedName,
    ) ?? null
  );
}

export const mockUserStorage = {
  async getById(userId) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);

    if (syncResult.didChange) {
      database.users[userIndex] = syncResult.user;
      saveDatabase(database);
    }

    return mapPublicUser(syncResult.user);
  },

  async login({ login, password }) {
    const user = findUserByLogin(login);

    if (!user || user.password !== password) {
      return null;
    }

    return this.getById(user.id);
  },

  async register({ login, password }) {
    const database = loadDatabase();
    const trimmedLogin = String(login).trim();
    const existingUser = findUserByLogin(trimmedLogin);

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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async updateProfile(userId, { name, email, password, profilePhoto, gender }) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const currentUser = database.users[userIndex];
    const trimmedName = String(name ?? currentUser.name).trim();

    if (
      trimmedName &&
      normalizeValue(trimmedName) !== normalizeValue(currentUser.name ?? currentUser.login)
    ) {
      const existingUser = findUserByName(trimmedName);

      if (existingUser && existingUser.id !== userId) {
        throw new Error("Пользователь с таким именем уже существует.");
      }
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
    const resolvedTrainingLevel =
      typeof trainingLevel === "string" && trainingLevel.trim()
        ? trainingLevel.trim()
        : getTrainingLevelByScore(score);
    const nextUser = {
      ...currentUser,
      trainingLevel: resolvedTrainingLevel,
      lastTestScore: score,
      updatedAt: new Date().toISOString(),
    };

    database.users[userIndex] = nextUser;
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async saveTrainingPlan(
    userId,
    {
      workoutsPerWeek,
      focusKey,
      sessionSelections,
      trainingPlan: providedTrainingPlan,
      mlFeedbackEvents = [],
    },
  ) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const isProvidedTrainingPlan =
      providedTrainingPlan &&
      typeof providedTrainingPlan === "object" &&
      Array.isArray(providedTrainingPlan.sessions);
    const rawTrainingPlan =
      providedTrainingPlan &&
      typeof providedTrainingPlan === "object" &&
      Array.isArray(providedTrainingPlan.sessions)
        ? enrichTrainingPlanVersion(
            currentUser.trainingPlan,
            providedTrainingPlan,
            "manual_update",
          )
        : enrichTrainingPlanVersion(
            currentUser.trainingPlan,
            buildTrainingPlan({
            workoutsPerWeek,
            focusKey,
            trainingLevel: currentUser.trainingLevel,
            sessionSelections,
            }),
            "manual_builder",
          );
    const trainingPlan = isProvidedTrainingPlan
      ? annotateManualTrainingPlanChanges(
          currentUser.trainingPlan,
          rawTrainingPlan,
        )
      : rawTrainingPlan;
    const adaptationSummary = isProvidedTrainingPlan
      ? buildManualTrainingPlanAdaptationSummary(
          currentUser.trainingPlan,
          trainingPlan,
        )
      : [];
    const nextUser = {
      ...currentUser,
      trainingPlan,
      trainingPlanAdaptationHistory: [
        ...(currentUser.trainingPlanAdaptationHistory ?? []),
        createTrainingPlanAdaptationEvent(
          currentUser.trainingPlan,
          trainingPlan,
          adaptationSummary,
        ),
      ],
      trainingMlFeedbackHistory: mergeTrainingFeedbackHistory(
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async saveTrainingFeedback(userId, feedbackEvents = []) {
    const database = loadDatabase();
    const userIndex = database.users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      return null;
    }

    const nextUser = {
      ...database.users[userIndex],
      trainingMlFeedbackHistory: mergeTrainingFeedbackHistory(
        database.users[userIndex].trainingMlFeedbackHistory,
        feedbackEvents,
      ),
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async rescheduleWorkout(userId, scheduledWorkoutId, { date, time }) {
    const database = loadDatabase();
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async cancelWorkout(userId, scheduledWorkoutId) {
    const database = loadDatabase();
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
    const nextWorkoutHistoryEntry = {
      id: createWorkoutHistoryId(),
      scheduledWorkoutId,
      trainingPlanId: currentUser.trainingPlan?.id ?? null,
      sessionId: scheduledWorkout.sessionId ?? null,
      sessionIndex: scheduledWorkout.sessionIndex ?? null,
      title: scheduledWorkout.title,
      emphasis: scheduledWorkout.emphasis,
      date: scheduledWorkout.date,
      time: scheduledWorkout.time,
      status: "canceled",
      startedAt: null,
      finishedAt: canceledAt,
      plannedDurationSeconds: (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      actualDurationSeconds: 0,
      durationSeconds: 0,
      completedExercisesCount: 0,
      completedSetsCount: 0,
      exerciseSetWeights: [],
      summary: {
        plannedExercisesCount: scheduledWorkout.exercises?.length ?? 0,
        completedExercisesCount: 0,
        plannedSetsCount: (scheduledWorkout.exercises ?? []).reduce(
          (total, exercise) => total + (Number(exercise?.sets) || 0),
          0,
        ),
        completedSetsCount: 0,
      },
      metrics: {
        weightKg: null,
        burnedCalories: null,
        energyLevel: null,
        effortLevel: null,
        sleepQuality: null,
      },
      completedAt: canceledAt,
    };
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
    saveDatabase(database);

    return mapPublicUser(nextUser);
  },

  async skipWorkout(userId, scheduledWorkoutId) {
    const database = loadDatabase();
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
    const nextWorkoutHistoryEntry = {
      id: createWorkoutHistoryId(),
      scheduledWorkoutId,
      trainingPlanId: currentUser.trainingPlan?.id ?? null,
      sessionId: scheduledWorkout.sessionId ?? null,
      sessionIndex: scheduledWorkout.sessionIndex ?? null,
      title: scheduledWorkout.title,
      emphasis: scheduledWorkout.emphasis,
      date: scheduledWorkout.date,
      time: scheduledWorkout.time,
      status: "skipped",
      startedAt: null,
      finishedAt: skippedAt,
      plannedDurationSeconds: (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      actualDurationSeconds: 0,
      durationSeconds: 0,
      completedExercisesCount: 0,
      completedSetsCount: 0,
      exerciseSetWeights: [],
      summary: {
        plannedExercisesCount: scheduledWorkout.exercises?.length ?? 0,
        completedExercisesCount: 0,
        plannedSetsCount: (scheduledWorkout.exercises ?? []).reduce(
          (total, exercise) => total + (Number(exercise?.sets) || 0),
          0,
        ),
        completedSetsCount: 0,
      },
      metrics: {
        weightKg: null,
        burnedCalories: null,
        energyLevel: null,
        effortLevel: null,
        sleepQuality: null,
      },
      completedAt: skippedAt,
    };
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
      trainingMlFeedbackHistory: mergeTrainingFeedbackHistory(
        currentUser.trainingMlFeedbackHistory,
        buildWorkoutOutcomeFeedbackEvents(nextWorkoutHistoryEntry),
      ),
      updatedAt: skippedAt,
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

    const syncResult = syncUserExpiredWorkouts(database.users[userIndex]);
    const currentUser = syncResult.user;
    const scheduledWorkout = (currentUser.scheduledWorkouts ?? []).find(
      (item) => item.id === scheduledWorkoutId,
    );

    if (!scheduledWorkout) {
      throw new Error("Тренировка не найдена в календаре.");
    }

    const completedAt = new Date().toISOString();
    const exerciseSetWeights = Array.isArray(completionPayload.exerciseSetWeights)
      ? completionPayload.exerciseSetWeights.map((exercise) => {
          const weightsKg = Array.isArray(exercise.weightsKg)
            ? exercise.weightsKg.map((value) => {
                const parsedValue = Number(value);
                return Number.isFinite(parsedValue) ? parsedValue : null;
              })
            : [];

          return {
            ...exercise,
            plannedSetsCount: Math.max(
              normalizeNumber(exercise.plannedSetsCount, 0),
              normalizeNumber(exercise.sets, 0),
              weightsKg.length,
            ),
            completedSetsCount: weightsKg.filter((value) => value != null).length,
            weightsKg,
          };
        })
      : [];
    const nextWorkoutHistoryEntry = {
      id: createWorkoutHistoryId(),
      scheduledWorkoutId,
      trainingPlanId: currentUser.trainingPlan?.id ?? null,
      sessionId: scheduledWorkout.sessionId ?? null,
      sessionIndex: scheduledWorkout.sessionIndex ?? null,
      title: scheduledWorkout.title,
      emphasis: scheduledWorkout.emphasis,
      date: scheduledWorkout.date,
      time: scheduledWorkout.time,
      status: completionPayload.status ?? "completed",
      startedAt: completionPayload.startedAt ?? null,
      finishedAt: completedAt,
      plannedDurationSeconds:
        completionPayload.plannedDurationSeconds ??
        (scheduledWorkout.estimatedDurationMin ?? 0) * 60,
      actualDurationSeconds: completionPayload.durationSeconds ?? 0,
      durationSeconds: completionPayload.durationSeconds ?? 0,
      completedExercisesCount: completionPayload.completedExercisesCount ?? 0,
      completedSetsCount: completionPayload.completedSetsCount ?? 0,
      exerciseSetWeights,
      summary: {
        plannedExercisesCount: scheduledWorkout.exercises?.length ?? exerciseSetWeights.length,
        completedExercisesCount: completionPayload.completedExercisesCount ?? 0,
        plannedSetsCount:
          completionPayload.plannedSetsCount ??
          exerciseSetWeights.reduce(
            (total, exercise) => total + (exercise.plannedSetsCount ?? 0),
            0,
          ),
        completedSetsCount: completionPayload.completedSetsCount ?? 0,
      },
      metrics: {
        weightKg: completionPayload.weightKg ?? null,
        burnedCalories: completionPayload.burnedCalories ?? null,
        energyLevel: completionPayload.energyLevel ?? null,
        effortLevel: completionPayload.effortLevel ?? null,
        sleepQuality: completionPayload.sleepQuality ?? null,
      },
      completedAt,
    };
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
      trainingMlFeedbackHistory: mergeTrainingFeedbackHistory(
        currentUser.trainingMlFeedbackHistory,
        buildWorkoutOutcomeFeedbackEvents(nextWorkoutHistoryEntry),
      ),
      updatedAt: completedAt,
    };

    database.users[userIndex] = nextUser;
    saveDatabase(database);

    return {
      user: mapPublicUser(nextUser),
      trainingPlanRefreshed: false,
      adaptationSummary: [],
    };
  },

  async getWorkoutStats(userId, options = {}) {
    const database = loadDatabase();
    const user = database.users.find((item) => item.id === userId);

    if (!user) {
      return null;
    }

    const todayDateKey = formatDateKey(new Date());
    const periodDays =
      options.rangeKey === "7"
        ? 7
        : options.rangeKey === "30"
          ? 30
          : null;
    const fallbackStats = buildWorkoutStats(
      user.workoutHistory ?? [],
      todayDateKey,
      {
        trainingPlanAdaptationHistory: user.trainingPlanAdaptationHistory ?? [],
        trainingPlan: user.trainingPlan ?? null,
        periodDays,
      },
    );

    return {
      ...fallbackStats,
      scheduledWorkoutsCount: Array.isArray(user.scheduledWorkouts)
        ? user.scheduledWorkouts.length
        : 0,
    };
  },

  async getGamificationCatalog() {
    return null;
  },
};
