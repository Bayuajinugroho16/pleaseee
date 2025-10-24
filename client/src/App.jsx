import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
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
import NotificationPopup from './components/NotificationPopup'; // ✅ Sudah diimport
import AdminDatabase from './pages/AdminDatabase';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
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
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
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
  }

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/verify" replace />;
    }
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
          <NotificationPopup /> {/* ✅ TAMBAHKAN INI - akan muncul di semua halaman */}
          
          <Routes>
            {/* ✅ Public Route - Login Page */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* ✅ Root path - Redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* ✅ Protected User Routes */}
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
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
              <ProtectedRoute> {/* ✅ TAMBAHKAN INI */}
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
           <Route path="/admin-database" element={<AdminDatabase />} />
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
            
            {/* ✅ Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;