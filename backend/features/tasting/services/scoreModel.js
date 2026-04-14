import { questions as defaultQuestions } from "../data/questions.js";

const BEGINNER_RATIO = 0.25;
const INTERMEDIATE_RATIO = 0.625;

function toFiniteNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getQuestionScoreBounds(question) {
  const answerValues = Array.isArray(question?.answers)
    ? question.answers
        .map((answer) => toFiniteNumber(answer?.value))
        .filter((value) => value != null)
    : [];

  if (answerValues.length === 0) {
    return {
      minScore: 0,
      maxScore: 0,
    };
  }

  return {
    minScore: Math.min(...answerValues),
    maxScore: Math.max(...answerValues),
  };
}

function roundThreshold(value, fallbackValue) {
  if (!Number.isFinite(value)) {
    return fallbackValue;
  }

  return Math.round(value);
}

export function buildTastingScoreModel(rawQuestions = defaultQuestions) {
  const normalizedQuestions = Array.isArray(rawQuestions) ? rawQuestions : [];
  const questionBounds = normalizedQuestions.map(getQuestionScoreBounds);
  const questionCount = normalizedQuestions.length;
  const minScore = questionBounds.reduce(
    (total, bounds) => total + bounds.minScore,
    0,
  );
  const maxScore = questionBounds.reduce(
    (total, bounds) => total + bounds.maxScore,
    0,
  );
  const scoreRange = Math.max(maxScore - minScore, 0);
  const beginnerMaxScore = roundThreshold(
    minScore + scoreRange * BEGINNER_RATIO,
    minScore,
  );
  const intermediateMaxScore = roundThreshold(
    minScore + scoreRange * INTERMEDIATE_RATIO,
    beginnerMaxScore,
  );

  return {
    questionCount,
    minScore,
    maxScore,
    scoreRange,
    beginnerMaxScore,
    intermediateMaxScore,
  };
}

export function estimateTastingDurationMinutes(questionCount) {
  const normalizedQuestionCount = Number(questionCount);

  if (!Number.isFinite(normalizedQuestionCount) || normalizedQuestionCount <= 0) {
    return 5;
  }

  return Math.max(4, Math.round(normalizedQuestionCount * 0.4));
}

export function getTrainingLevelByTestScore(
  score,
  scoreModel = buildTastingScoreModel(),
) {
  const normalizedScore = Number(score);

  if (!Number.isFinite(normalizedScore)) {
    return "Не определен";
  }

  if (normalizedScore <= scoreModel.beginnerMaxScore) {
    return "Начинающий";
  }

  if (normalizedScore <= scoreModel.intermediateMaxScore) {
    return "Средний";
  }

  return "Продвинутый";
}
