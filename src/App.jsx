import { BrowserRouter, Route, Routes } from "react-router";

import MainPage from "./pages/MainPage/MainPage";
import StartTraningPage from "./pages/StartTraningPage";
import UserPage from "./pages/UserPage";
import StatisticPage from "./pages/StatisticPage";
import Calendare from "./pages/Calendare";
import StartTastingPag from "./pages/StartTastingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/Start-traning" element={<StartTraningPage />} />
        <Route path="/stats" element={<StatisticPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/calendare" element={<Calendare />} />
        <Route path="/start-tasting" element={<StartTastingPag />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
