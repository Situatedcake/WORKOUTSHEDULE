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

    return getRecommendedTrainingSetup(suggestedTrainingLevel);
  }, [location.state, suggestedTrainingLevel]);

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

  const shouldShowEditor = !currentTrainingPlan || editorMode !== "hidden";
  const draftEstimatedMinutesPerWeek = draftPlan?.estimatedMinutesPerWeek ?? 0;

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
              focusKey,
              workoutsPerWeek,
              time: 45,
              workoutHistory: currentUser?.workoutHistory ?? [],
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
    currentUser?.workoutHistory,
    editorMode,
    focusKey,
    shouldShowEditor,
    suggestedTrainingLevel,
    workoutsPerWeek,
  ]);

  function updateSessionExercise(sessionIndex, exerciseIndex, value) {
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

  function handleEditPlan() {
    setEditorMode("edit");
    setIsMenuOpen(false);
  }

  function handleCreateNewPlan() {
    setWorkoutsPerWeek(suggestedSetup.workoutsPerWeek);
    setFocusKey(suggestedSetup.focusKey);
    setEditorMode("new");
    setIsMenuOpen(false);
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

    setIsSaving(true);
    setFormError("");

    try {
      await saveCurrentUserTrainingPlan({
        workoutsPerWeek: draftPlan.workoutsPerWeek,
        focusKey: draftPlan.focusKey,
        trainingPlan: draftPlan,
      });
      setEditorMode("hidden");
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
            <div className="flex flex-col gap-3">
              {TRAINING_GOALS.map((goal) => (
                <button
                  key={goal.key}
                  type="button"
                  onClick={() => {
                    setFocusKey(goal.key);
                    setEditorMode("new");
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    focusKey === goal.key
                      ? "border-[#01BB96] bg-[#0D3A33]"
                      : "border-[#2A3140] bg-[#0B0E15]"
                  }`}
                >
                  <span className="block text-base font-medium text-white">
                    {goal.label}
                  </span>
                  <span className="mt-1 block text-sm text-[#8E97A8]">
                    {goal.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white">Псевдо-ML рекомендует</p>
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
                  {session.estimatedDurationMin} мин
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
    </PageShell>
  );
}
