import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./layouts/AppLayout";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import JobMatch from "./pages/JobMatch";
import Ranking from "./pages/Ranking";
import SkillGap from "./pages/SkillGap";
import Improve from "./pages/Improve";
import History from "./pages/History";
import HistoryDetail from "./pages/HistoryDetail";
import MLModel from "./pages/MLModel";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner className="h-8 w-8 text-brand" /></div>;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="analyze" element={<Analyze />} />
        <Route path="match" element={<JobMatch />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="skill-gap" element={<SkillGap />} />
        <Route path="improve" element={<Improve />} />
        <Route path="history" element={<History />} />
        <Route path="history/:id" element={<HistoryDetail />} />
        <Route path="model" element={<MLModel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
