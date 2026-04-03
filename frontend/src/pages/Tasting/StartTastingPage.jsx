import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import TestImg from "/images/testingPageIMG.png";
import NavMenu from "../../components/NavMenu";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { DATABASE_CONFIG } from "../../services/database/databaseConfig";
import {
  getTastingQuestionsMeta,
  getTastingScore,
  saveTastingQuestionsMeta,
  startTastingSession,
} from "../../utils/tastingSession";

function getQuestionCountLabel(total) {
  if (!Number.isFinite(total) || total <= 0) {
    return "Тест собран из актуального набора вопросов";
  }

  if (total % 10 === 1 && total % 100 !== 11) {
    return `Тест состоит из ${total} вопроса`;
  }

  if (
    total % 10 >= 2 &&
    total % 10 <= 4 &&
    (total % 100 < 12 || total % 100 > 14)
  ) {
    return `Тест состоит из ${total} вопросов`;
  }

  return `Тест состоит из ${total} вопросов`;
}

function getDurationLabel(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "Тест займет несколько минут";
  }

  return `Тест займет около ${minutes} минут`;
}

export default function StartTastingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [questionsMeta, setQuestionsMeta] = useState(() => getTastingQuestionsMeta());
  const hasCompletedTest = currentUser
    ? currentUser.lastTestScore != null
    : getTastingScore() !== null;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadQuestionsMeta() {
      try {
        const response = await fetch(
          `${DATABASE_CONFIG.apiBaseUrl}/testing/questions`,
          { signal: abortController.signal },
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          return;
        }

        const nextMeta = {
          total:
            typeof payload.total === "number"
              ? payload.total
              : Array.isArray(payload.questions)
                ? payload.questions.length
                : null,
          estimatedDurationMinutes:
            typeof payload.estimatedDurationMinutes === "number"
              ? payload.estimatedDurationMinutes
              : null,
          scoreModel:
            payload.scoreModel && typeof payload.scoreModel === "object"
              ? payload.scoreModel
              : null,
        };

        setQuestionsMeta(nextMeta);
        saveTastingQuestionsMeta(nextMeta);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    void loadQuestionsMeta();

    return () => {
      abortController.abort();
    };
  }, []);

  const tastingFeatures = useMemo(
    () => [
      getDurationLabel(questionsMeta?.estimatedDurationMinutes ?? null),
      "После завершения вы получите персональную программу тренировок",
      getQuestionCountLabel(questionsMeta?.total ?? null),
    ],
    [questionsMeta?.estimatedDurationMinutes, questionsMeta?.total],
  );

  const handleStartTest = () => {
    startTastingSession();
    navigate(ROUTES.TASTING);
  };

  return (
    <main className="pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <section className="mx-auto flex w-full max-w-md flex-wrap gap-4 px-5">
        <img
          src={TestImg}
          alt="Иллюстрация теста"
          className="mx-auto w-full max-w-[389px] rounded-[28px]"
          loading="eager"
          style={{ imageRendering: "-webkit-optimize-contrast" }}
        />

        <h1 className="text-2xl">Тест на определение уровня подготовки</h1>

        <p className="text-l text-neutral-500">
          Определите свой уровень, и мы составим программу тренировок только
          для вас.
        </p>

        <ol className="flex flex-wrap gap-2">
          {tastingFeatures.map((feature) => (
            <li key={feature} className="pl-3 text-neutral-500">
              {feature}
            </li>
          ))}
        </ol>

        {!currentUser ? (
          <div className="mt-3 flex w-full flex-col gap-3 rounded-3xl border border-[#2A3140] bg-[#12151C] p-4">
            <p className="text-sm leading-6 text-[#8E97A8]">
              Тест можно пройти и без аккаунта. Но если войти или
              зарегистрироваться, мы сохраним ваш результат и уровень
              подготовки в профиль.
            </p>

            <div className="flex gap-3">
              <Link
                to={ROUTES.LOGIN}
                className="rounded-3xl border border-[#2A3140] px-4 py-3 text-sm text-white"
              >
                Войти
              </Link>

              <Link
                to={ROUTES.REGISTER}
                className="rounded-3xl border border-[#2A3140] px-4 py-3 text-sm text-white"
              >
                Регистрация
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {hasCompletedTest ? (
        <section className="px-5">
          <div className="mx-auto mt-4 w-full max-w-md rounded-3xl border border-[#2A3140] bg-[#12151C] p-4 text-sm leading-6 text-[#8E97A8]">
            Тест уже пройден. Если понадобится пройти его заново, это можно
            сделать через меню профиля.
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={handleStartTest}
          className="fixed inset-x-5 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-30 mx-auto w-auto max-w-md rounded-4xl bg-[#01BB96] px-6 py-4 text-xl text-white"
        >
          Начать тест
        </button>
      )}

      <NavMenu />
    </main>
  );
}
