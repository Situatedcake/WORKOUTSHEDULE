import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import PageBackButton from "../../components/PageBackButton";
import PageShell from "../../components/PageShell";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { formatDuration } from "../../shared/activeWorkout";
import {
  clearEntireActiveWorkoutSession,
  getActiveWorkoutResultDraft,
} from "../../utils/activeWorkoutSession";

function formatWeightValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "Без веса";
  }

  return Number.isInteger(numericValue)
    ? `${numericValue} кг`
    : `${numericValue.toFixed(1)} кг`;
}

function SummaryCard({ label, value, caption }) {
  return (
    <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium text-white">{value}</p>
      {caption ? (
        <p className="mt-1 text-sm leading-5 text-[#8E97A8]">{caption}</p>
      ) : null}
    </div>
  );
}

export default function FinishTrainingPage() {
  const navigate = useNavigate();
  const { currentUser, completeCurrentUserWorkout } = useAuth();
  const resultDraft = getActiveWorkoutResultDraft();
  const [weightKg, setWeightKg] = useState("");
  const [burnedCalories, setBurnedCalories] = useState("");
  const [energyLevel, setEnergyLevel] = useState("3");
  const [effortLevel, setEffortLevel] = useState("3");
  const [sleepQuality, setSleepQuality] = useState("3");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const exerciseStats = useMemo(
    () =>
      Array.isArray(resultDraft?.exerciseSetWeights)
        ? resultDraft.exerciseSetWeights.map((exercise) => ({
            ...exercise,
            weightsKg: Array.isArray(exercise.weightsKg)
              ? exercise.weightsKg
              : [],
          }))
        : [],
    [resultDraft?.exerciseSetWeights],
  );

  const plannedSetsCount = Number(resultDraft?.totalSets) || 0;
  const completedSetsCount = Number(resultDraft?.completedSetsCount) || 0;
  const plannedExercisesCount = Number(resultDraft?.totalExercisesCount) || 0;
  const completedExercisesCount =
    Number(resultDraft?.completedExercisesCount) || 0;

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!resultDraft?.scheduledWorkoutId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  async function handleCloseWorkout() {
    setIsSaving(true);
    setSaveError("");

    try {
      const workoutStatus =
        plannedSetsCount > 0 &&
        completedSetsCount >= plannedSetsCount &&
        completedExercisesCount >= plannedExercisesCount
          ? "completed"
          : "partial";

      const completionResult = await completeCurrentUserWorkout(
        resultDraft.scheduledWorkoutId,
        {
          status: workoutStatus,
          startedAt: resultDraft.startedAt ?? null,
          plannedDurationSeconds: resultDraft.plannedDurationSeconds ?? 0,
          plannedSetsCount,
          durationSeconds: resultDraft.durationSeconds,
          completedExercisesCount,
          completedSetsCount,
          exerciseSetWeights: resultDraft.exerciseSetWeights ?? [],
          weightKg,
          burnedCalories,
          energyLevel,
          effortLevel,
          sleepQuality,
        },
      );

      clearEntireActiveWorkoutSession();
      navigate(ROUTES.STATS, {
        state: {
          trainingPlanRefreshed: Boolean(
            completionResult?.trainingPlanRefreshed,
          ),
          adaptationSummary: Array.isArray(completionResult?.adaptationSummary)
            ? completionResult.adaptationSummary
            : [],
        },
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Не удалось завершить тренировку.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell className="pt-5" showNavMenu={false}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <PageBackButton fallbackTo={ROUTES.WORKOUT_ACTIVE} />

        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
            Тренировка завершена
          </p>
          <h1 className="text-3xl font-medium text-white">
            {resultDraft.title}
          </h1>
          <p className="text-sm leading-6 text-[#8E97A8]">
            {resultDraft.date}, {resultDraft.time}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Время"
            value={formatDuration(resultDraft.durationSeconds)}
            caption="фактическая длительность"
          />
          <SummaryCard
            label="Подходы"
            value={`${completedSetsCount}/${plannedSetsCount}`}
            caption="выполнено от плана"
          />
          <SummaryCard
            label="Упражнения"
            value={`${completedExercisesCount}/${plannedExercisesCount}`}
            caption="закрыто за сессию"
          />
          <SummaryCard
            label="Статус"
            value={
              completedSetsCount >= plannedSetsCount &&
              completedExercisesCount >= plannedExercisesCount
                ? "Полностью"
                : "Частично"
            }
            caption="результат тренировки"
          />
        </div>

        {exerciseStats.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
                Статистика по тренировке
              </p>
              <h2 className="text-lg font-medium text-white">
                Упражнения и рабочие веса
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {exerciseStats.map((exercise, exerciseIndex) => (
                <article
                  key={`${exercise.exerciseId ?? exercise.exerciseName}_${exerciseIndex}`}
                  className="rounded-2xl bg-[#0B0E15] px-4 py-4"
                >
                  <h3 className="text-base font-medium text-white">
                    {exercise.exerciseName}
                  </h3>

                  <div className="mt-3 flex flex-col gap-2">
                    {exercise.weightsKg.map((weightValue, setIndex) => (
                      <div
                        key={`${exercise.exerciseId ?? exercise.exerciseName}_${setIndex + 1}`}
                        className="flex items-center justify-between rounded-xl border border-[#2A3140] bg-[#12151C] px-3 py-3"
                      >
                        <span className="text-sm text-[#8E97A8]">
                          Подход {setIndex + 1}
                        </span>
                        <span className="text-sm font-medium text-white">
                          {formatWeightValue(weightValue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Вес, кг</span>
            <input
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              inputMode="decimal"
              placeholder="Например, 72.5"
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Сожжено калорий</span>
            <input
              value={burnedCalories}
              onChange={(event) => setBurnedCalories(event.target.value)}
              inputMode="numeric"
              placeholder="Например, 410"
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-white outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Энергия</span>
            <select
              value={energyLevel}
              onChange={(event) => setEnergyLevel(event.target.value)}
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-3 py-3 text-white outline-none"
            >
              <option value="1">1/5</option>
              <option value="2">2/5</option>
              <option value="3">3/5</option>
              <option value="4">4/5</option>
              <option value="5">5/5</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Усилие</span>
            <select
              value={effortLevel}
              onChange={(event) => setEffortLevel(event.target.value)}
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-3 py-3 text-white outline-none"
            >
              <option value="1">1/5</option>
              <option value="2">2/5</option>
              <option value="3">3/5</option>
              <option value="4">4/5</option>
              <option value="5">5/5</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Сон</span>
            <select
              value={sleepQuality}
              onChange={(event) => setSleepQuality(event.target.value)}
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-3 py-3 text-white outline-none"
            >
              <option value="1">1/5</option>
              <option value="2">2/5</option>
              <option value="3">3/5</option>
              <option value="4">4/5</option>
              <option value="5">5/5</option>
            </select>
          </label>
        </div>

        {saveError ? (
          <div className="rounded-2xl border border-[#603838] bg-[#2B1717] px-4 py-3 text-sm text-[#FFB3B3]">
            {saveError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleCloseWorkout()}
          disabled={isSaving}
          className="rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-[#000214] disabled:opacity-60"
        >
          {isSaving ? "Сохраняем тренировку..." : "Закрыть тренировку"}
        </button>
      </section>
    </PageShell>
  );
}
