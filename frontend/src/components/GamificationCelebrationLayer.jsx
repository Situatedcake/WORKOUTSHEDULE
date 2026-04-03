import { useEffect, useMemo, useReducer, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { getCelebrationTimeout } from "../shared/gamificationCelebration";
import { getTierMeta } from "../shared/gamificationUi";
import { getUnlockedAchievementIds } from "../shared/liveWorkoutAchievements";
import {
  markGamificationCelebrationShown,
  wasGamificationCelebrationShownRecently,
} from "../utils/gamificationCelebrationSession";
import AchievementUnlockOverlay from "./AchievementUnlockOverlay";

const TIER_ORDER = [
  "starter",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "legend",
];

function getTierIndex(tierKey) {
  const tierIndex = TIER_ORDER.indexOf(tierKey);
  return tierIndex >= 0 ? tierIndex : 0;
}

export default function GamificationCelebrationLayer() {
  const { currentUser } = useAuth();
  const [queue, dispatchQueue] = useReducer((state, action) => {
    switch (action.type) {
      case "append":
        return [...state, ...(action.items ?? [])];
      case "shift":
        return state.slice(1);
      default:
        return state;
    }
  }, []);
  const baselineRef = useRef({
    userId: null,
    tierKey: null,
    unlockedIds: new Set(),
  });

  const gamification = currentUser?.gamification ?? null;
  const unlockedAchievementIds = useMemo(
    () => getUnlockedAchievementIds(gamification),
    [gamification],
  );
  const unlockedAchievementIdsSignature = useMemo(() => {
    return Array.from(unlockedAchievementIds).sort().join("|");
  }, [unlockedAchievementIds]);
  const activeCelebration = queue[0] ?? null;

  useEffect(() => {
    if (!currentUser?.id || !gamification) {
      return;
    }

    const unlockedIds = unlockedAchievementIds;
    const previousBaseline = baselineRef.current;
    const currentTierKey = gamification.rating?.tierKey ?? "starter";

    if (previousBaseline.userId !== currentUser.id) {
      baselineRef.current = {
        userId: currentUser.id,
        tierKey: currentTierKey,
        unlockedIds,
      };
      return;
    }

    const nextCelebrations = [];

    for (const achievement of gamification.achievements?.items ?? []) {
      if (
        !achievement.unlocked ||
        previousBaseline.unlockedIds.has(achievement.id) ||
        wasGamificationCelebrationShownRecently(`achievement:${achievement.id}`)
      ) {
        continue;
      }

      nextCelebrations.push({
        id: `achievement:${achievement.id}`,
        type: "achievement",
        iconKey: achievement.iconKey,
        title: achievement.title,
        description: achievement.description,
        accentColor: achievement.accentColor,
        rarityKey: achievement.rarityKey,
        rarityLabel: achievement.rarityLabel,
      });
    }

    const previousTierIndex = getTierIndex(previousBaseline.tierKey);
    const currentTierIndex = getTierIndex(currentTierKey);

    if (
      currentTierIndex > previousTierIndex &&
      !wasGamificationCelebrationShownRecently(`tier:${currentTierKey}`)
    ) {
      const tierMeta = getTierMeta(currentTierKey);

      nextCelebrations.unshift({
        id: `tier:${currentTierKey}`,
        type: "tier_up",
        iconKey: "crown",
        title: gamification.rating.tierLabel,
        description: `Твой рейтинг вырос до ${gamification.rating.score} очков. Новый уровень уже открыт.`,
        accentColor:
          currentTierKey === "bronze"
            ? "#E8B28A"
            : currentTierKey === "silver"
              ? "#DCE7F1"
              : currentTierKey === "gold"
                ? "#FFD37A"
                : currentTierKey === "platinum"
                  ? "#8EE8F5"
                  : currentTierKey === "legend"
                    ? "#E9D5FF"
                    : "#A7F3D0",
        tierKey: currentTierKey,
        panelClassName: tierMeta.panelClassName,
      });
    }

    if (nextCelebrations.length > 0) {
      nextCelebrations.forEach((celebration) => {
        markGamificationCelebrationShown(celebration.id);
      });

      dispatchQueue({ type: "append", items: nextCelebrations });
    }

    baselineRef.current = {
      userId: currentUser.id,
      tierKey: currentTierKey,
      unlockedIds,
    };
  }, [
    currentUser?.id,
    gamification,
    unlockedAchievementIds,
    unlockedAchievementIdsSignature,
  ]);

  useEffect(() => {
    if (!activeCelebration) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatchQueue({ type: "shift" });
    }, getCelebrationTimeout(activeCelebration));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCelebration]);

  return <AchievementUnlockOverlay celebration={activeCelebration} />;
}
