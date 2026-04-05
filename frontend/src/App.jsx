import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const DomainSelectionPage = lazy(() => import("./pages/DomainSelectionPage.jsx"));
const FlashcardLearningPage = lazy(() => import("./pages/FlashcardLearningPage.jsx"));
const QuizPage = lazy(() => import("./pages/QuizPage.jsx"));
const ProgressDashboardPage = lazy(() => import("./pages/ProgressDashboardPage.jsx"));
const StreakCalendarPage = lazy(() => import("./pages/StreakCalendarPage.jsx"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage.jsx"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage.jsx"));
const PracticePage = lazy(() => import("./pages/PracticePage.jsx"));
const LearnerConceptCardsPage = lazy(() => import("./pages/LearnerConceptCardsPage.jsx"));

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("qf_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="mx-auto mt-16 max-w-4xl skeleton h-72 rounded-3xl" />}>
        <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/domains"
        element={
          <ProtectedRoute>
            <DomainSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <FlashcardLearningPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/domains/:domainId/create-cards"
        element={
          <ProtectedRoute>
            <LearnerConceptCardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-cards"
        element={
          <ProtectedRoute>
            <LearnerConceptCardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice"
        element={
          <ProtectedRoute>
            <PracticePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <ProgressDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/streak"
        element={
          <ProtectedRoute>
            <StreakCalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
