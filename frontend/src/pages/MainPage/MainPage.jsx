import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import "./MainPage.css";
import trainingHero from "/images/Traning.png";
import NavMenu from "../../components/NavMenu";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { useTheme } from "../../hooks/useTheme";
import { getThemeIcon } from "../../shared/themeIcons";
import {
  formatDateKey,
  formatWorkoutRelativeLabel,
  getNearestScheduledWorkout,
} from "../../shared/workoutSchedule";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

function MenuGlyph() {
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
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 17H14"
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
  const { theme, setTheme } = useTheme();
  const { canPrompt, isInstalled, isIosSafari, promptInstall } =
    useInstallPrompt();
  const [startHint, setStartHint] = useState("");
  const [installHint, setInstallHint] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const libraryIcon = getThemeIcon(theme, "library");
  const questionIcon = getThemeIcon(theme, "question");
  const trainingIcon = getThemeIcon(theme, "training");
  const triangleIcon = getThemeIcon(theme, "triangle");
  const arrowIcon = getThemeIcon(theme, "arrowRight");

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

  if (
    currentUser &&
    currentUser.lastTestScore != null &&
    currentUser.trainingPlan &&
    nextWorkout &&
    !isWorkoutToday
  ) {
    disabledReason = `На сегодня тренировки нет. Ближайшая: ${nextWorkoutLabel.toLowerCase()}${nextWorkout.time ? ` в ${nextWorkout.time}` : ""}.`;
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
      } else {
        setInstallHint("");
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

  function handleMenuButtonClick() {
    setIsMenuOpen((previousValue) => !previousValue);
  }

  useEffect(() => {
    if (!startHint) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStartHint("");
    }, 5000);

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
      {isMenuOpen ? (
        <button
          type="button"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
          aria-label="Закрыть меню приложения"
        />
      ) : null}

      <header className="relative z-20 mx-auto flex w-full max-w-md items-center justify-between gap-4 px-5 pt-5">
        <div className="relative">
          {isMenuOpen ? (
            <div className="absolute left-0 top-full z-20 mt-3 w-64 rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Приложение
              </p>

              <div className="mt-3 rounded-2xl bg-[var(--surface-secondary)] px-3 py-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Текущая версия
                </p>
                <p className="mt-1 text-base font-medium text-[var(--text-primary)]">
                  v{APP_VERSION}
                </p>
              </div>

              <div className="mt-2 rounded-2xl bg-[var(--surface-secondary)] px-3 py-3">
                <p className="text-xs text-[var(--text-muted)]">Режим</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {isInstalled
                    ? "Установлено как приложение"
                    : "Открыто в браузере"}
                </p>
              </div>

              <div className="mt-2 rounded-2xl bg-[var(--surface-secondary)] px-3 py-3">
                <p className="text-xs text-[var(--text-muted)]">Тема</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      theme === "dark"
                        ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                        : "border border-[var(--border-primary)] text-[var(--text-primary)]"
                    }`}
                  >
                    Тёмная
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      theme === "light"
                        ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
                        : "border border-[var(--border-primary)] text-[var(--text-primary)]"
                    }`}
                  >
                    Светлая
                  </button>
                </div>
              </div>

              {!isInstalled ? (
                <div className="mt-2 rounded-2xl bg-[var(--surface-secondary)] px-3 py-3">
                  <p className="text-xs text-[var(--text-muted)]">PWA</p>
                  <button
                    type="button"
                    onClick={() => void handleInstallApp()}
                    className="mt-3 w-full rounded-2xl bg-[var(--accent-primary)] px-3 py-3 text-sm font-medium text-[var(--accent-contrast)]"
                  >
                    Установить приложение
                  </button>
                  {installHint ? (
                    <p className="mt-3 text-xs leading-5 text-[var(--tooltip-text)]">
                      {installHint}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleMenuButtonClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)]"
            aria-label="Открыть меню приложения"
          >
            <MenuGlyph />
          </button>
        </div>

        <span className="min-w-0 flex-1 truncate px-2 text-center text-2xl text-[var(--text-primary)]">
          Привет, {currentUser?.name ?? currentUser?.login ?? "гость"}!
        </span>

        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[var(--surface-secondary)]"
          id="userCard"
        >
          {currentUser?.profilePhoto ? (
            <img
              src={currentUser.profilePhoto}
              alt="Фото профиля"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-[var(--text-primary)]">
              {(currentUser?.name ?? currentUser?.login ?? "Г")
                .slice(0, 1)
                .toUpperCase()}
            </span>
          )}
        </div>
      </header>

      <section className="px-5">
        <section id="TraningCart">
          <img
            src={trainingHero}
            alt=""
            aria-hidden="true"
            className="training-card-image"
          />

          <div className="training-card-content">
            <div className="training-card-copy">
              <h1 className="max-w-[13rem] text-3xl font-medium leading-10 text-[var(--hero-foreground)] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
                {nextWorkoutLabel}
              </h1>

              {nextWorkout?.time ? (
                <h3 className="text-2xl font-light text-[var(--hero-foreground)] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
                  {nextWorkout.time}
                </h3>
              ) : null}

              {nextWorkout ? (
                <p className="training-card-description text-sm leading-6 text-[var(--hero-muted)] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
                  {nextWorkout.title}. {nextWorkout.emphasis}.
                </p>
              ) : null}
            </div>

            <div className="training-card-action">
              {startHint ? (
                <div className="absolute bottom-full left-1/2 z-10 mb-3 w-56 -translate-x-1/2 rounded-2xl bg-[var(--surface-primary)] px-3 py-2 text-xs leading-5 text-[var(--tooltip-text)] shadow-lg">
                  {startHint}
                  <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 rotate-45 bg-[var(--surface-primary)]" />
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleStartWorkout}
                className={`flex items-center rounded-4xl px-10 py-4 text-2xl font-medium ${
                  canStartWorkout
                    ? "bg-[var(--accent-hero)] text-[var(--accent-hero-contrast)] active:opacity-90"
                    : "bg-[var(--button-muted-bg)] text-[var(--button-muted-text)]"
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
          </div>
        </section>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-wrap px-5">
        {mainActions.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className="mt-3 flex w-full items-center gap-5 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 text-xl font-light text-[var(--text-primary)]"
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
