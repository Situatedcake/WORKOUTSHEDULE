import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import PageShell from "../../components/PageShell";
import { ROUTES } from "../../constants/routes";
import { questions } from "../../data/questions.js";
import {
  hasStartedTasting,
  saveTastingScore,
} from "../../utils/tastingSession";

export default function TastingPage() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const handleAnswerClick = (value) => {
    const nextTotalScore = totalScore + value;

    if (currentQuestionIndex < questions.length - 1) {
      setTotalScore(nextTotalScore);
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    saveTastingScore(nextTotalScore);

    navigate(ROUTES.TASTING_FINISH, {
      replace: true,
      state: { totalScore: nextTotalScore },
    });
  };

  if (!hasStartedTasting()) {
    return <Navigate to={ROUTES.START_TASTING} replace />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <PageShell className="pt-4">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="space-y-3">
          <p className="text-sm text-[#8E97A8]">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </p>

          <div className="h-1.5 rounded-full bg-[#12151C]">
            <div
              className="h-full rounded-full bg-[#01BB96] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h1 className="text-3xl font-medium leading-tight text-white">
            {currentQuestion.text}
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          {currentQuestion.answers.map((answer) => (
            <button
              key={answer.id}
              type="button"
              onClick={() => handleAnswerClick(answer.value)}
              className="rounded-3xl border border-[#2A3140] bg-[#12151C] px-5 py-4 text-left text-base leading-6 text-white transition-colors duration-200 hover:border-[#01BB96] hover:bg-[#161C28]"
            >
              {answer.text}
            </button>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
