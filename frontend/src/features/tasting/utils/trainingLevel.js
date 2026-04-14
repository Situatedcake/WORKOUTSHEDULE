const DEFAULT_SCORE_MODEL = {
  questionCount: 25,
  minScore: 25,
  maxScore: 125,
  scoreRange: 100,
  beginnerMaxScore: 50,
  intermediateMaxScore: 88,
};

function toFiniteNumber(value, fallbackValue) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

export function normalizeTrainingScoreModel(scoreModel) {
  if (!scoreModel || typeof scoreModel !== "object") {
    return DEFAULT_SCORE_MODEL;
  }

  const minScore = toFiniteNumber(scoreModel.minScore, DEFAULT_SCORE_MODEL.minScore);
  const maxScore = Math.max(
    toFiniteNumber(scoreModel.maxScore, DEFAULT_SCORE_MODEL.maxScore),
    minScore,
  );
  const scoreRange = Math.max(
    toFiniteNumber(scoreModel.scoreRange, maxScore - minScore),
    maxScore - minScore,
  );
  const beginnerMaxScore = Math.min(
    Math.max(
      toFiniteNumber(
        scoreModel.beginnerMaxScore,
        DEFAULT_SCORE_MODEL.beginnerMaxScore,
      ),
      minScore,
    ),
    maxScore,
  );
  const intermediateMaxScore = Math.min(
    Math.max(
      toFiniteNumber(
        scoreModel.intermediateMaxScore,
        DEFAULT_SCORE_MODEL.intermediateMaxScore,
      ),
      beginnerMaxScore,
    ),
    maxScore,
  );

  return {
    questionCount: Math.max(
      Math.round(
        toFiniteNumber(scoreModel.questionCount, DEFAULT_SCORE_MODEL.questionCount),
      ),
      0,
    ),
    minScore,
    maxScore,
    scoreRange,
    beginnerMaxScore,
    intermediateMaxScore,
  };
}

export function getTrainingLevelByScore(score, scoreModel = null) {
  const normalizedScore = Number(score);

  if (!Number.isFinite(normalizedScore)) {
    return "Не определен";
  }

  const normalizedScoreModel = normalizeTrainingScoreModel(scoreModel);

  if (normalizedScore <= normalizedScoreModel.beginnerMaxScore) {
    return "Начинающий";
  }

  if (normalizedScore <= normalizedScoreModel.intermediateMaxScore) {
    return "Средний";
  }

  return "Продвинутый";
}
