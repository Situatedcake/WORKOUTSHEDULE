import { questions } from "../data/questions.js";
import {
  buildTastingScoreModel,
  estimateTastingDurationMinutes,
} from "./scoreModel.js";

export function buildTastingQuestionsPayload() {
  const normalizedQuestions = Array.isArray(questions) ? questions : [];

  return {
    questions: normalizedQuestions,
    total: normalizedQuestions.length,
    estimatedDurationMinutes: estimateTastingDurationMinutes(
      normalizedQuestions.length,
    ),
    scoreModel: buildTastingScoreModel(normalizedQuestions),
  };
}
