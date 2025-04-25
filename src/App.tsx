import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import PreferencesPage from './pages/preferences/PreferencesPage';
import BillingPage from './pages/billing/BillingPage';
import ActivityLogPage from './pages/activity/ActivityLogPage';
import SettingsPage from './pages/settings/SettingsPage';
import Layout from './components/layout/Layout';
import { useEmailProcessing } from './lib/hooks/useEmailProcessing';
import { useAuth } from './contexts/AuthContext';
import BackgroundProcessor from './components/BackgroundProcessor';
import { storeUserSession, updateLastActive } from './lib/services/auth-persistence';

// EmailProcessor component to handle background email processing
const EmailProcessor: React.FC = () => {
  const { fetchAndProcessEmails } = useEmailProcessing();
  const { userProfile, currentUser } = useAuth();

  // Set up background email processing
  useEffect(() => {
    // Store user session for background processing
    if (currentUser) {
      storeUserSession(currentUser.uid, currentUser.email || '');
      
      // Update last active timestamp
      updateLastActive();
    }
    
    if (!userProfile?.preferences?.autoClassify) {
      console.log("EmailProcessor: Auto-classify is disabled, skipping background processing");
      return;
    }

    console.log("EmailProcessor: Setting up background email processing");
    
    // Process emails on component mount
    fetchAndProcessEmails();

    // Set up interval for periodic checks (every 1 minute)
    const intervalId = setInterval(() => {
      // Only process if we're online
      if (navigator.onLine) {
        console.log("EmailProcessor: Running scheduled email processing");
        fetchAndProcessEmails();
      } else {
        console.log("EmailProcessor: Offline, skipping scheduled processing");
      }
    }, 60 * 1000); // 1 minute in milliseconds

    // Clean up on unmount
    return () => {
      console.log("EmailProcessor: Cleaning up email processing interval");
      clearInterval(intervalId);
    };
  }, [fetchAndProcessEmails, userProfile, currentUser]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
            },
          }}
        />
        {/* Render EmailProcessor for logged-in users */}
        <EmailProcessor />
        
        {/* Render BackgroundProcessor for handling emails even when users aren't actively logged in */}
        <BackgroundProcessor />
        
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="preferences" element={<PreferencesPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="activity" element={<ActivityLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;