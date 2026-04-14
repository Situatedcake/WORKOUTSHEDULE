import { useMemo } from "react";
import { Navigate } from "react-router";
import PageBackButton from "../../components/PageBackButton";
import PageShell from "../../components/PageShell";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { formatDuration } from "../../shared/activeWorkout";

function getStatusMeta(status) {
  switch (status) {
    case "completed":
      return {
        label: "Выполнена",
        className: "bg-[#143423] text-[#8CF0B8]",
      };
    case "partial":
      return {
        label: "Частично",
        className: "bg-[#3A2C10] text-[#F6D27D]",
      };
    case "skipped":
      return {
        label: "Пропущена",
        className: "bg-[#102C40] text-[#8BD1FF]",
      };
    case "canceled":
      return {
        label: "Отменена",
        className: "bg-[#3A1418] text-[#FFB2B9]",
      };
    default:
      return {
        label: "Без статуса",
        className: "bg-[#1A1F2A] text-[#B9C1CF]",
      };
  }
}

function formatMetricValue(value, suffix = "") {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "Нет";
  }

  return suffix ? `${numericValue}${suffix}` : String(numericValue);
}

export default function WorkoutHistoryPage() {
  const { currentUser } = useAuth();
  const history = useMemo(
    () =>
      [...(currentUser?.workoutHistory ?? [])].sort((left, right) =>
        String(right.completedAt ?? right.finishedAt ?? "").localeCompare(
          String(left.completedAt ?? left.finishedAt ?? ""),
        ),
      ),
    [currentUser?.workoutHistory],
  );

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
        <PageBackButton fallbackTo={ROUTES.STATS} />

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
            История
          </p>
          <h1 className="text-3xl font-medium text-[var(--text-primary)]">Все тренировки</h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Журнал завершённых, частичных, пропущенных и отменённых сессий.
          </p>
        </div>

        {history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map((workout, workoutIndex) => {
              const statusMeta = getStatusMeta(workout.status);

              return (
                <article
                  key={`${workout.id ?? workout.scheduledWorkoutId}_${workoutIndex}`}
                  className="rounded-[24px] bg-[var(--surface-secondary)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-medium text-[var(--text-primary)]">
                        {workout.title}
                      </h2>
                      <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
                        {workout.date}, {workout.time}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Время
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {formatDuration(workout.actualDurationSeconds ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Подходы
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {workout.completedSetsCount ?? 0}/
                        {workout.summary?.plannedSetsCount ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Калории
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {formatMetricValue(workout.metrics?.burnedCalories)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Вес тела
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {formatMetricValue(workout.metrics?.weightKg, " кг")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Энергия
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {formatMetricValue(workout.metrics?.energyLevel, "/5")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Усилие
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {formatMetricValue(workout.metrics?.effortLevel, "/5")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                        Сон
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {formatMetricValue(workout.metrics?.sleepQuality, "/5")}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(workout.exerciseSetWeights) &&
                  workout.exerciseSetWeights.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-2">
                      {workout.exerciseSetWeights.map((exercise, exerciseIndex) => (
                        <div
                          key={`${exercise.exerciseId ?? exercise.exerciseName}_${exerciseIndex}`}
                          className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 break-words text-sm font-medium text-[var(--text-primary)]">
                              {exercise.exerciseName}
                            </p>
                            <span className="shrink-0 text-xs text-[var(--text-muted)]">
                              {exercise.completedSetsCount ?? 0}/
                              {exercise.plannedSetsCount ?? exercise.sets ?? 0}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {(exercise.weightsKg ?? []).map((weightValue, setIndex) => (
                              <span
                                key={`${exercise.exerciseName}_${setIndex + 1}`}
                                className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-xs text-[#D7DEE9]"
                              >
                                {setIndex + 1}: {formatMetricValue(weightValue, " кг")}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] bg-[var(--surface-secondary)] px-5 py-5 text-sm leading-6 text-[var(--text-muted)]">
            После первой завершённой или пропущенной тренировки здесь появится
            полный журнал сессий.
          </div>
        )}
      </section>
    </PageShell>
  );
}
