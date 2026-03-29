import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import "./MainPage.css";
import libraryIcon from "/icons/library.svg";
import menuIcon from "/menu.svg";
import questionIcon from "/icons/quastion.svg";
import trainingIcon from "/icons/addTraning.svg";
import triangleIcon from "/icons/triangle.svg";
import arrowIcon from "/icons/arrowRight.svg";
import NavMenu from "../../components/NavMenu";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import {
  formatDateKey,
  formatWorkoutRelativeLabel,
  getNearestScheduledWorkout,
} from "../../shared/workoutSchedule";

function InstallIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 4V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.5 10.5L12 14L15.5 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16.5V17.5C5 18.6046 5.89543 19.5 7 19.5H17C18.1046 19.5 19 18.6046 19 17.5V16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MainPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { canPrompt, isInstalled, isIosSafari, promptInstall } =
    useInstallPrompt();
  const [startHint, setStartHint] = useState("");
  const [installHint, setInstallHint] = useState("");

  const nextWorkout = getNearestScheduledWorkout(
    currentUser?.scheduledWorkouts ?? [],
  );
  const todayDateKey = formatDateKey(new Date());
  const isWorkoutToday = nextWorkout?.date === todayDateKey;
  const nextWorkoutLabel = formatWorkoutRelativeLabel(nextWorkout);
  const canStartWorkout = Boolean(
    currentUser &&
      currentUser.lastTestScore != null &&
      currentUser.trainingPlan &&
      nextWorkout &&
      isWorkoutToday,
  );

  let disabledReason = "";

  if (!currentUser) {
    disabledReason = "Чтобы начать тренировку, сначала войди в аккаунт.";
  } else if (currentUser.lastTestScore == null) {
    disabledReason =
      "Сначала пройди тест, чтобы определить уровень подготовки.";
  } else if (!currentUser.trainingPlan) {
    disabledReason = "Сначала составь программу тренировок.";
  } else if (!nextWorkout) {
    disabledReason = "В календаре пока нет активной тренировки.";
  }

  if (!disabledReason && !isWorkoutToday) {
    disabledReason =
      "Запустить можно только тренировку, которая запланирована на сегодня.";
  }

  const mainActions = [
    {
      text: "Библиотека упражнений",
      img: libraryIcon,
      alt: "Библиотека упражнений",
      url: ROUTES.LIBRARY,
    },
    {
      text: "Составить тренировку",
      img: trainingIcon,
      alt: "Составить тренировку",
      url: ROUTES.START_TRAINING,
    },
    {
      text: "Пройти тест",
      img: questionIcon,
      alt: "Пройти тест",
      url: ROUTES.START_TASTING,
    },
  ];

  function handleStartWorkout() {
    if (!canStartWorkout) {
      setStartHint(disabledReason);
      return;
    }

    setStartHint("");
    navigate(ROUTES.WORKOUT_PLAN);
  }

  async function handleInstallApp() {
    if (isInstalled) {
      setInstallHint("Приложение уже установлено.");
      return;
    }

    if (canPrompt) {
      const result = await promptInstall();

      if (result.outcome !== "accepted") {
        setInstallHint("Установку можно повторить позже.");
      }

      return;
    }

    if (isIosSafari) {
      setInstallHint('Открой "Поделиться" и выбери "На экран Домой".');
      return;
    }

    setInstallHint(
      "Установка станет доступна в поддерживаемом браузере после загрузки приложения.",
    );
  }

  useEffect(() => {
    if (!startHint) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStartHint("");
    }, 15000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [startHint]);

  useEffect(() => {
    if (!installHint) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setInstallHint("");
    }, 8000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [installHint]);

  return (
    <main className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-5 pt-5">
        <div className="relative">
          {!isInstalled && installHint ? (
            <div className="absolute left-0 top-full z-20 mt-3 w-52 rounded-2xl bg-[#12151C] px-3 py-2 text-xs leading-5 text-[#D8E0EE] shadow-lg">
              {installHint}
            </div>
          ) : null}

          <button
            type="button"
            onClick={isInstalled ? undefined : handleInstallApp}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2A3140] bg-[#12151C] text-white"
            aria-label="Установить приложение"
          >
            {isInstalled ? (
              <img src={menuIcon} alt="" aria-hidden="true" className="h-5 w-5" />
            ) : (
              <InstallIcon />
            )}
          </button>
        </div>

        <span className="flex-1 text-center text-2xl">
          Привет, {currentUser?.name ?? currentUser?.login ?? "гость"}!
        </span>

        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-white"
          id="userCard"
        >
          {currentUser?.profilePhoto ? (
            <img
              src={currentUser.profilePhoto}
              alt="Фото профиля"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-black">
              {(currentUser?.name ?? currentUser?.login ?? "Г")
                .slice(0, 1)
                .toUpperCase()}
            </span>
          )}
        </div>
      </header>

      <section className="px-5">
        <section id="TraningCart">
          <h1 className="max-w-[13rem] text-3xl font-medium leading-10 [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
            {nextWorkoutLabel}
          </h1>

          {nextWorkout?.time ? (
            <h3 className="text-2xl font-light [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
              {nextWorkout.time}
            </h3>
          ) : null}

          {nextWorkout ? (
            <p className="mt-3 text-sm leading-6 text-[#A2ACBD] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
              {nextWorkout.title}. {nextWorkout.emphasis}.
            </p>
          ) : null}

          <div className="relative mx-auto mt-6 w-fit">
            {startHint ? (
              <div className="absolute bottom-full left-1/2 z-10 mb-3 w-56 -translate-x-1/2 rounded-2xl bg-[#12151C] px-3 py-2 text-xs leading-5 text-[#D8E0EE] shadow-lg">
                {startHint}
                <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 rotate-45 bg-[#12151C]" />
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleStartWorkout}
              className={`flex items-center rounded-4xl px-10 py-4 text-2xl font-medium ${
                canStartWorkout
                  ? "bg-[#3CFFB9] text-black active:bg-[#3CFFB9]/80"
                  : "bg-[#5F6674] text-[#DBE0E8]"
              }`}
            >
              <img
                src={triangleIcon}
                alt=""
                aria-hidden="true"
                className="mx-4"
              />
              Приступить
            </button>
          </div>
        </section>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-wrap px-5">
        {mainActions.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className="mt-3 flex w-full items-center gap-5 rounded-3xl border border-[#383838] bg-[#12151C] p-4 text-xl font-light"
          >
            <img src={item.img} alt={item.alt} />
            {item.text}
            <img src={arrowIcon} alt="" aria-hidden="true" className="ml-auto" />
          </Link>
        ))}
      </section>

      <NavMenu />
    </main>
  );
}
