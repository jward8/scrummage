import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import DrillLibraryPage from "./pages/DrillLibraryPage";
import DrillDetailPage from "./pages/DrillDetailPage";
import PracticePlanPage from "./pages/PracticePlanPage";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/drills" element={<DrillLibraryPage />} />
        <Route path="/drills/:id" element={<DrillDetailPage />} />
        <Route path="/plans" element={<PracticePlanPage />} />
      </Routes>
    </BrowserRouter>
  );
}
