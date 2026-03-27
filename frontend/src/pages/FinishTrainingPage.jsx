import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import { formatDuration } from "../shared/activeWorkout";
import {
  clearEntireActiveWorkoutSession,
  getActiveWorkoutResultDraft,
} from "../utils/activeWorkoutSession";

export default function FinishTrainingPage() {
  const navigate = useNavigate();
  const { currentUser, completeCurrentUserWorkout } = useAuth();
  const resultDraft = getActiveWorkoutResultDraft();
  const [weightKg, setWeightKg] = useState("");
  const [burnedCalories, setBurnedCalories] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
      await completeCurrentUserWorkout(resultDraft.scheduledWorkoutId, {
        durationSeconds: resultDraft.durationSeconds,
        completedExercisesCount: resultDraft.completedExercisesCount,
        completedSetsCount: resultDraft.completedSetsCount,
        weightKg,
        burnedCalories,
      });
      clearEntireActiveWorkoutSession();
      navigate(ROUTES.STATS);
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
          <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
              Время
            </p>
            <p className="mt-2 text-2xl font-medium text-white">
              {formatDuration(resultDraft.durationSeconds)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
              Подходы
            </p>
            <p className="mt-2 text-2xl font-medium text-white">
              {resultDraft.completedSetsCount}
            </p>
          </div>
        </div>

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
