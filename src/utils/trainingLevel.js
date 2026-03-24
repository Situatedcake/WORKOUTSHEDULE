const LEVELS = [
  { maxScore: 20, label: "Начинающий" },
  { maxScore: 35, label: "Средний" },
  { maxScore: Number.POSITIVE_INFINITY, label: "Продвинутый" },
];

export function getTrainingLevelByScore(score) {
  const normalizedScore = Number(score);

  if (Number.isNaN(normalizedScore)) {
    return "Не определен";
  }

  return LEVELS.find((level) => normalizedScore <= level.maxScore).label;
}
