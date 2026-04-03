import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import AppLoadingScreen from "./components/AppLoadingScreen";
import GamificationCelebrationLayer from "./components/GamificationCelebrationLayer";
import PlaceholderPage from "./components/PlaceholderPage";
import { ROUTES } from "./constants/routes";
import { useAuth } from "./hooks/useAuth";

const MainPage = lazy(() => import("./pages/MainPage/MainPage"));
const StartTraningPage = lazy(() =>
  import("./pages/traningPage/StartTraningPage"),
);
const UserPage = lazy(() => import("./pages/UserPage"));
const StatisticPage = lazy(() => import("./pages/StatisticPage"));
const Calendare = lazy(() => import("./pages/Calendare"));
const StartTastingPage = lazy(() =>
  import("./pages/Tasting/StartTastingPage"),
);
const TastingPage = lazy(() => import("./pages/Tasting/TastingPage"));
const FinishTasting = lazy(() => import("./pages/Tasting/FinishTasting"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const UserEditPage = lazy(() => import("./pages/UserEditPage"));
const UserAchievementsPage = lazy(() => import("./pages/UserAchievementsPage"));
const WorkoutPlanPage = lazy(() => import("./pages/WorkoutPlanPage"));
const TraningPage = lazy(() => import("./pages/traningPage/TraningPage"));
const FinishTrainingPage = lazy(() =>
  import("./pages/traningPage/FinishTrainingPage"),
);
const WorkoutHistoryPage = lazy(() =>
  import("./pages/traningPage/WorkoutHistoryPage"),
);

function AppRouteFallback() {
  return (
    <AppLoadingScreen
      label="Открываем экран"
      hint="Подгружаем нужный раздел и собираем интерфейс."
    />
  );
}

export default function App() {
  const { currentUser, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <AppLoadingScreen
        label="Запускаем приложение"
        hint="Подготавливаем профиль, маршруты и персональные данные."
      />
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<AppRouteFallback />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<MainPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.START_TRAINING} element={<StartTraningPage />} />
          <Route path={ROUTES.CREATE_TRAINING} element={<StartTraningPage />} />
          <Route path={ROUTES.STATS} element={<StatisticPage />} />
          <Route path={ROUTES.USER} element={<UserPage />} />
          <Route path={ROUTES.USER_EDIT} element={<UserEditPage />} />
          <Route
            path={ROUTES.USER_ACHIEVEMENTS}
            element={<UserAchievementsPage />}
          />
          <Route path={ROUTES.CALENDAR} element={<Calendare />} />
          <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
          <Route path={ROUTES.WORKOUT_PLAN} element={<WorkoutPlanPage />} />
          <Route path={ROUTES.WORKOUT_ACTIVE} element={<TraningPage />} />
          <Route
            path={ROUTES.WORKOUT_FINISH}
            element={<FinishTrainingPage />}
          />
          <Route
            path={ROUTES.WORKOUT_HISTORY}
            element={<WorkoutHistoryPage />}
          />
          <Route path={ROUTES.START_TASTING} element={<StartTastingPage />} />
          <Route path={ROUTES.TASTING} element={<TastingPage />} />
          <Route path={ROUTES.TASTING_FINISH} element={<FinishTasting />} />
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Страница не найдена"
                description="Похоже, такого раздела пока нет. Вернитесь на главную и продолжим оттуда."
              />
            }
          />
        </Routes>
      </Suspense>
      <GamificationCelebrationLayer key={currentUser?.id ?? "guest"} />
    </BrowserRouter>
  );
}
