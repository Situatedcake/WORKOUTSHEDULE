import { useMemo } from "react";
import { Link } from "react-router";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import {
  formatWorkoutRelativeLabel,
  getNearestScheduledWorkout,
} from "../shared/workoutSchedule";
import { getMomentumMeta, getTierMeta } from "../shared/gamificationUi";

function SettingsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75Z"
        stroke="#D9D9D9"
        strokeWidth="1.8"
      />
      <path
        d="M19.14 12.94C19.18 12.63 19.2 12.32 19.2 12C19.2 11.68 19.18 11.36 19.14 11.06L21.18 9.47C21.36 9.33 21.42 9.07 21.31 8.86L19.38 5.52C19.27 5.3 19.01 5.21 18.78 5.28L16.38 6.05C15.89 5.67 15.35 5.35 14.76 5.12L14.24 2.58C14.2 2.34 13.99 2.17 13.74 2.17H10.26C10.01 2.17 9.8 2.34 9.76 2.58L9.24 5.12C8.65 5.35 8.1 5.67 7.62 6.05L5.22 5.28C4.99 5.21 4.73 5.3 4.62 5.52L2.69 8.86C2.58 9.07 2.64 9.33 2.82 9.47L4.86 11.06C4.82 11.36 4.8 11.68 4.8 12C4.8 12.32 4.82 12.63 4.86 12.94L2.82 14.53C2.64 14.67 2.58 14.93 2.69 15.14L4.62 18.48C4.73 18.7 4.99 18.79 5.22 18.72L7.62 17.95C8.1 18.33 8.65 18.65 9.24 18.88L9.76 21.42C9.8 21.66 10.01 21.83 10.26 21.83H13.74C13.99 21.83 14.2 21.66 14.24 21.42L14.76 18.88C15.35 18.65 15.89 18.33 16.38 17.95L18.78 18.72C19.01 18.79 19.27 18.7 19.38 18.48L21.31 15.14C21.42 14.93 21.36 14.67 21.18 14.53L19.14 12.94Z"
        stroke="#D9D9D9"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function UserPage() {
  const { currentUser, isAuthReady, authError } = useAuth();
  const nextWorkout = useMemo(
    () => getNearestScheduledWorkout(currentUser?.scheduledWorkouts ?? []),
    [currentUser?.scheduledWorkouts],
  );
  const gamification = currentUser?.gamification ?? null;
  const featuredAchievements = gamification?.achievements?.featured ?? [];
  const nextAchievement = gamification?.achievements?.nextUp ?? null;
  const tierMeta = gamification
    ? getTierMeta(gamification.rating.tierKey)
    : getTierMeta("starter");
  const momentumMeta = getMomentumMeta(gamification?.momentum?.key ?? "starting");

  if (!isAuthReady) {
    return (
      <PageShell className="pt-5">
        <section className="mx-auto w-full max-w-md rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6 text-[#8E97A8]">
          Загрузка профиля...
        </section>
      </PageShell>
    );
  }

  if (authError) {
    return (
      <PageShell className="pt-5">
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-white">Профиль</h1>
            <p className="text-sm leading-6 text-[#FF9F9F]">{authError}</p>
            <p className="text-sm leading-6 text-[#8E97A8]">
              Проверьте, запущен ли backend и доступен ли MySQL. После этого
              обновите страницу.
            </p>
          </div>

          <Link
            to={ROUTES.HOME}
            className="rounded-3xl border border-[#2A3140] px-5 py-4 text-center text-base font-medium text-white"
          >
            На главную
          </Link>
        </section>
      </PageShell>
    );
  }

  if (!currentUser) {
    return (
      <PageShell className="pt-5">
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-white">Профиль</h1>
            <p className="text-sm leading-6 text-[#8E97A8]">
              Войдите или зарегистрируйтесь, чтобы сохранять результаты теста,
              план тренировок и календарь.
            </p>
          </div>

          <Link
            to={ROUTES.LOGIN}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
          >
            Войти
          </Link>

          <Link
            to={ROUTES.REGISTER}
            className="rounded-3xl border border-[#2A3140] px-5 py-4 text-center text-base font-medium text-white"
          >
            Зарегистрироваться
          </Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell className="pt-5">
      <section className="relative mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <Link
          to={ROUTES.USER_EDIT}
          aria-label="Редактировать профиль"
          className="absolute right-2 top-2 rounded-2xl border border-[#2A3140] bg-[#0B0E15] p-2.5 text-white transition active:scale-[0.97]"
        >
          <SettingsIcon />
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-3xl bg-[#1D222D]">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt="Фото профиля"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-white">
                  {(currentUser.name ?? currentUser.login ?? "Г")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-2 pr-12">
              <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
                Профиль
              </p>
              <h1 className="break-words text-3xl font-medium leading-9 text-white">
                {currentUser.name ?? currentUser.login}
              </h1>
              <p className="break-words text-sm leading-6 text-[#8E97A8]">
                {currentUser.email || "Почта пока не добавлена"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-2xl bg-[#0B0E15] px-3 py-4 text-center">
            <p className="text-xs leading-5 text-[#8E97A8]">
              Уровень подготовки
            </p>
            <p className="mt-2 break-words text-center text-lg font-medium text-white">
              {currentUser.trainingLevel}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl bg-[#0B0E15] px-3 py-4 text-center">
            <p className="text-xs leading-5 text-[#8E97A8]">Последний тест</p>
            <p className="mt-2 break-words text-lg font-medium text-white">
              {currentUser.lastTestScore ?? "Нет"}
            </p>
          </div>
        </div>

        {gamification ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`min-w-0 rounded-2xl border px-4 py-4 ${tierMeta.panelClassName}`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#8E97A8]">
                  Рейтинг
                </p>
                <p className="mt-2 break-words text-2xl font-medium text-white">
                  {gamification.rating.score}
                </p>
                <p className={`mt-1 text-sm ${tierMeta.accentClassName}`}>
                  {gamification.rating.tierLabel}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1D222D]">
                  <div
                    className={`h-full rounded-full ${tierMeta.progressClassName}`}
                    style={{
                      width: `${gamification.rating.progressPercent}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-[#8E97A8]">
                  {gamification.rating.nextTierLabel
                    ? `До ${gamification.rating.nextTierLabel}: ${gamification.rating.pointsToNextTier}`
                    : "Максимальный ранг открыт"}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl bg-[#0B0E15] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8E97A8]">
                  Достижения
                </p>
                <p className="mt-2 break-words text-2xl font-medium text-white">
                  {gamification.achievements.unlockedCount}/
                  {gamification.achievements.totalCount}
                </p>
                <p className="mt-1 text-sm text-[#8E97A8]">
                  Открыто {gamification.achievements.completionPercent}%
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1D222D]">
                  <div
                    className="h-full rounded-full bg-[#3B82F6]"
                    style={{
                      width: `${gamification.achievements.completionPercent}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-[#8E97A8]">
                  Серия: {gamification.summary.streakDays} дн.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8E97A8]">
                    Импульс
                  </p>
                  <p className={`mt-2 text-lg font-medium ${momentumMeta.accentClassName}`}>
                    {gamification.momentum?.label ?? momentumMeta.label}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-[#8E97A8]">
                    {gamification.momentum?.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${momentumMeta.badgeClassName}`}
                >
                  {gamification.summary.recentProductiveWorkoutsCount ?? 0} / 14 дн.
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#8E97A8]">Зачатки прогресса</p>
                  <p className="mt-1 text-xl font-medium text-white">
                    Достижения и рейтинг
                  </p>
                </div>
                <span className="rounded-full bg-[#12151C] px-3 py-1 text-xs text-[#8E97A8]">
                  beta
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {featuredAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="rounded-2xl border border-[#2A3140] bg-[#12151C] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-white">
                          {achievement.title}
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-[#8E97A8]">
                          {achievement.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                          achievement.unlocked
                            ? "bg-[#143423] text-[#8CF0B8]"
                            : "bg-[#1A1F2A] text-[#B9C1CF]"
                        }`}
                      >
                        {achievement.unlocked
                          ? "Открыто"
                          : `${achievement.current}/${achievement.target}`}
                      </span>
                    </div>
                    {!achievement.unlocked ? (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1D222D]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${achievement.progressPercent}%`,
                            backgroundColor: achievement.accentColor,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {nextAchievement ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[#2A3140] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8E97A8]">
                    Следующая цель
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {nextAchievement.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#8E97A8]">
                    {nextAchievement.description}
                  </p>
                </div>
              ) : null}

              <Link
                to={ROUTES.USER_ACHIEVEMENTS}
                className="mt-4 block w-full min-w-0 rounded-3xl border border-[#2A3140] px-5 py-4 text-center text-sm font-medium leading-5 text-white"
              >
                Открыть экран достижений
              </Link>
            </div>
          </>
        ) : null}

        {currentUser.lastTestScore == null ? (
          <Link
            to={ROUTES.START_TASTING}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
          >
            Пройти тест
          </Link>
        ) : null}

        <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
          <p className="text-sm text-[#8E97A8]">Активная программа</p>
          {currentUser.trainingPlan ? (
            <div className="mt-2 space-y-2">
              <p className="text-xl font-medium text-white">
                {currentUser.trainingPlan.focusLabel}
              </p>
              <p className="break-words text-sm leading-6 text-[#8E97A8]">
                {currentUser.trainingPlan.workoutsPerWeek} тренировки в неделю
              </p>
              <p className="break-words text-sm leading-6 text-[#8E97A8]">
                {currentUser.trainingPlan.estimatedMinutesPerWeek} минут
                нагрузки в неделю
              </p>
            </div>
          ) : (
            <p className="mt-2 break-words text-sm leading-6 text-[#8E97A8]">
              Программа еще не составлена.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-[#0B0E15] px-4 py-4">
          <p className="text-sm text-[#8E97A8]">Ближайшее занятие</p>
          <p className="mt-2 text-xl font-medium text-white">
            {formatWorkoutRelativeLabel(nextWorkout)}
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-[#8E97A8]">
            {nextWorkout
              ? `${nextWorkout.title}, ${nextWorkout.time}`
              : "Расписание пока пустое."}
          </p>
        </div>
      </section>
    </PageShell>
  );
}
