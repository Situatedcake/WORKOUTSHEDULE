import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import PageShell from "../../../components/PageShell";
import { ROUTES } from "../../../constants/routes";
import { DATABASE_CONFIG } from "../../../services/database/databaseConfig";
import {
  hasStartedTasting,
  saveTastingQuestionsMeta,
  saveTastingScore,
} from "../utils/session";

export default function TastingPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [questionsMeta, setQuestionsMeta] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadQuestions() {
      setIsLoadingQuestions(true);
      setQuestionsError("");

      try {
        const response = await fetch(
          `${DATABASE_CONFIG.apiBaseUrl}/testing/questions`,
          { signal: abortController.signal },
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.message ?? "Не удалось загрузить вопросы теста.",
          );
        }

        const nextQuestions = Array.isArray(payload.questions)
          ? payload.questions
          : [];
        const nextQuestionsMeta = {
          total:
            typeof payload.total === "number"
              ? payload.total
              : nextQuestions.length,
          estimatedDurationMinutes:
            typeof payload.estimatedDurationMinutes === "number"
              ? payload.estimatedDurationMinutes
              : null,
          scoreModel:
            payload.scoreModel && typeof payload.scoreModel === "object"
              ? payload.scoreModel
              : null,
        };

        setQuestions(nextQuestions);
        setQuestionsMeta(nextQuestionsMeta);
        saveTastingQuestionsMeta(nextQuestionsMeta);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setQuestions([]);
        setQuestionsMeta(null);
        setQuestionsError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить вопросы теста.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingQuestions(false);
        }
      }
    }

    void loadQuestions();

    return () => {
      abortController.abort();
    };
  }, []);

  const handleAnswerClick = (value) => {
    const nextTotalScore = totalScore + value;

    if (currentQuestionIndex < questions.length - 1) {
      setTotalScore(nextTotalScore);
      setCurrentQuestionIndex((previousIndex) => previousIndex + 1);
      return;
    }

    saveTastingScore(nextTotalScore, questionsMeta?.scoreModel ?? null);

    navigate(ROUTES.TASTING_FINISH, {
      replace: true,
      state: {
        totalScore: nextTotalScore,
        scoreModel: questionsMeta?.scoreModel ?? null,
      },
    });
  };

  if (!hasStartedTasting()) {
    return <Navigate to={ROUTES.START_TASTING} replace />;
  }

  if (isLoadingQuestions) {
    return (
      <PageShell className="pt-4">
        <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Тест
          </p>
          <h1 className="text-2xl font-medium text-[var(--text-primary)]">
            Загружаем вопросы
          </h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Подготавливаем актуальную версию теста под текущую программу.
          </p>
        </section>
      </PageShell>
    );
  }

  if (!questions.length) {
    return (
      <PageShell className="pt-4">
        <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Тест
          </p>
          <h1 className="text-2xl font-medium text-[var(--text-primary)]">
            Вопросы недоступны
          </h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            {questionsError ||
              "Список вопросов пока не удалось получить с сервера."}
          </p>
        </section>
      </PageShell>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <PageShell className="pt-4">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </p>

          <div className="h-1.5 rounded-full bg-[var(--surface-primary)]">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h1 className="text-3xl font-medium leading-tight text-[var(--text-primary)]">
            {currentQuestion.text}
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          {currentQuestion.answers.map((answer) => (
            <button
              key={answer.id}
              type="button"
              onClick={() => handleAnswerClick(answer.value)}
              className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-4 text-left text-base leading-6 text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--accent-primary)] hover:bg-[#161C28]"
            >
              {answer.text}
            </button>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
