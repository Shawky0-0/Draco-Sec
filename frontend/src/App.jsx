import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { ScansProvider } from './context/ScansContext';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { LicensePage } from './features/auth/LicensePage';
import { AuthPageWrapper } from './features/auth/AuthPageWrapper';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OffensiveDashboard } from './features/dashboard/OffensiveDashboard';
import { DefensiveDashboard } from './features/dashboard/Dashboards';
import { ProfilePage } from './features/profile/ProfilePage';
import PhishingPage from './features/phishing/PhishingPage';
import { CampaignDashboard } from './features/phishing/components/CampaignDashboard';
import { ScansPage } from './features/scans/ScansPage';
import { DracoAIPage } from './features/ai/DracoAIPage';
import { AnimatePresence } from 'framer-motion';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth Routes Wrapped in Persistent Layout */}
        <Route element={<AuthPageWrapper />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route path="/license" element={<LicensePage />} />

        {/* Protected Dashboard Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Redirect root to offensive dashboard by default */}
            <Route path="/" element={<Navigate to="/offensive/dashboard" replace />} />
            <Route path="/offensive/dashboard" element={<OffensiveDashboard />} />
            <Route path="/defensive/phishing-campaigns/campaign/:id" element={<CampaignDashboard />} />
            <Route path="/offensive/agent-feed" element={<div className="text-white">Agent Feed</div>} />
            <Route path="/offensive/issues" element={<div className="text-white">Issues</div>} />
            <Route path="/offensive/reports" element={<div className="text-white">Reports</div>} />

            <Route path="/defensive/dashboard" element={<DefensiveDashboard />} />
            <Route path="/defensive/monitoring" element={<div className="text-white">Monitoring</div>} />
            <Route path="/defensive/scans" element={<ScansPage />} />
            <Route path="/defensive/phishing-campaigns" element={<PhishingPage />} />
            <Route path="/draco-ai" element={<DracoAIPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DashboardProvider>
          <ScansProvider>
            <AnimatedRoutes />
          </ScansProvider>
        </DashboardProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
