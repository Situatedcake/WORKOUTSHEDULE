import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import GamificationIcon from "../components/GamificationIcon";
import PageBackButton from "../components/PageBackButton";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import { userRepository } from "../services/database/userRepository";
import {
  getAchievementDifficultyMeta,
  getMomentumMeta,
  getRarityMeta,
  getTierMeta,
} from "../shared/gamificationUi";

function AchievementCard({ achievement, compact = false }) {
  const rarityMeta = getRarityMeta(achievement.rarityKey);
  const difficultyMeta = getAchievementDifficultyMeta(achievement.difficultyKey);

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-[var(--surface-primary)] px-4 py-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${rarityMeta.ringClassName} text-[var(--text-primary)]`}
        >
          <GamificationIcon iconKey={achievement.iconKey} className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-sm font-medium text-[var(--text-primary)]">
              {achievement.title}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${rarityMeta.labelClassName}`}
            >
              {achievement.rarityLabel}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${difficultyMeta.badgeClassName} ${difficultyMeta.ringClassName}`}
            >
              {achievement.difficultyLabel}
            </span>
          </div>

          <p className="mt-1 break-words text-xs leading-5 text-[var(--text-muted)]">
            {achievement.description}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {achievement.progressPercent}%
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)]">
          <GamificationIcon iconKey={achievement.iconKey} className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-base font-medium text-[var(--text-primary)]">
                {achievement.title}
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-[var(--text-muted)]">
                {achievement.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${rarityMeta.labelClassName}`}
              >
                {achievement.rarityLabel}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${difficultyMeta.badgeClassName} ${difficultyMeta.ringClassName}`}
              >
                {achievement.difficultyLabel}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
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

function buildAchievementGroups(gamification) {
  if (!gamification?.achievements) {
    return [];
  }

  if (Array.isArray(gamification.achievements.groups)) {
    return gamification.achievements.groups;
  }

  if (Array.isArray(gamification.achievements.items)) {
    return [
      {
        key: "easy",
        label: "Все достижения",
        shortLabel: "Все",
        totalCount: gamification.achievements.totalCount ?? 0,
        unlockedCount: gamification.achievements.unlockedCount ?? 0,
        items: gamification.achievements.items,
      },
    ];
  }

  return [];
}

function buildCatalogAchievementGroups(gamification, gamificationCatalog) {
  if (!gamification || !gamificationCatalog) {
    return [];
  }

  const difficulties = Array.isArray(gamificationCatalog.difficulties)
    ? gamificationCatalog.difficulties
    : [];
  const catalogAchievements = Array.isArray(gamificationCatalog.achievements)
    ? gamificationCatalog.achievements
    : [];

  if (difficulties.length === 0 || catalogAchievements.length === 0) {
    return [];
  }

  const existingItemsById = new Map(
    (gamification.achievements?.items ?? []).map((item) => [item.id, item]),
  );
  const metrics = gamification.metrics ?? gamification.summary ?? {};

  const hydratedItems = catalogAchievements.map((definition) => {
    const existingItem = existingItemsById.get(definition.id);
    const target = Math.max(Number(definition.target) || 1, 1);
    const metricValue = Number(metrics?.[definition.metricKey]);
    const current = Number.isFinite(metricValue)
      ? Math.max(metricValue, 0)
      : Math.max(Number(existingItem?.current) || 0, 0);
    const unlocked = current >= target;

    return {
      id: definition.id,
      iconKey: definition.iconKey ?? existingItem?.iconKey ?? "spark",
      title: definition.title ?? existingItem?.title ?? definition.id,
      description: definition.description ?? existingItem?.description ?? "",
      rarityKey: definition.rarityKey ?? existingItem?.rarityKey ?? "common",
      rarityLabel: definition.rarityLabel ?? existingItem?.rarityLabel ?? "Обычное",
      difficultyKey: definition.difficultyKey ?? existingItem?.difficultyKey ?? "easy",
      difficultyLabel: existingItem?.difficultyLabel ?? definition.difficultyKey ?? "easy",
      metricKey: definition.metricKey,
      target,
      current,
      unlocked,
      progressPercent: Math.min(Math.round((current / target) * 100), 100),
      accentColor: definition.accentColor ?? existingItem?.accentColor ?? "#01BB96",
    };
  });

  return difficulties
    .map((difficulty, index) => {
      const groupItems = hydratedItems.filter(
        (item) => item.difficultyKey === difficulty.key,
      );
      const unlockedCount = groupItems.filter((item) => item.unlocked).length;

      return {
        key: difficulty.key,
        label: difficulty.label ?? difficulty.key,
        shortLabel: difficulty.shortLabel ?? difficulty.label ?? difficulty.key,
        order: Number.isFinite(Number(difficulty.order))
          ? Number(difficulty.order)
          : index + 1,
        totalCount: groupItems.length,
        unlockedCount,
        items: groupItems,
      };
    })
    .filter((group) => group.totalCount > 0)
    .sort((left, right) => left.order - right.order);
}

export default function UserAchievementsPage() {
  const { currentUser, isAuthReady, refreshCurrentUser } = useAuth();
  const [gamificationCatalog, setGamificationCatalog] = useState(null);
  const gamification = currentUser?.gamification ?? null;
  const achievementGroups = useMemo(() => {
    const groupsFromCatalog = buildCatalogAchievementGroups(
      gamification,
      gamificationCatalog,
    );

    if (groupsFromCatalog.length > 0) {
      return groupsFromCatalog;
    }

    return buildAchievementGroups(gamification);
  }, [gamification, gamificationCatalog]);
  const tierMeta = gamification
    ? getTierMeta(gamification.rating.tierKey)
    : getTierMeta("starter");
  const momentumMeta = getMomentumMeta(gamification?.momentum?.key ?? "starting");

  useEffect(() => {
    if (!isAuthReady || !currentUser?.id) {
      return;
    }

    void refreshCurrentUser();
  }, [isAuthReady, currentUser?.id, refreshCurrentUser]);

  useEffect(() => {
    let isMounted = true;

    async function loadGamificationCatalog() {
      try {
        const catalog = await userRepository.getGamificationCatalog();

        if (isMounted) {
          setGamificationCatalog(catalog);
        }
      } catch {
        if (isMounted) {
          setGamificationCatalog(null);
        }
      }
    }

    void loadGamificationCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAuthReady) {
    return (
      <PageShell className="pt-5" showNavMenu={false}>
        <section className="mx-auto w-full max-w-md rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6 text-[var(--text-muted)]">
          Загружаем достижения...
        </section>
      </PageShell>
    );
  }

  if (!currentUser) {
    return (
      <PageShell className="pt-5" showNavMenu={false}>
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-[var(--text-primary)]">
              Достижения
            </h1>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Войдите в профиль, чтобы открыть рейтинг, прогресс и историю
              достижений.
            </p>
          </div>

          <Link
            to={ROUTES.LOGIN}
            className="rounded-3xl bg-[var(--accent-primary)] px-5 py-4 text-center text-base font-medium text-[var(--accent-contrast)]"
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
        <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
          <PageBackButton fallbackTo={ROUTES.USER} />
          <div className="space-y-2">
            <h1 className="text-3xl font-medium text-[var(--text-primary)]">
              Достижения
            </h1>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
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
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
              Прогресс
            </p>
            <h1 className="mt-1 break-words text-2xl font-medium text-[var(--text-primary)]">
              Рейтинг и достижения
            </h1>
          </div>
        </div>

        <section
          className={`overflow-hidden rounded-[30px] border p-6 ${tierMeta.panelClassName}`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Текущий ранг
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="break-words text-4xl font-medium text-[var(--text-primary)]">
                {gamification.rating.score}
              </p>
              <p className={`mt-2 text-lg font-medium ${tierMeta.accentClassName}`}>
                {gamification.rating.tierLabel}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-full border bg-[var(--surface-secondary-80)] px-3 py-2 text-xs ${tierMeta.badgeClassName} ${tierMeta.borderClassName}`}
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

          <div className="mt-5 rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-secondary-80)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Импульс
                </p>
                <p className={`mt-2 text-lg font-medium ${momentumMeta.accentClassName}`}>
                  {gamification.momentum?.label ?? momentumMeta.label}
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-[var(--text-muted)]">
                  {gamification.momentum?.description}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${momentumMeta.badgeClassName}`}
              >
                {gamification.summary.recentProductiveWorkoutsCount ?? 0} за 14
                дней
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--surface-secondary-80)] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Серия
              </p>
              <p className="mt-2 text-xl font-medium text-[var(--text-primary)]">
                {gamification.summary.streakDays}
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-secondary-80)] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Тренировки
              </p>
              <p className="mt-2 text-xl font-medium text-[var(--text-primary)]">
                {gamification.summary.productiveWorkoutsCount}
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-secondary-80)] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                Лучший вес
              </p>
              <p className="mt-2 text-xl font-medium text-[var(--text-primary)]">
                {gamification.summary.bestSetWeightKg || 0}
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--surface-secondary-80)] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                За 14 дней
              </p>
              <p className="mt-2 text-xl font-medium text-[var(--text-primary)]">
                {gamification.summary.recentProductiveWorkoutsCount ?? 0}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                Подборка
              </p>
              <h2 className="mt-1 text-xl font-medium text-[var(--text-primary)]">
                Ближайшие цели
              </h2>
            </div>

            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--text-muted)]">
              {gamification.achievements.unlockedCount}/
              {gamification.achievements.totalCount}
            </span>
          </div>

          {gamification.achievements.nextUp ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-primary)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Следующая цель
              </p>
              <p className="mt-2 text-lg font-medium text-[var(--text-primary)]">
                {gamification.achievements.nextUp.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
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

        <section className="rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
            Источники рейтинга
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {gamification.rating.breakdown.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3"
              >
                <p className="text-sm text-[var(--text-primary)]">{entry.label}</p>
                <span className="rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  +{entry.points}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
            Полный список
          </p>

          <div className="mt-4 flex flex-col gap-4">
            {achievementGroups.map((group) => {
              const groupMeta = getAchievementDifficultyMeta(group.key);

              return (
                <section
                  key={group.key}
                  className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {group.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {group.unlockedCount}/{group.totalCount}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${groupMeta.badgeClassName} ${groupMeta.ringClassName}`}
                    >
                      {group.shortLabel ?? group.label}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    {group.items.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        compact
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </section>
    </PageShell>
  );
}
