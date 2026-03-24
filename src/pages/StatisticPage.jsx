import PageShell from "../components/PageShell";
import { useAuth } from "../hooks/useAuth";
import {
  formatDateKey,
  formatWorkoutRelativeLabel,
  getNearestScheduledWorkout,
} from "../shared/workoutSchedule";

export default function StatisticPage() {
  const { currentUser } = useAuth();
  const scheduledWorkouts = currentUser?.scheduledWorkouts ?? [];
  const workoutHistory = currentUser?.workoutHistory ?? [];
  const nextWorkout = getNearestScheduledWorkout(scheduledWorkouts);
  const currentMonth = formatDateKey(new Date()).slice(0, 7);
  const completedThisMonth = workoutHistory.filter((workout) =>
    workout.date.startsWith(currentMonth),
  );
  const caloriesThisMonth = completedThisMonth.reduce(
    (total, workout) => total + (workout.metrics?.burnedCalories ?? 0),
    0,
  );
  const latestWorkout = workoutHistory.at(-1) ?? null;

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
            Статистика
          </p>
          <h1 className="text-3xl font-medium text-white">Общая сводка</h1>
          <p className="text-base leading-6 text-[#8E97A8]">
            Здесь уже собираются базовые данные по завершенным тренировкам,
            уровню подготовки и ближайшему занятию.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
            <p className="text-sm text-[#8E97A8]">Выполнено в месяце</p>
            <p className="mt-2 text-2xl font-medium text-white">
              {completedThisMonth.length}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
            <p className="text-sm text-[#8E97A8]">Калории за месяц</p>
            <p className="mt-2 text-2xl font-medium text-white">
              {caloriesThisMonth}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
            <p className="text-sm text-[#8E97A8]">Уровень</p>
            <p className="mt-2 text-2xl font-medium text-white">
              {currentUser?.trainingLevel ?? "Не определен"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
            <p className="text-sm text-[#8E97A8]">Последняя тренировка</p>
            <p className="mt-2 text-lg font-medium text-white">
              {latestWorkout?.title ?? "Пока нет"}
            </p>
            {latestWorkout?.date ? (
              <p className="mt-2 text-sm text-[#8E97A8]">{latestWorkout.date}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
          <p className="text-sm text-[#8E97A8]">Следующее занятие</p>
          <p className="mt-2 text-xl font-medium text-white">
            {formatWorkoutRelativeLabel(nextWorkout)}
          </p>
          <p className="mt-2 text-sm text-[#8E97A8]">
            {nextWorkout
              ? `${nextWorkout.title}, ${nextWorkout.time}`
              : "Когда в календаре появится новая тренировка, здесь будет ближайшее занятие."}
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-[#2A3140] px-4 py-5 text-sm leading-6 text-[#8E97A8]">
          Позже сюда можно будет добавить графики, streak, историю веса и
          прогресс по упражнениям, а пока страница уже показывает живые данные
          из завершенных тренировок.
        </div>
      </section>
    </PageShell>
  );
}
