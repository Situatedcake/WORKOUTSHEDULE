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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<MainPage />} />
        <Route path={ROUTES.START_TRAINING} element={<StartTraningPage />} />
        <Route path={ROUTES.STATS} element={<StatisticPage />} />
        <Route path={ROUTES.USER} element={<UserPage />} />
        <Route path={ROUTES.CALENDAR} element={<Calendare />} />
        <Route
          path={ROUTES.LIBRARY}
          element={
            <PlaceholderPage
              title="Библиотека"
              description="Раздел библиотеки упражнений пока в разработке."
            />
          }
        />
        <Route
          path={ROUTES.CREATE_TRAINING}
          element={
            <PlaceholderPage
              title="Конструктор тренировок"
              description="Здесь позже можно будет собирать свои тренировки."
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
