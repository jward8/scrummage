import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import DrillLibraryPage from "./pages/DrillLibraryPage";
import DrillDetailPage from "./pages/DrillDetailPage";
import DrillUploadPage from "./pages/DrillUploadPage";
import PracticePlanPage from "./pages/PracticePlanPage";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/drills" replace />} />
        <Route path="/drills" element={<ProtectedRoute><DrillLibraryPage /></ProtectedRoute>} />
        <Route path="/drills/new" element={<ProtectedRoute><DrillUploadPage /></ProtectedRoute>} />
        <Route path="/drills/:id" element={<ProtectedRoute><DrillDetailPage /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><PracticePlanPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
