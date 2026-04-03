import { useEffect, useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router";
import PageBackButton from "../../components/PageBackButton";
import PageShell from "../../components/PageShell";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import {
  clearTastingStart,
  getTastingScore,
  getTastingScoreModel,
} from "../../utils/tastingSession";
import {
  getTrainingLevelByScore,
  normalizeTrainingScoreModel,
} from "../../utils/trainingLevel";

export default function FinishTasting() {
  const location = useLocation();
  const { currentUser, isAuthReady, updateCurrentUserTrainingResult } = useAuth();
  const totalScore = location.state?.totalScore ?? getTastingScore();
  const scoreModel = useMemo(
    () =>
      normalizeTrainingScoreModel(
        location.state?.scoreModel ?? getTastingScoreModel(),
      ),
    [location.state?.scoreModel],
  );
  const trainingLevel =
    totalScore === null
      ? "Не определен"
      : getTrainingLevelByScore(totalScore, scoreModel);
  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    async function syncResult() {
      if (totalScore === null) {
        return;
      }

      clearTastingStart();

      if (currentUserId) {
        await updateCurrentUserTrainingResult(totalScore);
      }
    }

    void syncResult();
  }, [currentUserId, totalScore, updateCurrentUserTrainingResult]);

  if (totalScore === null) {
    return <Navigate to={ROUTES.START_TASTING} replace />;
  }

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        <PageBackButton fallbackTo={ROUTES.START_TASTING} />

        <p className="text-sm uppercase tracking-[0.24em] text-[#8E97A8]">
          Тест завершен
        </p>

        <h1 className="text-3xl font-medium leading-tight text-white">
          Ваш результат
        </h1>

        <div className="rounded-[28px] border border-[#2A3140] bg-[#12151C] px-6 py-8">
          <p className="text-sm text-[#8E97A8]">Суммарное количество баллов</p>
          <p className="mt-3 text-5xl font-medium text-[#01BB96]">
            {totalScore}
          </p>
          <p className="mt-2 text-sm text-[#8E97A8]">
            Из {scoreModel.maxScore} возможных
          </p>
          <p className="mt-4 text-sm text-[#8E97A8]">
            Уровень подготовки:{" "}
            <span className="text-white">{trainingLevel}</span>
          </p>
        </div>

        <div className="rounded-[28px] border border-[#2A3140] bg-[#12151C] px-6 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
            Следующий шаг
          </p>
          <h2 className="mt-2 text-xl font-medium text-white">
            Составим стартовую тренировку под твой уровень
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#8E97A8]">
            На следующем экране backend подберет стартовую программу и отдаст
            ее в конструктор. Ты сможешь спокойно изменить план перед
            сохранением.
          </p>
        </div>

        {currentUser ? (
          <p className="text-sm leading-6 text-[#8E97A8]">
            Результат сохранен в профиль пользователя{" "}
            <span className="text-white">
              {currentUser.name ?? currentUser.login}
            </span>
            .
          </p>
        ) : !isAuthReady ? (
          <p className="text-sm leading-6 text-[#8E97A8]">
            Подготавливаем профиль для сохранения результата...
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-6 text-[#8E97A8]">
              Тест можно пройти и без аккаунта, но чтобы сохранить уровень
              подготовки и программу в профиль, войдите или зарегистрируйтесь.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.LOGIN}
                className="rounded-3xl border border-[#2A3140] px-5 py-4 text-center text-base font-medium text-white"
              >
                Войти
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
              >
                Зарегистрироваться
              </Link>
            </div>
          </div>
        )}

        <Link
          to={ROUTES.CREATE_TRAINING}
          state={{
            suggestedFromTest: true,
            suggestedTrainingLevel: trainingLevel,
            totalScore,
            scoreModel,
          }}
          className="rounded-3xl bg-[#01BB96] px-5 py-4 text-center text-base font-medium text-[#000214]"
        >
          Составить тренировку
        </Link>
      </section>
    </PageShell>
  );
}
