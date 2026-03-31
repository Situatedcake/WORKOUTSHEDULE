import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  AdaptationTrendChart,
  BarTrendChart,
  LineTrendChart,
} from "../components/StatsCharts";
import LoadingCard from "../components/LoadingCard";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import VolumeTrendIcon from "../components/VolumeTrendIcon";
import { useAuth } from "../hooks/useAuth";
import { userRepository } from "../services/database/userRepository";
import {
  getTrainingPlanAdaptationBreakdown,
  getTrainingPlanAdaptationHighlights,
} from "../shared/trainingPlanBuilder";
import { buildWorkoutStats } from "../shared/workoutStats";
import {
  formatDateKey,
  formatWorkoutRelativeLabel,
  getNearestScheduledWorkout,
} from "../shared/workoutSchedule";

const TIME_RANGE_OPTIONS = [
  { key: "7", label: "7 дней", periodDays: 7, scopeLabel: "за 7 дней" },
  { key: "30", label: "30 дней", periodDays: 30, scopeLabel: "за 30 дней" },
  { key: "all", label: "Все время", periodDays: null, scopeLabel: "за всё время" },
];

const ADAPTATION_LEGEND = [
  { key: "progressing", label: "Прогресс", dotClassName: "bg-[#22C55E]" },
  { key: "stalled", label: "Плато", dotClassName: "bg-[#EAB308]" },
  { key: "manual", label: "Вручную", dotClassName: "bg-[#3B82F6]" },
  { key: "base", label: "База", dotClassName: "bg-[#546074]" },
];

function formatDurationMinutes(totalMinutes) {
  if (!totalMinutes) {
    return "0 мин";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} мин`;
  }

  if (minutes <= 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${minutes} мин`;
}

function formatWorkoutStatusLabel(status) {
  switch (status) {
    case "partial":
      return "Частично";
    case "skipped":
      return "Пропущена";
    case "canceled":
      return "Отменена";
    case "completed":
    default:
      return "Выполнена";
  }
}

function getAdaptationTriggerLabel(trigger) {
  switch (trigger) {
    case "post_test":
      return "после теста";
    case "manual_builder":
      return "при создании";
    case "manual_update":
      return "после правки";
    case "auto_refresh":
      return "автообновление";
    case "current_plan":
      return "текущий план";
    default:
      return "последние данные";
  }
}

function getProgressMetricLabel(metric) {
  switch (metric) {
    case "best_set_weight":
      return "лучший рабочий вес";
    case "tracked_weight":
      return "суммарный вес";
    case "body_weight":
      return "вес тела";
    default:
      return "прогресс";
  }
}

function formatProgressValue(point) {
  if (!point) {
    return "0";
  }

  return `${point.value} кг`;
}

function getStatusMeta(status) {
  switch (status) {
    case "completed":
      return {
        label: "Выполнено",
        textClassName: "text-[#67E8A5]",
        pillClassName: "bg-[#143423] text-[#8CF0B8]",
        barClassName: "bg-[#22C55E]",
      };
    case "partial":
      return {
        label: "Частично",
        textClassName: "text-[#F8D16A]",
        pillClassName: "bg-[#3A2C10] text-[#F6D27D]",
        barClassName: "bg-[#EAB308]",
      };
    case "skipped":
      return {
        label: "Пропущено",
        textClassName: "text-[#7CC7FF]",
        pillClassName: "bg-[#102C40] text-[#8BD1FF]",
        barClassName: "bg-[#3B82F6]",
      };
    case "canceled":
      return {
        label: "Отменено",
        textClassName: "text-[#F59AA3]",
        pillClassName: "bg-[#3A1418] text-[#FFB2B9]",
        barClassName: "bg-[#EF4444]",
      };
    default:
      return {
        label: "Без статуса",
        textClassName: "text-[#8E97A8]",
        pillClassName: "bg-[#1A1F2A] text-[#B9C1CF]",
        barClassName: "bg-[#546074]",
      };
  }
}

function getStatusShare(count, total) {
  if (!total) {
    return 0;
  }

  return Math.max(6, Math.round((count / total) * 100));
}

function MetricCard({
  label,
  value,
  caption,
  accentClassName = "text-white",
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-[#0B0E15] px-4 py-4">
      <p className="break-words text-xs uppercase tracking-[0.14em] text-[#667085]">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-2xl font-medium leading-7 ${accentClassName}`}
      >
        {value}
      </p>
      {caption ? (
        <p className="mt-1 break-words text-sm leading-5 text-[#8E97A8]">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <p className="break-words text-xs uppercase tracking-[0.18em] text-[#667085]">
          {eyebrow}
        </p>
        <h2 className="break-words text-xl font-medium leading-6 text-white">
          {title}
        </h2>
        {description ? (
          <p className="break-words text-sm leading-6 text-[#8E97A8]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function GraphPanel({ eyebrow, title, description, children, footer }) {
  return (
    <div className="min-w-0 rounded-[24px] bg-[#0B0E15] px-5 py-5">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="mt-4">{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

export default function StatisticPage() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const trainingPlan = currentUser?.trainingPlan ?? null;
  const trainingPlanAdaptationHistory =
    currentUser?.trainingPlanAdaptationHistory ?? [];
  const scheduledWorkouts = currentUser?.scheduledWorkouts ?? [];
  const workoutHistory = currentUser?.workoutHistory ?? [];
  const [selectedRangeKey, setSelectedRangeKey] = useState("30");
  const [remoteStats, setRemoteStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const selectedRange =
    TIME_RANGE_OPTIONS.find((item) => item.key === selectedRangeKey) ??
    TIME_RANGE_OPTIONS[1];

  const nextWorkout = getNearestScheduledWorkout(scheduledWorkouts);
  const todayDateKey = formatDateKey(new Date());
  const fallbackStats = buildWorkoutStats(workoutHistory, todayDateKey, {
    trainingPlanAdaptationHistory,
    trainingPlan,
    periodDays: selectedRange.periodDays,
  });

  const trainingPlanRefreshed = Boolean(location.state?.trainingPlanRefreshed);
  const adaptationSummary = Array.isArray(location.state?.adaptationSummary)
    ? location.state.adaptationSummary
    : [];
  const stats = remoteStats ?? fallbackStats;
  const statusItems = [
    { key: "completed", count: stats.totalCompleted ?? 0 },
    { key: "partial", count: stats.totalPartial ?? 0 },
    { key: "skipped", count: stats.totalSkipped ?? 0 },
    { key: "canceled", count: stats.totalCanceled ?? 0 },
  ];
  const totalLogged = stats.totalLogged ?? 0;
  const productiveCount =
    (stats.totalCompleted ?? 0) + (stats.totalPartial ?? 0);
  const planAdaptationBreakdown =
    getTrainingPlanAdaptationBreakdown(trainingPlan);
  const planAdaptationHighlights = getTrainingPlanAdaptationHighlights(
    trainingPlan,
    3,
  );
  const adaptationGraphItems = stats.adaptationTrend ?? [];
  const loadGraphItems = stats.loadTrend ?? [];
  const progressGraphItems = stats.progressTrend ?? [];
  const latestAdaptationPoint = adaptationGraphItems.at(-1) ?? null;
  const latestLoadPoint = loadGraphItems.at(-1) ?? null;
  const latestProgressPoint = progressGraphItems.at(-1) ?? null;
  const nextWorkoutDescription = nextWorkout
    ? `${nextWorkout.title}, ${nextWorkout.time}`
    : "Пока в календаре нет ближайшей запланированной тренировки.";

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!currentUser?.id) {
        if (isMounted) {
          setRemoteStats(null);
          setStatsError("");
        }
        return;
      }

      try {
        const nextStats = await userRepository.getWorkoutStats(currentUser.id, {
          rangeKey: selectedRange.key,
        });

        if (!isMounted) {
          return;
        }

        setRemoteStats(nextStats);
        setStatsError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRemoteStats(null);
        setStatsError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить расширенную статистику.",
        );
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, selectedRange.key]);

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">
              Статистика
            </p>
            <h1 className="text-3xl font-medium text-white">Прогресс по плану</h1>
            <p className="break-words text-sm leading-6 text-[#8E97A8]">
              Здесь видно, как ты выполняешь программу {selectedRange.scopeLabel},
              где растёт нагрузка и как меняется план под твои тренировки.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIME_RANGE_OPTIONS.map((option) => {
              const isActive = option.key === selectedRange.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedRangeKey(option.key)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-[#7CC7FF] text-[#08111F]"
                      : "bg-[#0B0E15] text-[#B9C1CF]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <Link
            to={ROUTES.WORKOUT_HISTORY}
            className="inline-flex w-full justify-center rounded-full border border-[#2A3140] px-4 py-2 text-sm text-white sm:w-fit"
          >
            Открыть историю тренировок
          </Link>
        </div>

        {trainingPlanRefreshed ? (
          <div className="rounded-2xl border border-[#1D5E4F] bg-[#0D2E28] px-4 py-4">
            <p className="text-sm font-medium text-white">
              Программа обновлена по последним тренировкам
            </p>
            {adaptationSummary.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2">
                {adaptationSummary.slice(0, 2).map((item) => (
                  <p key={item} className="break-words text-sm leading-6 text-[#9BD4C7]">
                    {item}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 break-words text-sm leading-6 text-[#9BD4C7]">
                Следующий цикл уже подстроен под твою историю выполнения и рабочие веса.
              </p>
            )}
          </div>
        ) : null}

        {statsError ? (
          <div className="rounded-2xl border border-[#5E4B1D] bg-[#2E2510] px-4 py-3 text-sm leading-6 text-[#F3D9A1]">
            Показываем локальную статистику, пока расширенные данные с сервера недоступны.
          </div>
        ) : null}

        <div className="rounded-[24px] bg-[#0B0E15] px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">
                Выполнение плана
              </p>
              <h2 className="mt-2 text-2xl font-medium text-white">
                {stats.completionRate ?? 0}%
              </h2>
            </div>

            <div className="rounded-2xl bg-[#12151C] px-4 py-3 text-center sm:min-w-[7.25rem] sm:shrink-0">
              <p className="text-xs uppercase tracking-[0.14em] text-[#667085]">
                В периоде
              </p>
              <p className="mt-2 text-xl font-medium text-white">
                {productiveCount}
              </p>
              <p className="mt-1 break-words text-xs leading-4 text-[#8E97A8]">
                полезных сессий
              </p>
            </div>
          </div>

          <p className="mt-3 break-words text-sm leading-6 text-[#8E97A8]">
            {totalLogged > 0
              ? `${productiveCount} из ${totalLogged} тренировок дали полезный объём ${selectedRange.scopeLabel}.`
              : "Как только появятся завершённые тренировки, здесь соберётся общая картина по выполнению плана."}
          </p>

          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#181D27]">
            {statusItems.map((item) => {
              if (!item.count) {
                return null;
              }

              return (
                <div
                  key={item.key}
                  className={getStatusMeta(item.key).barClassName}
                  style={{ width: `${getStatusShare(item.count, totalLogged)}%` }}
                />
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {statusItems.map((item) => {
              const meta = getStatusMeta(item.key);

              return (
                <div
                  key={item.key}
                  className="min-w-0 rounded-2xl bg-[#12151C] px-4 py-3"
                >
                  <p className="break-words text-sm text-[#8E97A8]">
                    {meta.label}
                  </p>
                  <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
                    <p
                      className={`min-w-0 break-words text-2xl font-medium ${meta.textClassName}`}
                    >
                      {item.count}
                    </p>
                    <p className="shrink-0 text-xs text-[#667085]">
                      {totalLogged
                        ? `${Math.round((item.count / totalLogged) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <GraphPanel
          eyebrow="Адаптация"
          title="Как план менялся"
          description={`История обновлений программы ${selectedRange.scopeLabel}. Здесь видно, как часто система меняла объём и упражнения.`}
          footer={
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ADAPTATION_LEGEND.map((item) => (
                  <div
                    key={item.key}
                    className="flex min-w-0 items-center gap-2 rounded-full bg-[#12151C] px-3 py-1.5 text-xs text-[#B9C1CF]"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>

              {latestAdaptationPoint ? (
                <div className="min-w-0 rounded-2xl bg-[#12151C] px-4 py-3">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-medium text-white">
                      Последняя адаптация
                    </p>
                    <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-[#8E97A8]">
                      {getAdaptationTriggerLabel(latestAdaptationPoint.trigger)}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-sm leading-6 text-[#8E97A8]">
                    {latestAdaptationPoint.changedExercisesCount} изменений в упражнениях и объёме.
                  </p>
                </div>
              ) : (
                <p className="break-words text-sm leading-6 text-[#8E97A8]">
                  Как только план начнёт обновляться, здесь появится история его изменений по циклам.
                </p>
              )}
            </div>
          }
        >
          <AdaptationTrendChart items={adaptationGraphItems} />
        </GraphPanel>

        <GraphPanel
          eyebrow="Нагрузка"
          title="Объём по неделям"
          description={`Недельный график по фактическому времени тренировки ${selectedRange.scopeLabel}. Чем выше столбец, тем плотнее был цикл.`}
          footer={
            latestLoadPoint ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Последняя неделя"
                  value={formatDurationMinutes(latestLoadPoint.totalMinutes)}
                  caption={`${latestLoadPoint.productiveWorkouts} занятий`}
                  accentClassName="text-[#F8D16A]"
                />
                <MetricCard label="Калории" value={latestLoadPoint.calories ?? 0} />
                <MetricCard
                  label="Объём веса"
                  value={`${latestLoadPoint.trackedWeightKg ?? 0} кг`}
                />
              </div>
            ) : null
          }
        >
          <BarTrendChart
            items={loadGraphItems}
            getValue={(item) => item.totalMinutes}
            colorClassName="bg-[#F8D16A]"
          />
        </GraphPanel>

        <GraphPanel
          eyebrow="Прогресс"
          title="Тренд силы"
          description={`Линия показывает последний доступный маркер прогресса ${selectedRange.scopeLabel}: лучший вес в подходе, суммарный вес или вес тела.`}
          footer={
            latestProgressPoint ? (
              <div className="min-w-0 rounded-2xl bg-[#12151C] px-4 py-3">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 break-words text-sm font-medium text-white">
                    Последняя точка
                  </p>
                  <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-[#8E97A8]">
                    {getProgressMetricLabel(latestProgressPoint.metric)}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm leading-6 text-[#8E97A8]">
                  {formatProgressValue(latestProgressPoint)} на {latestProgressPoint.label}
                </p>
              </div>
            ) : (
              <p className="break-words text-sm leading-6 text-[#8E97A8]">
                Как только в истории накопятся веса по подходам или данные по весу тела,
                здесь появится наглядный тренд.
              </p>
            )
          }
        >
          <LineTrendChart
            items={progressGraphItems}
            getValue={(item) => item.value}
          />
        </GraphPanel>

        {trainingPlan ? (
          <div className="rounded-[24px] bg-[#0B0E15] px-5 py-5">
            <SectionHeading
              eyebrow="Адаптация"
              title="Почему план выглядит именно так"
              description="Расшифровка текущих изменений внутри активной программы."
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              {planAdaptationBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="min-w-0 rounded-2xl bg-[#12151C] px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <VolumeTrendIcon
                      iconType={item.meta.iconType}
                      className={`h-4 w-4 ${item.meta.textClassName}`}
                    />
                    <p className="break-words text-sm text-[#8E97A8]">
                      {item.meta.label}
                    </p>
                  </div>
                  <p
                    className={`mt-2 break-words text-2xl font-medium ${item.meta.textClassName}`}
                  >
                    {item.count}
                  </p>
                </div>
              ))}
            </div>

            {planAdaptationHighlights.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {planAdaptationHighlights.map((item) => (
                  <div
                    key={`${item.sessionId}_${item.exercise.id ?? item.exercise.name}`}
                    className={`rounded-2xl px-4 py-4 ${item.meta.surfaceClassName}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <VolumeTrendIcon
                            iconType={item.meta.iconType}
                            className={`h-4 w-4 ${item.meta.textClassName}`}
                          />
                          <p
                            className={`min-w-0 break-words text-sm font-medium ${item.meta.textClassName}`}
                          >
                            {item.reasonTitle}
                          </p>
                        </div>
                        <p className="mt-2 break-words text-sm font-medium text-white">
                          {item.exercise.name}
                        </p>
                        <p className="mt-1 break-words text-xs text-[#8E97A8]">
                          {item.sessionTitle}
                        </p>
                      </div>

                      <span
                        className={`max-w-full rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${item.meta.badgeClassName}`}
                      >
                        {item.meta.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.chips.map((chip) => (
                        <span
                          key={`${item.exercise.name}_${chip}`}
                          className={`max-w-full break-words rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${item.meta.badgeClassName}`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 break-words text-sm leading-6 text-[#8E97A8]">
                      {item.exercise.volumeReason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 break-words text-sm leading-6 text-[#8E97A8]">
                Пока активная программа идёт по базовому объёму. Как только появятся
                прогресс по весам, плато или ручные правки, здесь будет видно, что именно поменялось.
              </p>
            )}
          </div>
        ) : null}

        <SectionHeading
          eyebrow="Сводка"
          title="Короткие метрики"
          description={`Главные цифры по регулярности, времени и текущему уровню ${selectedRange.scopeLabel}.`}
        />

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Серия"
            value={stats.streakDays}
            caption="дней подряд"
            accentClassName="text-[#67E8A5]"
          />
          <MetricCard
            label="Средняя длительность"
            value={formatDurationMinutes(stats.averageDurationMinutes)}
          />
          <MetricCard
            label="Калории"
            value={stats.caloriesThisMonth}
            caption="в текущем месяце"
            accentClassName="text-[#F8D16A]"
          />
          <MetricCard
            label="Уровень"
            value={currentUser?.trainingLevel ?? "Не определен"}
          />
        </div>

        <div className="rounded-[24px] bg-[#0B0E15] px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading
              eyebrow="Ближайшее"
              title={formatWorkoutRelativeLabel(nextWorkout)}
              description={nextWorkoutDescription}
            />
            <div className="rounded-2xl bg-[#12151C] px-4 py-3 text-center sm:min-w-[6.5rem] sm:shrink-0">
              <p className="text-xs uppercase tracking-[0.14em] text-[#667085]">
                В календаре
              </p>
              <p className="mt-2 text-xl font-medium text-white">
                {remoteStats?.scheduledWorkoutsCount ?? scheduledWorkouts.length}
              </p>
              <p className="mt-1 text-xs text-[#8E97A8]">занятий</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Весовые подходы"
            value={stats.trackedSetCount}
            accentClassName="text-[#7CC7FF]"
          />
          <MetricCard
            label="Лучший вес"
            value={`${stats.personalBestSetWeightKg || 0} кг`}
          />
          <MetricCard
            label="Суммарный вес"
            value={`${stats.totalTrackedWeightKg} кг`}
          />
          <MetricCard
            label="Последний вес тела"
            value={
              stats.latestRecordedWeightKg != null
                ? `${stats.latestRecordedWeightKg} кг`
                : "Нет данных"
            }
          />
        </div>

        <div className="rounded-[24px] bg-[#0B0E15] px-5 py-5">
          <SectionHeading
            eyebrow="Лидеры"
            title="Топ упражнений по весам"
            description={`Какие упражнения ${selectedRange.scopeLabel} дали больше всего накопленного рабочего веса.`}
          />

          {stats.topExercises.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              {stats.topExercises.map((exercise, index) => (
                <div
                  key={exercise.exerciseName}
                  className="min-w-0 rounded-2xl bg-[#12151C] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-white">
                        {exercise.exerciseName}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#8E97A8]">
                        {exercise.trackedSets} подходов с весом
                      </p>
                    </div>
                    <div className="shrink-0 rounded-full bg-[#1C2431] px-3 py-1 text-xs text-[#B9C1CF]">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#8E97A8]">Лучший подход</span>
                    <span className="shrink-0 font-medium text-white">
                      {exercise.bestSetWeight} кг
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 break-words text-sm leading-6 text-[#8E97A8]">
              Как только начнёшь записывать веса по подходам, здесь появятся упражнения-лидеры
              и станет видно, где идёт лучший рост.
            </p>
          )}
        </div>

        <div className="rounded-[24px] bg-[#0B0E15] px-5 py-5">
          <SectionHeading
            eyebrow="История"
            title="Последние тренировки"
            description={`Быстрый журнал последних сессий ${selectedRange.scopeLabel} со статусами, временем и фактическим объёмом.`}
          />

          {stats.recentWorkouts.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              {stats.recentWorkouts.map((workout) => {
                const meta = getStatusMeta(workout.status ?? "completed");

                return (
                  <div
                    key={workout.id}
                    className="min-w-0 rounded-2xl bg-[#12151C] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-white">
                          {workout.title}
                        </p>
                        <p className="mt-1 break-words text-xs text-[#8E97A8]">
                          {workout.date}, {workout.time}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs ${meta.pillClassName}`}
                      >
                        {formatWorkoutStatusLabel(workout.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="min-w-0 rounded-xl bg-[#0F131B] px-2 py-2">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                          Время
                        </p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {formatDurationMinutes(
                            Math.round(
                              (workout.actualDurationSeconds ??
                                workout.durationSeconds ??
                                0) / 60,
                            ),
                          )}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-xl bg-[#0F131B] px-2 py-2">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                          Подходы
                        </p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {workout.completedSetsCount ?? 0}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-xl bg-[#0F131B] px-2 py-2">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                          Калории
                        </p>
                        <p className="mt-1 break-words text-sm font-medium text-white">
                          {workout.metrics?.burnedCalories ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 break-words text-sm leading-6 text-[#8E97A8]">
              После первой завершённой тренировки здесь появится история по сессиям и статусам выполнения.
            </p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
