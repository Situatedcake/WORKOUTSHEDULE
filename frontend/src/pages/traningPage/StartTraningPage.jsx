import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import clockIcon from "/icons/clock.svg";
import menuIcon from "/menu.svg";
import backIcon from "/icons/arrowBack.svg";
import PageShell from "../../components/PageShell";
import VolumeTrendIcon from "../../components/VolumeTrendIcon";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { DATABASE_CONFIG } from "../../services/database/databaseConfig";
import {
  calculateWorkoutTotals,
  decorateWorkoutExercises,
} from "../../shared/activeWorkout";
import {
  TRAINING_GOALS,
  WORKOUTS_PER_WEEK_OPTIONS,
  buildTrainingPlan,
  getExerciseVolumeChangeChips,
  getExerciseVolumeReason,
  getExerciseVolumeReasonMeta,
  getExerciseVolumeReasonTitle,
  getExercisePrescriptionDetails,
  getRecommendedTrainingSetup,
} from "../../shared/trainingPlanBuilder";
import { createTrainingFeedbackEvent } from "../../shared/trainingMlFeedback";
import { formatDateKey } from "../../shared/workoutSchedule";
import { getTastingScore } from "../../utils/tastingSession";
import { getTrainingLevelByScore } from "../../utils/trainingLevel";

function getRecommendationDifficultyLabel(difficulty) {
  if (difficulty >= 3) {
    return "Высокая";
  }

  if (difficulty >= 2) {
    return "Средняя";
  }

  return "Легкая";
}

function getGoalLabel(focusKey) {
  return (
    TRAINING_GOALS.find((goal) => goal.key === focusKey)?.label ??
    TRAINING_GOALS[0].label
  );
}

function getGoalDescription(focusKey) {
  return (
    TRAINING_GOALS.find((goal) => goal.key === focusKey)?.description ?? ""
  );
}

function getSuggestedSetupByGender(trainingLevel, gender) {
  const normalizedGender =
    typeof gender === "string" ? gender.trim().toLowerCase() : "not_specified";

  if (trainingLevel === "Продвинутый") {
    return getRecommendedTrainingSetup(trainingLevel);
  }

  if (trainingLevel === "Средний" && normalizedGender === "female") {
    return {
      workoutsPerWeek: 4,
      focusKey: "full-body",
      reason:
        "Рекомендуем фуллбади-план, чтобы держать баланс между силой, тонусом и кардио-нагрузкой.",
    };
  }

  if (trainingLevel === "Начинающий" && normalizedGender === "female") {
    return {
      workoutsPerWeek: 3,
      focusKey: "women-cardio",
      reason:
        "Рекомендуем мягкий кардио-старт с упором на ноги, ягодицы, корпус и общий тонус.",
    };
  }

  if (trainingLevel === "Начинающий") {
    return {
      workoutsPerWeek: 3,
      focusKey: "full-body",
      reason:
        "Рекомендуем фуллбади-план, чтобы спокойно собрать технику и базовую силу на всем теле.",
    };
  }

  if (normalizedGender === "female") {
    return {
      workoutsPerWeek: 3,
      focusKey: "women-cardio",
      reason:
        "Рекомендуем кардио-программу с акцентом на общий тонус и нижнюю часть тела.",
    };
  }

  return {
    ...getRecommendedTrainingSetup(trainingLevel),
    focusKey:
      getRecommendedTrainingSetup(trainingLevel).focusKey === "general-strength"
        ? "full-body"
        : getRecommendedTrainingSetup(trainingLevel).focusKey,
  };
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureSelectedExerciseNames(session) {
  if (
    Array.isArray(session.selectedExerciseNames) &&
    session.selectedExerciseNames.length
  ) {
    return session.selectedExerciseNames;
  }

  return Array.isArray(session.exercises)
    ? session.exercises.map((exercise) => exercise.name)
    : [];
}

function buildSessionExercise(option, trainingLevel, fallbackExercise = null) {
  const type = option?.type ?? fallbackExercise?.type ?? "compound";
  const prescriptionDetails = getExercisePrescriptionDetails(trainingLevel, type);

  return {
    id:
      option?.id ??
      fallbackExercise?.id ??
      option?.name ??
      fallbackExercise?.name,
    name: option?.name ?? fallbackExercise?.name ?? "",
    type,
    sets: fallbackExercise?.sets ?? prescriptionDetails.sets,
    repRange: fallbackExercise?.repRange ?? prescriptionDetails.repRange,
    restSeconds:
      fallbackExercise?.restSeconds ?? prescriptionDetails.restSeconds,
    prescription:
      fallbackExercise?.prescription ?? prescriptionDetails.prescription,
    difficulty: option?.difficulty ?? fallbackExercise?.difficulty,
    volumeTrend: fallbackExercise?.volumeTrend ?? "base",
    volumeReason:
      fallbackExercise?.volumeReason ??
      "Базовый объём подобран по текущему уровню подготовки и типу упражнения.",
  };
}

function buildSessionExercises(session, selectedExerciseNames, trainingLevel) {
  const currentExercisesByName = new Map(
    Array.isArray(session.exercises)
      ? session.exercises.map((exercise) => [exercise.name, exercise])
      : [],
  );

  return selectedExerciseNames
    .map((exerciseName) => {
      const nextOption =
        session.exerciseOptions?.find(
          (option) => option.name === exerciseName,
        ) ?? null;
      const currentExercise = currentExercisesByName.get(exerciseName) ?? null;

      return buildSessionExercise(nextOption, trainingLevel, currentExercise);
    })
    .filter((exercise) => exercise.name);
}

function getUnusedSessionExerciseOptions(session) {
  const selectedExerciseNames = ensureSelectedExerciseNames(session);

  return (session.exerciseOptions ?? []).filter(
    (option) => !selectedExerciseNames.includes(option.name),
  );
}

function getSelectableExerciseOptions(session, currentExerciseName) {
  const selectedExerciseNames = ensureSelectedExerciseNames(session);

  return (session.exerciseOptions ?? []).filter(
    (option) =>
      option.name === currentExerciseName ||
      !selectedExerciseNames.includes(option.name),
  );
}

function createFallbackPlan({ workoutsPerWeek, focusKey, trainingLevel }) {
  const trainingPlan = buildTrainingPlan({
    workoutsPerWeek,
    focusKey,
    trainingLevel,
    sessionSelections: [],
  });

  return {
    trainingPlan,
    highlightedExercises: (trainingPlan.sessions ?? [])
      .flatMap((session) => session.exercises ?? [])
      .slice(0, 8),
    adaptationSummary: [
      "Показали базовый план, пока персональная адаптация временно недоступна.",
    ],
  };
}

function getSessionEstimatedMinutes(session, trainingLevel) {
  const decoratedExercises = decorateWorkoutExercises(
    session?.exercises ?? [],
    trainingLevel,
  );
  const totals = calculateWorkoutTotals(decoratedExercises);

  return Math.max(Math.round(totals.totalEstimatedSeconds / 60), 1);
}

function getDraftPlanEstimatedMinutes(plan, trainingLevel) {
  return (plan?.sessions ?? []).reduce(
    (total, session) => total + getSessionEstimatedMinutes(session, trainingLevel),
    0,
  );
}

function validateDraftPlan(plan, trainingLevel) {
  if (!plan?.sessions?.length) {
    return "Сначала собери хотя бы одну тренировочную сессию.";
  }

  for (const session of plan.sessions) {
    const exercises = session?.exercises ?? [];

    if (!exercises.length) {
      return `В дне "${session?.title ?? "Тренировка"}" должно остаться хотя бы одно упражнение.`;
    }

    const plannedSets = exercises.reduce(
      (total, exercise) => total + Math.max(Number(exercise?.sets) || 0, 0),
      0,
    );

    if (plannedSets < 3) {
      return `В дне "${session?.title ?? "Тренировка"}" слишком маленький объём. Добавь хотя бы 3 подхода.`;
    }

    if (getSessionEstimatedMinutes(session, trainingLevel) < 8) {
      return `День "${session?.title ?? "Тренировка"}" получился слишком коротким. Добавь ещё одно упражнение или увеличь объём.`;
    }
  }

  return "";
}

export default function StartTraningPage() {
  const location = useLocation();
  const { currentUser, saveCurrentUserTrainingPlan } = useAuth();
  const currentTrainingPlan = currentUser?.trainingPlan ?? null;
  const tastingScore = getTastingScore();
  const locationSuggestedLevel = location.state?.suggestedTrainingLevel;
  const hasTestBasedSuggestion =
    Boolean(location.state?.suggestedFromTest) ||
    currentUser?.lastTestScore != null ||
    tastingScore !== null;

  const suggestedTrainingLevel = useMemo(() => {
    if (
      typeof locationSuggestedLevel === "string" &&
      locationSuggestedLevel.trim()
    ) {
      return locationSuggestedLevel;
    }

    if (
      typeof currentUser?.trainingLevel === "string" &&
      currentUser.trainingLevel.trim()
    ) {
      return currentUser.trainingLevel;
    }

    if (tastingScore !== null) {
      return getTrainingLevelByScore(tastingScore);
    }

    return "Не определен";
  }, [currentUser?.trainingLevel, locationSuggestedLevel, tastingScore]);

  const suggestedSetup = useMemo(() => {
    const locationSetup = location.state?.suggestedSetup;

    if (
      locationSetup &&
      typeof locationSetup.focusKey === "string" &&
      Number.isInteger(locationSetup.workoutsPerWeek)
    ) {
      return locationSetup;
    }

    return getSuggestedSetupByGender(
      suggestedTrainingLevel,
      currentUser?.gender,
    );
  }, [currentUser?.gender, location.state, suggestedTrainingLevel]);

  const [editorMode, setEditorMode] = useState(() =>
    currentTrainingPlan && !location.state?.suggestedFromTest
      ? "hidden"
      : "new",
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(() =>
    currentTrainingPlan && !location.state?.suggestedFromTest
      ? currentTrainingPlan.workoutsPerWeek
      : suggestedSetup.workoutsPerWeek,
  );
  const [focusKey, setFocusKey] = useState(() =>
    currentTrainingPlan && !location.state?.suggestedFromTest
      ? currentTrainingPlan.focusKey
      : suggestedSetup.focusKey,
  );
  const [draftPlan, setDraftPlan] = useState(() =>
    currentTrainingPlan && !location.state?.suggestedFromTest
      ? cloneValue(currentTrainingPlan)
      : null,
  );
  const [highlightedExercises, setHighlightedExercises] = useState([]);
  const [adaptationSummary, setAdaptationSummary] = useState([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pendingFeedbackEvents, setPendingFeedbackEvents] = useState([]);
  const [pendingEditorAction, setPendingEditorAction] = useState("");
  const [isRebalancePromptOpen, setIsRebalancePromptOpen] = useState(false);

  const shouldShowEditor = !currentTrainingPlan || editorMode !== "hidden";
  const todayDateKey = useMemo(() => formatDateKey(new Date()), []);
  const futurePlannedWorkoutsCount = useMemo(
    () =>
      (currentUser?.scheduledWorkouts ?? []).filter(
        (workout) =>
          (workout.status ?? "planned") === "planned" &&
          typeof workout.date === "string" &&
          workout.date >= todayDateKey,
      ).length,
    [currentUser?.scheduledWorkouts, todayDateKey],
  );
  const hasFuturePlannedWorkouts = futurePlannedWorkoutsCount > 0;
  const draftEstimatedMinutesPerWeek = useMemo(
    () => getDraftPlanEstimatedMinutes(draftPlan, suggestedTrainingLevel),
    [draftPlan, suggestedTrainingLevel],
  );

  useEffect(() => {
    if (!shouldShowEditor) {
      return;
    }

    if (editorMode === "edit" && currentTrainingPlan) {
      setDraftPlan(cloneValue(currentTrainingPlan));
      setHighlightedExercises(
        currentTrainingPlan.sessions
          .flatMap((session) => session.exercises)
          .slice(0, 8),
      );
      setAdaptationSummary([]);
      setPlanError("");
      setPendingFeedbackEvents([]);
      return;
    }

    const abortController = new AbortController();

    async function loadSmartPlan() {
      setIsLoadingPlan(true);
      setPlanError("");

      try {
        const response = await fetch(
          `${DATABASE_CONFIG.apiBaseUrl}/workouts/smart-plan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              trainingLevel: suggestedTrainingLevel,
              gender: currentUser?.gender ?? "not_specified",
              focusKey,
              workoutsPerWeek,
              time: 45,
              workoutHistory: currentUser?.workoutHistory ?? [],
              trainingMlFeedbackHistory:
                currentUser?.trainingMlFeedbackHistory ?? [],
            }),
            signal: abortController.signal,
          },
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.message ?? "Не удалось собрать персональный план.",
          );
        }

        const nextPlan =
          payload.trainingPlan &&
          Array.isArray(payload.trainingPlan.sessions) &&
          payload.trainingPlan.sessions.length > 0
            ? payload.trainingPlan
            : null;

        if (!nextPlan) {
          const fallbackPayload = createFallbackPlan({
            workoutsPerWeek,
            focusKey,
            trainingLevel: suggestedTrainingLevel,
          });

          setDraftPlan(fallbackPayload.trainingPlan);
          setHighlightedExercises(fallbackPayload.highlightedExercises);
          setAdaptationSummary(fallbackPayload.adaptationSummary);
          setPendingFeedbackEvents([]);
          return;
        }

        setDraftPlan(nextPlan);
        setHighlightedExercises(
          Array.isArray(payload.highlightedExercises)
            ? payload.highlightedExercises
            : [],
        );
        setAdaptationSummary(
          Array.isArray(payload.adaptationSummary)
            ? payload.adaptationSummary
            : [],
        );
        setPendingFeedbackEvents([]);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        const fallbackPayload = createFallbackPlan({
          workoutsPerWeek,
          focusKey,
          trainingLevel: suggestedTrainingLevel,
        });

        setDraftPlan(fallbackPayload.trainingPlan);
        setHighlightedExercises(fallbackPayload.highlightedExercises);
        setAdaptationSummary(fallbackPayload.adaptationSummary);
        setPendingFeedbackEvents([]);
        setPlanError("");
        setPlanError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить персональный план.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingPlan(false);
        }
      }
    }

    void loadSmartPlan();

    return () => {
      abortController.abort();
    };
  }, [
    currentTrainingPlan,
    currentUser?.gender,
    currentUser?.trainingMlFeedbackHistory,
    currentUser?.workoutHistory,
    editorMode,
    focusKey,
    shouldShowEditor,
    suggestedTrainingLevel,
    workoutsPerWeek,
  ]);

  function updateSessionExercise(sessionIndex, exerciseIndex, value) {
    const session = draftPlan?.sessions?.[sessionIndex];
    const previousExercise = session?.exercises?.[exerciseIndex];
    const nextExercise =
      session?.exerciseOptions?.find((option) => option.name === value) ?? null;

    if (
      previousExercise &&
      nextExercise &&
      previousExercise.name !== nextExercise.name
    ) {
      setPendingFeedbackEvents((previousEvents) => [
        ...previousEvents,
        createTrainingFeedbackEvent({
          type: "exercise_replaced",
          source: "training_plan",
          trainingPlanId: draftPlan?.id ?? null,
          sessionId: session?.id ?? null,
          sessionIndex: sessionIndex + 1,
          exercise: previousExercise,
          nextExercise,
        }),
      ]);
    }

    setDraftPlan((previousPlan) => {
      if (!previousPlan) {
        return previousPlan;
      }

      const nextPlan = cloneValue(previousPlan);
      const session = nextPlan.sessions?.[sessionIndex];

      if (!session) {
        return previousPlan;
      }

      const nextSelectedExerciseNames = ensureSelectedExerciseNames(session);
      nextSelectedExerciseNames[exerciseIndex] = value;
      session.selectedExerciseNames = nextSelectedExerciseNames;
      session.exercises = buildSessionExercises(
        session,
        nextSelectedExerciseNames,
        suggestedTrainingLevel,
      );

      return nextPlan;
    });
  }

  function addSessionExercise(sessionIndex) {
    setDraftPlan((previousPlan) => {
      if (!previousPlan) {
        return previousPlan;
      }

      const nextPlan = cloneValue(previousPlan);
      const session = nextPlan.sessions?.[sessionIndex];

      if (!session) {
        return previousPlan;
      }

      const nextOption = getUnusedSessionExerciseOptions(session)[0];

      if (!nextOption) {
        return previousPlan;
      }

      const nextSelectedExerciseNames = [
        ...ensureSelectedExerciseNames(session),
        nextOption.name,
      ];
      session.selectedExerciseNames = nextSelectedExerciseNames;
      session.exercises = buildSessionExercises(
        session,
        nextSelectedExerciseNames,
        suggestedTrainingLevel,
      );

      return nextPlan;
    });
  }

  function removeSessionExercise(sessionIndex, exerciseIndex) {
    const session = draftPlan?.sessions?.[sessionIndex];
    const previousExercise = session?.exercises?.[exerciseIndex];

    if (previousExercise && ensureSelectedExerciseNames(session).length > 1) {
      setPendingFeedbackEvents((previousEvents) => [
        ...previousEvents,
        createTrainingFeedbackEvent({
          type: "exercise_removed",
          source: "training_plan",
          trainingPlanId: draftPlan?.id ?? null,
          sessionId: session?.id ?? null,
          sessionIndex: sessionIndex + 1,
          exercise: previousExercise,
        }),
      ]);
    }

    setDraftPlan((previousPlan) => {
      if (!previousPlan) {
        return previousPlan;
      }

      const nextPlan = cloneValue(previousPlan);
      const session = nextPlan.sessions?.[sessionIndex];

      if (!session) {
        return previousPlan;
      }

      const nextSelectedExerciseNames = [
        ...ensureSelectedExerciseNames(session),
      ];

      if (nextSelectedExerciseNames.length <= 1) {
        return previousPlan;
      }

      nextSelectedExerciseNames.splice(exerciseIndex, 1);
      session.selectedExerciseNames = nextSelectedExerciseNames;
      session.exercises = buildSessionExercises(
        session,
        nextSelectedExerciseNames,
        suggestedTrainingLevel,
      );

      return nextPlan;
    });
  }

  function openEditor(mode) {
    if (mode === "new") {
      setWorkoutsPerWeek(suggestedSetup.workoutsPerWeek);
      setFocusKey(suggestedSetup.focusKey);
    }

    setEditorMode(mode);
    setPendingFeedbackEvents([]);
    setIsMenuOpen(false);
  }

  function requestEditorOpen(mode) {
    if (hasFuturePlannedWorkouts) {
      setPendingEditorAction(mode);
      setIsRebalancePromptOpen(true);
      setIsMenuOpen(false);
      return;
    }

    openEditor(mode);
  }

  function handleEditPlan() {
    requestEditorOpen("edit");
  }

  function handleCreateNewPlan() {
    requestEditorOpen("new");
  }

  async function handleSavePlan() {
    if (!currentUser) {
      setFormError("Войдите или зарегистрируйтесь, чтобы сохранить программу.");
      return;
    }

    if (!draftPlan) {
      setFormError("Сначала дождитесь, пока соберется персональный план.");
      return;
    }

    const validationError = validateDraftPlan(draftPlan, suggestedTrainingLevel);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const trainingPlanToSave = {
      ...draftPlan,
      estimatedMinutesPerWeek: draftEstimatedMinutesPerWeek,
      sessions: (draftPlan.sessions ?? []).map((session) => ({
        ...session,
        estimatedDurationMin: getSessionEstimatedMinutes(
          session,
          suggestedTrainingLevel,
        ),
      })),
    };

    setIsSaving(true);
    setFormError("");

    try {
      await saveCurrentUserTrainingPlan({
        workoutsPerWeek: trainingPlanToSave.workoutsPerWeek,
        focusKey: trainingPlanToSave.focusKey,
        trainingPlan: trainingPlanToSave,
        mlFeedbackEvents: pendingFeedbackEvents,
      });
      setEditorMode("hidden");
      setPendingFeedbackEvents([]);
      setIsMenuOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить программу тренировок.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell className="pt-4">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-4">
        <Link to={ROUTES.HOME} className="rounded-2xl p-2" aria-label="Назад">
          <img src={backIcon} alt="" aria-hidden="true" />
        </Link>

        <h1 className="text-2xl font-medium">Конструктор тренировки</h1>

        <button
          type="button"
          onClick={() => setIsMenuOpen((previousValue) => !previousValue)}
          className="rounded-2xl p-2"
          aria-label="Меню"
        >
          <img src={menuIcon} alt="" aria-hidden="true" />
        </button>
      </header>

      {isMenuOpen ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}

      {isMenuOpen ? (
        <div className="fixed right-5 top-16 z-20 w-56 rounded-2xl border border-[#2A3140] bg-[#12151C] p-2 shadow-lg">
          <button
            type="button"
            onClick={handleEditPlan}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-white"
          >
            Изменить тренировку
          </button>
          <button
            type="button"
            onClick={handleCreateNewPlan}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-white"
          >
            Составить новую тренировку
          </button>
        </div>
      ) : null}

      {shouldShowEditor ? (
        <section className="mx-auto mt-8 flex w-full max-w-md flex-col gap-6 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-[#0B0E15] p-3">
              <img src={clockIcon} alt="" aria-hidden="true" />
            </div>

            <div>
              <span className="block text-2xl font-medium">
                {draftEstimatedMinutesPerWeek} минут
              </span>
              <p className="text-sm text-[#8E97A8]">
                Рекомендуемый недельный объем по программе
              </p>
            </div>
          </div>

          {hasFuturePlannedWorkouts ? (
            <div className="rounded-2xl border border-[#3A4C62] bg-[#102338] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8E97A8]">
                Внимание
              </p>
              <p className="mt-2 text-sm leading-6 text-[#D6E6F8]">
                После сохранения программа перестроит {futurePlannedWorkoutsCount}{" "}
                будущ{futurePlannedWorkoutsCount === 1 ? "ую тренировку" : "их тренировок"} в
                календаре под новый порядок сессий.
              </p>
            </div>
          ) : null}

          {hasTestBasedSuggestion ? (
            <div className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8E97A8]">
                Подобрано по тесту
              </p>
              <h2 className="mt-2 text-lg font-medium text-white">
                {suggestedTrainingLevel}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#8E97A8]">
                Предлагаем начать с фокуса на{" "}
                <span className="text-white">
                  {getGoalLabel(focusKey).toLowerCase()}
                </span>{" "}
                и {workoutsPerWeek} тренировок в неделю.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#8E97A8]">
                {suggestedSetup.reason}
              </p>
            </div>
          ) : null}

          {adaptationSummary.length > 0 ? (
            <div className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8E97A8]">
                Адаптация
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {adaptationSummary.map((item) => (
                  <p key={item} className="text-sm leading-6 text-[#8E97A8]">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm text-[#8E97A8]">
              Сколько дней в неделю хочешь заниматься?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {WORKOUTS_PER_WEEK_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setWorkoutsPerWeek(value);
                    setEditorMode("new");
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    workoutsPerWeek === value
                      ? "bg-[#01BB96] text-[#000214]"
                      : "border border-[#2A3140] bg-[#0B0E15] text-white"
                  }`}
                >
                  {value} р/нед
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[#8E97A8]">На чем делаем упор?</p>
            <label className="flex flex-col gap-3">
              <select
                value={focusKey}
                onChange={(event) => {
                  setFocusKey(event.target.value);
                  setEditorMode("new");
                }}
                className="w-full rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-4 text-sm text-white outline-none"
              >
                {TRAINING_GOALS.map((goal) => (
                  <option key={goal.key} value={goal.key}>
                    {goal.label}
                  </option>
                ))}
              </select>
              <div className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-4">
                <p className="text-base font-medium text-white">
                  {getGoalLabel(focusKey)}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#8E97A8]">
                  {getGoalDescription(focusKey)}
                </p>
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white">Мы рекомендуем</p>
                <p className="text-xs text-[#8E97A8]">
                  Подборка учитывает цель, уровень и историю завершенных
                  тренировок.
                </p>
              </div>

              {isLoadingPlan ? (
                <span className="text-xs text-[#8E97A8]">Собираем...</span>
              ) : null}
            </div>

            {highlightedExercises.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {highlightedExercises.map((exercise, exerciseIndex) => (
                  <div
                    key={`${exercise.id ?? exercise.name}_${exerciseIndex}`}
                    className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-3 py-3"
                  >
                    <p className="text-sm font-medium text-white">
                      {exercise.name}
                    </p>
                    <p className="mt-1 text-xs text-[#8E97A8]">
                      {getRecommendationDifficultyLabel(exercise.difficulty)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-4 text-sm text-[#8E97A8]">
                Пока нет рекомендаций для текущих параметров.
              </div>
            )}

            {planError && !draftPlan ? (
              <div className="rounded-2xl border border-[#603838] bg-[#2B1717] px-4 py-3 text-sm text-[#FFB3B3]">
                {planError}
              </div>
            ) : null}
          </div>

          {!currentUser ? (
            <div className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-6 text-center text-sm text-[#8E97A8]">
              Без аккаунта можно только посмотреть предложенную программу. Для
              сохранения войдите в профиль.
            </div>
          ) : null}

          {draftPlan?.sessions?.map((session, sessionIndex) => (
            <article
              key={session.id}
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#8E97A8]">{session.dayLabel}</p>
                  <h2 className="mt-1 text-lg font-medium text-white">
                    {session.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#8E97A8]">
                    {session.emphasis}
                  </p>
                  {session.adaptationHints?.length ? (
                    <div className="mt-3 flex flex-col gap-1">
                      {session.adaptationHints.slice(0, 2).map((hint) => (
                        <p
                          key={hint}
                          className="text-xs leading-5 text-[#9DB6AE]"
                        >
                          {hint}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <span className="text-sm text-[#8E97A8]">
                  {getSessionEstimatedMinutes(session, suggestedTrainingLevel)} мин
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {ensureSelectedExerciseNames(session).map(
                  (exerciseName, exerciseIndex) => {
                    const canRemoveExercise =
                      ensureSelectedExerciseNames(session).length > 1;
                    const selectableExerciseOptions =
                      getSelectableExerciseOptions(session, exerciseName);
                    const volumeExercise = session.exercises?.[exerciseIndex];
                    const volumeReasonMeta =
                      getExerciseVolumeReasonMeta(volumeExercise);
                    const volumeReasonTitle =
                      getExerciseVolumeReasonTitle(volumeExercise);
                    const volumeReasonChips = getExerciseVolumeChangeChips(
                      volumeExercise,
                      suggestedTrainingLevel,
                    );

                    return (
                      <div
                        key={`${session.id}_${exerciseIndex + 1}`}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex items-end gap-3">
                        <label className="flex-1">
                          <span className="text-xs uppercase tracking-[0.2em] text-[#8E97A8]">
                            Упражнение {exerciseIndex + 1}
                          </span>
                          <select
                            value={exerciseName}
                            onChange={(event) =>
                              updateSessionExercise(
                                sessionIndex,
                                exerciseIndex,
                                event.target.value,
                              )
                            }
                            className="w-full rounded-2xl border border-[#2A3140] bg-[#12151C] px-4 py-3 text-sm text-white outline-none"
                          >
                              {selectableExerciseOptions.map(
                                (availableExercise, optionIndex) => (
                                  <option
                                  key={`${availableExercise.id ?? availableExercise.name}_${optionIndex}`}
                                  value={availableExercise.name}
                                  >
                                    {availableExercise.name}
                                  </option>
                              ),
                            )}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            removeSessionExercise(sessionIndex, exerciseIndex)
                          }
                          disabled={!canRemoveExercise}
                          className="rounded-2xl border border-[#603838] px-4 py-3 text-sm text-[#FF8F8F] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Удалить
                        </button>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 ${volumeReasonMeta.surfaceClassName}`}
                        >
                          <div className="flex items-center gap-2">
                            <VolumeTrendIcon
                              iconType={volumeReasonMeta.iconType}
                              className={`h-4 w-4 ${volumeReasonMeta.textClassName}`}
                            />
                            <p
                              className={`text-sm font-medium ${volumeReasonMeta.textClassName}`}
                            >
                              {volumeReasonTitle}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {volumeReasonChips.map((chip) => (
                              <span
                                key={`${exerciseName}_${chip}`}
                                className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${volumeReasonMeta.badgeClassName}`}
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                          <p className="mt-3 text-xs leading-5 text-[#8E97A8]">
                            {getExerciseVolumeReason(volumeExercise)}
                          </p>
                          {/* legacy hidden volume block removed */}
                          <p className="hidden">
                            Почему такой объём
                          </p>
                          <p
                            className={`hidden ${getExerciseVolumeReasonMeta(
                              session.exercises?.[exerciseIndex],
                            ).textClassName}`}
                          >
                            {getExerciseVolumeReason(
                              session.exercises?.[exerciseIndex],
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}

                <button
                  type="button"
                  onClick={() => addSessionExercise(sessionIndex)}
                  disabled={
                    getUnusedSessionExerciseOptions(session).length === 0
                  }
                  className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Добавить упражнение
                </button>
              </div>
            </article>
          ))}

          {formError ? (
            <div className="rounded-2xl border border-[#603838] bg-[#2B1717] px-4 py-3 text-sm text-[#FFB3B3]">
              {formError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSavePlan()}
            disabled={isSaving || isLoadingPlan || !draftPlan}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-[#000214] disabled:opacity-60"
          >
            {isSaving ? "Сохраняем программу..." : "Сохранить тренировку"}
          </button>
        </section>
      ) : null}

      {currentTrainingPlan && editorMode === "hidden" ? (
        <section className="mx-auto mt-8 flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-white">
              Активная программа
            </h2>
            <p className="text-sm text-[#8E97A8]">
              {currentTrainingPlan.focusLabel},{" "}
              {currentTrainingPlan.workoutsPerWeek} тренировок в неделю.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {currentTrainingPlan.sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-4"
              >
                <h3 className="text-lg font-medium text-white">
                  {session.title}
                </h3>
                <p className="mt-1 text-sm text-[#8E97A8]">
                  {session.emphasis}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {session.exercises.map((exercise, exerciseIndex) => {
                    const volumeReasonMeta = getExerciseVolumeReasonMeta(exercise);
                    const volumeReasonTitle = getExerciseVolumeReasonTitle(exercise);
                    const volumeReasonChips = getExerciseVolumeChangeChips(
                      exercise,
                      currentTrainingPlan.trainingLevel,
                    );

                    return (
                      <div
                        key={`${session.id}_${exercise.id ?? exercise.name}_${exerciseIndex}`}
                        className="rounded-xl bg-[#12151C] px-3 py-3"
                      >
                        <p className="text-sm font-medium text-white">
                          {exercise.name}
                        </p>
                        <p className="mt-1 text-sm text-[#8E97A8]">
                          {exercise.prescription}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <VolumeTrendIcon
                            iconType={volumeReasonMeta.iconType}
                            className={`h-4 w-4 ${volumeReasonMeta.textClassName}`}
                          />
                          <p
                            className={`text-xs font-medium ${volumeReasonMeta.textClassName}`}
                          >
                            {volumeReasonTitle}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {volumeReasonChips.map((chip) => (
                            <span
                              key={`${exercise.name}_${chip}`}
                              className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${volumeReasonMeta.badgeClassName}`}
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#8E97A8]">
                          {getExerciseVolumeReason(exercise)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {isRebalancePromptOpen ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#030712]/80 px-5 pb-6 pt-20">
          <div className="w-full max-w-md rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
              Перестройка календаря
            </p>
            <h2 className="mt-2 text-xl font-medium text-white">
              Будущие тренировки изменятся
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#8E97A8]">
              В календаре уже есть {futurePlannedWorkoutsCount} будущ
              {futurePlannedWorkoutsCount === 1 ? "ая тренировка" : "их тренировок"}.
              После изменения программы они автоматически перестроятся под новый
              порядок дней.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  openEditor(pendingEditorAction || "edit");
                  setPendingEditorAction("");
                  setIsRebalancePromptOpen(false);
                }}
                className="rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-[#000214]"
              >
                Продолжить
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingEditorAction("");
                  setIsRebalancePromptOpen(false);
                }}
                className="rounded-3xl border border-[#2A3140] px-5 py-4 text-base font-medium text-white"
              >
                Оставить как есть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
