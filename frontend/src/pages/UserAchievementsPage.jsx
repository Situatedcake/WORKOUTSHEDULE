import { Link } from "react-router";
import GamificationIcon from "../components/GamificationIcon";
import PageBackButton from "../components/PageBackButton";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import {
  getMomentumMeta,
  getRarityMeta,
  getTierMeta,
} from "../shared/gamificationUi";

function AchievementCard({ achievement, compact = false }) {
  const rarityMeta = getRarityMeta(achievement.rarityKey);

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-[#0B0E15] px-4 py-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${rarityMeta.ringClassName} text-white`}
        >
          <GamificationIcon iconKey={achievement.iconKey} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="break-words text-sm font-medium text-white">
              {achievement.title}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${rarityMeta.labelClassName}`}
            >
              {achievement.rarityLabel}
            </span>
          </div>
          <p className="mt-1 break-words text-xs leading-5 text-[#8E97A8]">
            {achievement.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-white">
            {achievement.progressPercent}%
          </p>
          <p className="text-[11px] text-[#8E97A8]">
            {achievement.unlocked
              ? "Открыто"
              : `${achievement.current}/${achievement.target}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={`rounded-[24px] border bg-gradient-to-br ${rarityMeta.glowClassName} ${rarityMeta.ringClassName} p-4`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#2A3140] bg-[#0B0E15] text-white">
          <GamificationIcon iconKey={achievement.iconKey} className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-base font-medium text-white">
                {achievement.title}
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-[#8E97A8]">
                {achievement.description}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${rarityMeta.labelClassName}`}
            >
              {achievement.rarityLabel}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#8E97A8]">
            <span>
              {achievement.unlocked
                ? "Уже открыто"
                : `${achievement.current}/${achievement.target}`}
            </span>
            <span>{achievement.progressPercent}%</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1D222D]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${achievement.progressPercent}%`,
                backgroundColor: achievement.accentColor,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function UserAchievementsPage() {
  const { currentUser, isAuthReady } = useAuth();
  const gamification = currentUser?.gamification ?? null;
  const tierMeta = gamification
    ? getTierMeta(gamification.rating.tierKey)
    : getTierMeta("starter");
  const momentumMeta = getMomentumMeta(gamification?.momentum?.key ?? "starting");

  if (!isAuthReady) {
    return (
      <PageShell className="pt-5" showNavMenu={false}>
        <section className="mx-auto w-full max-w-md rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6 text-[#8E97A8]">
          Загружаем достижения...
        </section>
      </PageShell>
    );
  }

  if (!currentUser) {
    return (
      <PageShell className="pt-5" showNavMenu={false}>
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-white">Достижения</h1>
            <p className="text-sm leading-6 text-[#8E97A8]">
              Войдите в профиль, чтобы открыть рейтинг и прогресс по
              достижениям.
            </p>
          </div>

          <Link
            to={ROUTES.LOGIN}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
          >
            Войти
          </Link>
        </section>
      </PageShell>
    );
  }

  if (!gamification) {
    return (
      <PageShell className="pt-5" showNavMenu={false}>
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
          <PageBackButton fallbackTo={ROUTES.USER} />
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-white">Достижения</h1>
            <p className="text-sm leading-6 text-[#8E97A8]">
              Прогресс пока недоступен. Попробуй обновить профиль чуть позже.
            </p>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell className="pt-5" showNavMenu={false}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <PageBackButton fallbackTo={ROUTES.USER} />
          <div className="min-w-0 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">
              Прогресс
            </p>
            <h1 className="mt-1 break-words text-2xl font-medium text-white">
              Рейтинг и достижения
            </h1>
          </div>
        </div>

        <section
          className={`overflow-hidden rounded-[30px] border p-6 ${tierMeta.panelClassName}`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#8E97A8]">
            Текущий ранг
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="break-words text-4xl font-medium text-white">
                {gamification.rating.score}
              </p>
              <p className={`mt-2 text-lg font-medium ${tierMeta.accentClassName}`}>
                {gamification.rating.tierLabel}
              </p>
            </div>
            <div
              className={`shrink-0 rounded-full border bg-[#0B0E15]/80 px-3 py-2 text-xs ${tierMeta.badgeClassName} ${tierMeta.borderClassName}`}
            >
              {gamification.rating.nextTierLabel
                ? `${gamification.rating.pointsToNextTier} до ${gamification.rating.nextTierLabel}`
                : "Максимум"}
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#1A1F2A]">
            <div
              className={`h-full rounded-full ${tierMeta.progressClassName}`}
              style={{ width: `${gamification.rating.progressPercent}%` }}
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-[#2A3140] bg-[#0B0E15]/80 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8E97A8]">
                  Импульс
                </p>
                <p className={`mt-2 text-lg font-medium ${momentumMeta.accentClassName}`}>
                  {gamification.momentum?.label ?? momentumMeta.label}
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-[#8E97A8]">
                  {gamification.momentum?.description}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${momentumMeta.badgeClassName}`}
              >
                {gamification.summary.recentProductiveWorkoutsCount ?? 0} за 14 дней
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#0B0E15]/80 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#667085]">
                Серия
              </p>
              <p className="mt-2 text-xl font-medium text-white">
                {gamification.summary.streakDays}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0B0E15]/80 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#667085]">
                Тренировки
              </p>
              <p className="mt-2 text-xl font-medium text-white">
                {gamification.summary.productiveWorkoutsCount}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0B0E15]/80 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#667085]">
                Лучший вес
              </p>
              <p className="mt-2 text-xl font-medium text-white">
                {gamification.summary.bestSetWeightKg || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-[#0B0E15]/80 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#667085]">
                За 14 дней
              </p>
              <p className="mt-2 text-xl font-medium text-white">
                {gamification.summary.recentProductiveWorkoutsCount ?? 0}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">
                Подборка
              </p>
              <h2 className="mt-1 text-xl font-medium text-white">
                Ближайшие цели
              </h2>
            </div>
            <span className="rounded-full bg-[#0B0E15] px-3 py-1 text-xs text-[#8E97A8]">
              {gamification.achievements.unlockedCount}/
              {gamification.achievements.totalCount}
            </span>
          </div>

          {gamification.achievements.nextUp ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#2A3140] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#8E97A8]">
                Следующая цель
              </p>
              <p className="mt-2 text-lg font-medium text-white">
                {gamification.achievements.nextUp.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#8E97A8]">
                {gamification.achievements.nextUp.description}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1D222D]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${gamification.achievements.nextUp.progressPercent}%`,
                    backgroundColor: gamification.achievements.nextUp.accentColor,
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3">
            {gamification.achievements.featured.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">
            Источники рейтинга
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {gamification.rating.breakdown.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-4 rounded-2xl bg-[#0B0E15] px-4 py-3"
              >
                <p className="text-sm text-white">{entry.label}</p>
                <span className="rounded-full bg-[#12151C] px-3 py-1 text-xs text-[#8E97A8]">
                  +{entry.points}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#2A3140] bg-[#12151C] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#667085]">
            Полный список
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {gamification.achievements.items.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                compact
              />
            ))}
          </div>
        </section>
      </section>
    </PageShell>
  );
}
