import { Routes, Route} from "react-router-dom";
import { Layout } from "./components/Layout";
import MainPage from "./pages/MainPage";
import TestingPage from "./pages/TestingPage";
import TraningStartPage from "./pages/TraningStartPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPage/>} />
          <Route path="Test" element={<TestingPage />} />
          <Route path="StartTraning" element={<TraningStartPage />}/>
          
        </Route>
      </Routes>
    </>
  );
}
