import { memo, useEffect, useMemo } from "react";
import GamificationIcon from "./GamificationIcon";
import { getRarityMeta, getTierMeta } from "../shared/gamificationUi";
import { getCelebrationTimeout } from "../shared/gamificationCelebration";
import { playCelebrationHaptics } from "../utils/celebrationHaptics";

function AchievementUnlockOverlay({ achievement, celebration }) {
  const payload = useMemo(
    () =>
      celebration ??
      (achievement
        ? {
            ...achievement,
            type: "achievement",
          }
        : null),
    [achievement, celebration],
  );

  const celebrationId = payload?.id ?? null;

  useEffect(() => {
    if (!payload) {
      return;
    }

    playCelebrationHaptics(payload);
  }, [celebrationId, payload]);

  if (!payload) {
    return null;
  }

  const rarityMeta =
    payload.type === "tier_up"
      ? null
      : getRarityMeta(payload.rarityKey ?? "common");
  const tierMeta =
    payload.type === "tier_up" ? getTierMeta(payload.tierKey ?? "starter") : null;
  const eyebrowText =
    payload.type === "tier_up" ? "Ранг повышен" : "Достижение открыто";
  const statusText =
    payload.type === "tier_up"
      ? "Новый уровень прогресса"
      : payload.rarityLabel ?? "Прогресс засчитан";
  const timeoutMs = getCelebrationTimeout();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <div
        className={`achievement-toast relative w-full max-w-md overflow-hidden rounded-[28px] border px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${
          tierMeta?.panelClassName ??
          `${rarityMeta?.ringClassName ?? "border-[var(--border-primary)]"} bg-[linear-gradient(180deg,#151925_0%,var(--surface-secondary)_100%)]`
        }`}
        style={{ animationDuration: `${timeoutMs}ms` }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1 achievement-toast-progress"
          style={{
            animationDuration: `${timeoutMs}ms`,
            backgroundColor: payload.accentColor,
          }}
        />
        <div
          className="absolute left-6 right-6 top-0 h-16 rounded-full blur-3xl"
          style={{ backgroundColor: `${payload.accentColor}28` }}
        />

        <div className="relative flex items-start gap-4">
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border bg-[#0F131B]/90 text-[var(--text-primary)] ${
              rarityMeta?.ringClassName ?? tierMeta?.borderClassName ?? "border-[var(--border-primary)]"
            }`}
          >
            <div
              className="absolute inset-0 rounded-[18px] opacity-20"
              style={{ backgroundColor: payload.accentColor }}
            />
            <GamificationIcon
              iconKey={payload.iconKey}
              className="relative h-7 w-7"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {eyebrowText}
                </p>
                <h3 className="mt-1 break-words text-lg font-medium leading-6 text-[var(--text-primary)]">
                  {payload.title}
                </h3>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${
                  payload.type === "tier_up"
                    ? `${tierMeta?.badgeClassName ?? "bg-[#143423] text-[#8CF0B8]"} ${tierMeta?.borderClassName ?? ""}`
                    : rarityMeta?.labelClassName ?? "bg-[#1A1F2A] text-[#B9C1CF]"
                }`}
              >
                {statusText}
              </span>
            </div>

            <p className="mt-2 break-words text-sm leading-6 text-[#C5CEDD]">
              {payload.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AchievementUnlockOverlay);
