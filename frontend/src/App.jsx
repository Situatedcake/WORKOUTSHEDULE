import { BrowserRouter, Route, Routes } from "react-router";

import { ROUTES } from "./constants/routes";
import MainPage from "./pages/MainPage/MainPage";
import StartTraningPage from "./pages/StartTraningPage";
import UserPage from "./pages/UserPage";
import StatisticPage from "./pages/StatisticPage";
import Calendare from "./pages/Calendare";
import StartTastingPage from "./pages/Tasting/StartTastingPage";
import TastingPage from "./pages/Tasting/TastingPage";
import FinishTasting from "./pages/Tasting/FinishTasting";
import PlaceholderPage from "./components/PlaceholderPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import LibraryPage from "./pages/LibraryPage";
import UserEditPage from "./pages/UserEditPage";
import WorkoutPlanPage from "./pages/WorkoutPlanPage";
import TraningPage from "./pages/TraningPage";
import FinishTrainingPage from "./pages/FinishTrainingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<MainPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.START_TRAINING} element={<StartTraningPage />} />
        <Route path={ROUTES.CREATE_TRAINING} element={<StartTraningPage />} />
        <Route path={ROUTES.STATS} element={<StatisticPage />} />
        <Route path={ROUTES.USER} element={<UserPage />} />
        <Route path={ROUTES.USER_EDIT} element={<UserEditPage />} />
        <Route path={ROUTES.CALENDAR} element={<Calendare />} />
        <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
        <Route path={ROUTES.WORKOUT_PLAN} element={<WorkoutPlanPage />} />
        <Route path={ROUTES.WORKOUT_ACTIVE} element={<TraningPage />} />
        <Route path={ROUTES.WORKOUT_FINISH} element={<FinishTrainingPage />} />
        <Route
          path="*"
          element={
            <PlaceholderPage
              title="Страница не найдена"
              description="Похоже, такого раздела пока нет. Вернитесь на главную и продолжим оттуда."
            />
          }
        />
        <Route path={ROUTES.START_TASTING} element={<StartTastingPage />} />
        <Route path={ROUTES.TASTING} element={<TastingPage />} />
        <Route path={ROUTES.TASTING_FINISH} element={<FinishTasting />} />
      </Routes>
    </BrowserRouter>
  );
}
