import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NewGatePassPage from './pages/NewGatePassPage.jsx';
import GatePassLabelPage from './pages/GatePassLabelPage.jsx';
import UnloadingPage from './pages/UnloadingPage.jsx';
import QcPage from './pages/QcPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';

function ProtectedRoute({ children, adminOnly }) {
  const { user } = useAuth();
  if (user === undefined) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <span className="spinner" style={{ width:'2.5rem', height:'2.5rem' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/gate-pass/new" element={<NewGatePassPage />} />
        <Route path="/gate-pass/:code/label" element={<GatePassLabelPage />} />
        <Route path="/unloading" element={<UnloadingPage />} />
        <Route path="/unloading/:code" element={<UnloadingPage />} />
        <Route path="/qc" element={<QcPage />} />
        <Route path="/qc/:code" element={<QcPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/:code" element={<CheckoutPage />} />
        <Route path="/employees" element={<ProtectedRoute adminOnly><EmployeesPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
