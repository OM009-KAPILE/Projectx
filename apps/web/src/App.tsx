import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { Navbar } from './components/common/Navbar';

import { SplashScreen } from './pages/auth/SplashScreen';
import { WelcomeScreen } from './pages/auth/WelcomeScreen';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SignupSuccessPage } from './pages/auth/SignupSuccessPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { HomePage } from './pages/home/HomePage';

import { ExplorePage } from './pages/explore/ExplorePage';
import { ProjectCreatePage } from './pages/project-create/ProjectCreatePage';
import { ProjectDetailPage } from './pages/project-detail/ProjectDetailPage';
import { ProjectWorkspacePage } from './pages/workspace/ProjectWorkspacePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ApplicationsPage } from './pages/applications/ApplicationsPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AdminPage } from './pages/admin/AdminPage';
import { DatabaseViewPage } from './pages/admin/DatabaseViewPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthFullscreen = ['/', '/splash', '/welcome'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand-500/30 selection:text-brand-800 dark:selection:text-brand-200 transition-colors">
      {!isAuthFullscreen && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Auth Experience */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup-success" element={<SignupSuccessPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Platform Core */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/explore" element={<ExplorePage />} />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <ProjectCreatePage />
              </ProtectedRoute>
            }
          />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <ProjectWorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-projects"
            element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="/database-view"
            element={
              <ProtectedRoute>
                <DatabaseViewPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      {!isAuthFullscreen && (
        <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2 transition-colors">
          <div className="flex items-center justify-center gap-6 text-slate-600 dark:text-slate-400 font-medium">
            <span>AI Skill-Gap Detection</span>
            <span>•</span>
            <span>Cross-College Matching</span>
            <span>•</span>
            <span>Progressive Disclosure</span>
          </div>
          <p>© 2026 ProjectX Platform. Empowering student builders across universities.</p>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
