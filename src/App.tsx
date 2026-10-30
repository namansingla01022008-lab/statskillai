import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Role } from './types';

// Common Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { FloatingAssistant } from './components/learner/FloatingAssistant';

// Pages
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';

// Learner Pages
import { LearnerDashboard } from './pages/learner/LearnerDashboard';
import { ProfilePage } from './pages/learner/ProfilePage';
import { AdaptiveAssessmentPage } from './pages/learner/AdaptiveAssessmentPage';
import { GapAnalysisPage } from './pages/learner/GapAnalysisPage';
import { LearningPathPage } from './pages/learner/LearningPathPage';
import { QuizGeneratorPage } from './pages/learner/QuizGeneratorPage';
import { OpportunitiesPage } from './pages/learner/OpportunitiesPage';
import { MentorshipPage } from './pages/learner/MentorshipPage';
import { RewardsPage } from './pages/learner/RewardsPage';
import { RewardStorePage } from './pages/learner/RewardStorePage';
import { CertificatesPage } from './pages/learner/CertificatesPage';

// Mentor Pages
import { MentorDashboard } from './pages/mentor/MentorDashboard';
import { MenteeDetailPage } from './pages/mentor/MenteeDetailPage';

// Admin Pages
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminRewardsPage } from './pages/admin/AdminRewardsPage';
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage';
import { AdminApplicantsPage } from './pages/admin/AdminApplicantsPage';
import { AdminMentorsPage } from './pages/admin/AdminMentorsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Role-based route guard
const ProtectedRoute: React.FC<{
  allowedRoles: Role[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated, isLoadingAuth } = useApp();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-teal-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser || !currentUser.id) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Redirect to that role's home page
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/analytics" replace />;
    }
    if (currentUser.role === 'mentor') {
      return <Navigate to="/mentor/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Shell layout
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, t, notification, dismissNotification } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // If on login page, render full screen without header/sidebar
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 relative">
      {/* Real-time Socket Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-teal-500/50 flex items-start gap-3 animate-slide-in">
          <div className="p-2 rounded-lg bg-teal-900/60 text-teal-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-teal-400 block animate-ping" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-teal-300">{notification.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{notification.message}</p>
          </div>
          <button
            onClick={dismissNotification}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Skip to Content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-700 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-hidden text-xs font-bold"
      >
        {t('skipToContent')}
      </a>

      {/* Top Header */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Body Area: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-hidden"
        >
          {children}
        </main>
      </div>

      {/* Floating Learning Assistant on all Learner pages */}
      {currentUser.role === 'learner' && <FloatingAssistant />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppLayout>
          <Routes>
            {/* Public / Common Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Learner Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <AdaptiveAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gap-analysis"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <GapAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning-path"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearningPathPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz-generator"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <QuizGeneratorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <OpportunitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentorship"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <MentorshipPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <RewardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <RewardStorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />

            {/* Mentor Routes */}
            <Route
              path="/mentor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <MentorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/mentee/:id"
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <MenteeDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rewards"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRewardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/catalog"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applicants"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminApplicantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/mentors"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMentorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect based on active user role */}
            <Route
              path="/"
              element={<RoleHomeRedirect />}
            />

            {/* Fallback unknown paths */}
            <Route
              path="*"
              element={<RoleHomeRedirect />}
            />
          </Routes>
        </AppLayout>
      </HashRouter>
    </AppProvider>
  );
}

// Redirects root to the appropriate role home
const RoleHomeRedirect: React.FC = () => {
  const { currentUser } = useApp();

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin/analytics" replace />;
  }
  if (currentUser.role === 'mentor') {
    return <Navigate to="/mentor/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};
