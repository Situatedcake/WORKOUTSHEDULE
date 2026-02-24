import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "./components/Layout";
import MainPage from "./pages/MainPage";
import TestingPage from "./pages/TestingPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPage/>} />
          <Route path="/Test" element={<TestingPage />} />
          
        </Route>
      </Routes>
    </>
  );
}
