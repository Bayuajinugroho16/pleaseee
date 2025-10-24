import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import BundleTicket from './pages/BundleTicket';
import BundleCheckout from './pages/Bundlecheckout';
import Booking from './pages/Booking';
import Tutorial from './pages/Tutorial';
import Payment from './pages/Payment';
import Ticket from './pages/Ticket';
import MovieDetail from './components/MovieDetail';
import MyTickets from './pages/MyTickets';
import AdminVerify from './pages/AdminVerify';
import QRScanner from './components/QRScanner';
import StaffDashboard from './components/StaffDashboard';
import Login from './pages/Login';
import TicketValidationAlert from './components/TicketValidationAlert';
import NotificationPopup from './components/NotificationPopup';
import AdminDatabase from './pages/AdminDatabase';
import './App.css';

// Loading Component
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#667eea'
  }}>
    🔄 Loading...
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Public Route Component (hanya untuk non-authenticated users)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ JIKA SUDAH LOGIN, REDIRECT KE HOME
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* ✅ GLOBAL NOTIFICATION COMPONENTS */}
          <TicketValidationAlert />
          <NotificationPopup />
          
          <Routes>
            {/* ✅ Public Routes - hanya bisa diakses jika belum login */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* ✅ Root path - Redirect berdasarkan auth status */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* ✅ Protected User Routes - hanya untuk authenticated users */}
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            <Route path="/bundle-ticket" element={
              <ProtectedRoute>
                <BundleTicket />
              </ProtectedRoute>
            } />
            
            <Route path="/bundle-checkout" element={
              <ProtectedRoute>
                <BundleCheckout />
              </ProtectedRoute>
            } />
            
            <Route path="/booking" element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            } />
            
            <Route path="/movie/:id" element={
              <ProtectedRoute>
                <MovieDetail />
              </ProtectedRoute>
            } />
            
            <Route path="/tutorial" element={
              <ProtectedRoute>
                <Tutorial />
              </ProtectedRoute>
            } />
            
            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />
            
            <Route path="/ticket" element={
              <ProtectedRoute>
                <Ticket />
              </ProtectedRoute>
            } />
            
            <Route path="/my-tickets" element={
              <ProtectedRoute>
                <MyTickets />
              </ProtectedRoute>
            } />
            
            <Route path="/admin-database" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDatabase />
              </ProtectedRoute>
            } />
            
            {/* ✅ Admin Only Routes */}
            <Route path="/admin/verify" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminVerify />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/scanner" element={
              <ProtectedRoute requireAdmin={true}>
                <QRScanner />
              </ProtectedRoute>
            } />
            
            <Route path="/staff" element={
              <ProtectedRoute requireAdmin={true}>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            
            {/* ✅ Fallback route */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;