import MainPage from "./pages/MainPage/MainPage";
import StartTraningPage from "./pages/StartTraningPage";
import { BrowserRouter, Route, Routes } from "react-router";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/StartTraningPage" element={<StartTraningPage />} />
      </Routes>
    </BrowserRouter>
  );
}
