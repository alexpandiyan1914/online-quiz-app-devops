import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateQuizPage } from './pages/admin/CreateQuizPage';
import { EditQuizPage } from './pages/admin/EditQuizPage';
import { QuestionManagementPage } from './pages/admin/QuestionManagementPage';
import { QuizManagementPage } from './pages/admin/QuizManagementPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AttemptHistoryPage } from './pages/student/AttemptHistoryPage';
import { AvailableQuizzesPage } from './pages/student/AvailableQuizzesPage';
import { QuizResultPage } from './pages/student/QuizResultPage';
import { QuizReviewPage } from './pages/student/QuizReviewPage';
import { QuizStartPage } from './pages/student/QuizStartPage';
import { QuizTakingPage } from './pages/student/QuizTakingPage';
import { StudentDashboard } from './pages/student/StudentDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <AvailableQuizzesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:quizId/start"
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <QuizStartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:quizId/take"
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <QuizTakingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attempts/:attemptId/result"
                element={
                  <ProtectedRoute>
                    <QuizResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attempts/:attemptId/review"
                element={
                  <ProtectedRoute>
                    <QuizReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attempts/my"
                element={
                  <ProtectedRoute allowedRole="STUDENT">
                    <AttemptHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quizzes"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <QuizManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quizzes/create"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <CreateQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quizzes/:quizId/edit"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <EditQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quizzes/:quizId/questions"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <QuestionManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
