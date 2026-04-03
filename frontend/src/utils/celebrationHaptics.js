function getVibrationPattern(celebration) {
  if (celebration?.type === "tier_up") {
    switch (celebration.tierKey) {
      case "legend":
        return [35, 45, 35, 45, 80];
      case "gold":
      case "platinum":
        return [30, 40, 30, 55];
      default:
        return [24, 36, 40];
    }
  }

  switch (celebration?.rarityKey) {
    case "legendary":
      return [30, 40, 30, 40, 70];
    case "epic":
      return [24, 32, 24, 48];
    case "rare":
      return [18, 24, 30];
    case "common":
    default:
      return [16, 18];
  }
}

export function playCelebrationHaptics(celebration) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function" ||
    !celebration
  ) {
    return;
  }

  try {
    navigator.vibrate(getVibrationPattern(celebration));
  } catch {
    // Ignore haptics failures.
  }
}
