import { Link, useNavigate } from "react-router";
import TestImg from "/images/testingPageIMG.png";
import NavMenu from "../../components/NavMenu";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import {
  getTastingScore,
  startTastingSession,
} from "../../utils/tastingSession";

const tastingFeatures = [
  "Тест займет около 10 минут",
  "После завершения вы получите персональную программу тренировок",
  "Тест состоит из 10 вопросов",
];

export default function StartTastingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const hasCompletedTest = currentUser
    ? currentUser.lastTestScore != null
    : getTastingScore() !== null;

  const handleStartTest = () => {
    startTastingSession();
    navigate(ROUTES.TASTING);
  };

  return (
    <main className="pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <section className="mx-auto flex w-full max-w-md flex-wrap px-5">
        <img src={TestImg} alt="Иллюстрация теста" />
        <h1 className="text-2xl">Тест на определение уровня подготовки</h1>
        <p className="text-neutral-500 text-l">
          Определите свой уровень и мы составим программу тренировок только для
          вас
        </p>
        <ol className="flex flex-wrap gap-2 ">
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
              зарегистрироваться, мы сохраним ваш результат и уровень подготовки
              в профиль.
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
          className="fixed inset-x-5 bottom-[calc(2rem+env(safe-area-inset-bottom))] z-30 mx-auto w-auto max-w-md rounded-4xl bg-[#01BB96] px-6 py-4 text-xl text-white"
        >
          Начать тест
        </button>
      )}

      <NavMenu />
    </main>
  );
}
