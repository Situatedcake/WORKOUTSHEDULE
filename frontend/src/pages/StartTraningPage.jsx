import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import clockIcon from "/icons/clock.svg";
import menuIcon from "/menu.svg";
import backIcon from "/icons/arrowBack.svg";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import {
  EXERCISES_PER_SESSION,
  TRAINING_GOALS,
  WORKOUTS_PER_WEEK_OPTIONS,
  createTrainingPlanDraft,
} from "../shared/trainingPlanBuilder";

function buildSelectionsFromPlan(trainingPlan) {
  if (!trainingPlan?.sessions) {
    return [];
  }

  return trainingPlan.sessions.map((session) => ({
    selectedExerciseNames: session.exercises.map((exercise) => exercise.name),
  }));
}

export default function StartTraningPage() {
  const { currentUser, saveCurrentUserTrainingPlan } = useAuth();
  const currentTrainingPlan = currentUser?.trainingPlan ?? null;
  const [editorMode, setEditorMode] = useState(
    currentTrainingPlan ? "hidden" : "new",
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(
    currentTrainingPlan?.workoutsPerWeek ?? 3,
  );
  const [focusKey, setFocusKey] = useState(
    currentTrainingPlan?.focusKey ?? TRAINING_GOALS[0].key,
  );
  const [sessionSelections, setSessionSelections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!currentTrainingPlan) {
      setEditorMode("new");
      return;
    }

    setWorkoutsPerWeek(currentTrainingPlan.workoutsPerWeek);
    setFocusKey(currentTrainingPlan.focusKey);
    setSessionSelections(buildSelectionsFromPlan(currentTrainingPlan));
  }, [currentTrainingPlan]);

  const draftSessions = useMemo(
    () =>
      createTrainingPlanDraft({
        workoutsPerWeek,
        focusKey,
        trainingLevel: currentUser?.trainingLevel,
      }),
    [currentUser?.trainingLevel, focusKey, workoutsPerWeek],
  );

  useEffect(() => {
    const shouldReuseExistingPlan =
      currentTrainingPlan &&
      editorMode === "edit" &&
      currentTrainingPlan.focusKey === focusKey &&
      currentTrainingPlan.workoutsPerWeek === workoutsPerWeek;

    if (shouldReuseExistingPlan) {
      setSessionSelections(buildSelectionsFromPlan(currentTrainingPlan));
      return;
    }

    setSessionSelections(
      draftSessions.map((session) => ({
        selectedExerciseNames: [...session.selectedExerciseNames],
      })),
    );
  }, [currentTrainingPlan, draftSessions, editorMode, focusKey, workoutsPerWeek]);

  function updateSessionExercise(sessionIndex, exerciseIndex, value) {
    setSessionSelections((previousSelections) =>
      previousSelections.map((selection, currentSessionIndex) => {
        if (currentSessionIndex !== sessionIndex) {
          return selection;
        }

        const nextExerciseNames = [...selection.selectedExerciseNames];
        nextExerciseNames[exerciseIndex] = value;

        return {
          ...selection,
          selectedExerciseNames: nextExerciseNames,
        };
      }),
    );
  }

  function handleEditPlan() {
    setEditorMode("edit");
    setIsMenuOpen(false);
  }

  function handleCreateNewPlan() {
    setWorkoutsPerWeek(3);
    setFocusKey(TRAINING_GOALS[0].key);
    setEditorMode("new");
    setIsMenuOpen(false);
  }

  async function handleSavePlan() {
    if (!currentUser) {
      setFormError("Войдите или зарегистрируйтесь, чтобы сохранить программу.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      await saveCurrentUserTrainingPlan({
        workoutsPerWeek,
        focusKey,
        sessionSelections,
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

  const shouldShowEditor = !currentTrainingPlan || editorMode !== "hidden";

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
                {currentTrainingPlan?.estimatedMinutesPerWeek ?? 0} минут
              </span>
              <p className="text-sm text-[#8E97A8]">
                Текущий недельный объем по программе
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[#8E97A8]">
              Сколько дней в неделю хочешь заниматься?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {WORKOUTS_PER_WEEK_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWorkoutsPerWeek(value)}
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
                  onClick={() => setFocusKey(goal.key)}
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

          {!currentUser ? (
            <div className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-6 text-center text-sm text-[#8E97A8]">
              Без аккаунта можно только посмотреть каркас. Для сохранения программы и календаря войдите в профиль.
            </div>
          ) : null}

          {draftSessions.map((session, sessionIndex) => (
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
                </div>

                <span className="text-sm text-[#8E97A8]">
                  {session.estimatedDurationMin} мин
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {Array.from(
                  { length: EXERCISES_PER_SESSION },
                  (_, exerciseIndex) => (
                    <label
                      key={`${session.id}_${exerciseIndex + 1}`}
                      className="flex flex-col gap-2"
                    >
                      <span className="text-xs uppercase tracking-[0.2em] text-[#8E97A8]">
                        Упражнение {exerciseIndex + 1}
                      </span>
                      <select
                        value={
                          sessionSelections[sessionIndex]?.selectedExerciseNames?.[
                            exerciseIndex
                          ] ??
                          session.selectedExerciseNames[exerciseIndex] ??
                          ""
                        }
                        onChange={(event) =>
                          updateSessionExercise(
                            sessionIndex,
                            exerciseIndex,
                            event.target.value,
                          )
                        }
                        className="rounded-2xl border border-[#2A3140] bg-[#12151C] px-4 py-3 text-sm text-white outline-none"
                      >
                        {session.availableExercises.map((exerciseName) => (
                          <option key={exerciseName} value={exerciseName}>
                            {exerciseName}
                          </option>
                        ))}
                      </select>
                    </label>
                  ),
                )}
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
            disabled={isSaving}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-[#000214] disabled:opacity-60"
          >
            {isSaving ? "Сохраняем программу..." : "Сохранить тренировку"}
          </button>
        </section>
      ) : null}

      {currentTrainingPlan && editorMode === "hidden" ? (
        <section className="mx-auto mt-8 flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-white">Активная программа</h2>
            <p className="text-sm text-[#8E97A8]">
              {currentTrainingPlan.focusLabel}, {currentTrainingPlan.workoutsPerWeek} тренировок в неделю.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {currentTrainingPlan.sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-4"
              >
                <h3 className="text-lg font-medium text-white">{session.title}</h3>
                <p className="mt-1 text-sm text-[#8E97A8]">{session.emphasis}</p>
                <div className="mt-4 flex flex-col gap-2">
                  {session.exercises.map((exercise) => (
                    <div
                      key={`${session.id}_${exercise.name}`}
                      className="rounded-xl bg-[#12151C] px-3 py-3"
                    >
                      <p className="text-sm font-medium text-white">{exercise.name}</p>
                      <p className="mt-1 text-sm text-[#8E97A8]">
                        {exercise.prescription}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
