// Di file MyTickets.js - Tambahkan emergency system
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MyTickets.css';

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ EMERGENCY: Get tickets from localStorage
  const getEmergencyTickets = () => {
    try {
      // Cari dari emergency payments
      const emergencyPayments = JSON.parse(localStorage.getItem('emergency_payments') || '[]');
      const userTickets = emergencyPayments.filter(payment => 
        // Jika ada username di payment data, atau ambil semua
        !payment.username || payment.username === user?.username
      );

      console.log('🆘 EMERGENCY TICKETS:', userTickets);
      return userTickets.map(payment => ({
        id: `emergency_${payment.booking_reference}`,
        booking_reference: payment.booking_reference,
        movie_title: 'Movie (Emergency)',
        seat_numbers: ['A1'], // Default seat
        total_amount: 0,
        status: 'confirmed',
        payment_proof: payment.payment_url,
        payment_filename: payment.payment_filename,
        booking_date: payment.saved_at,
        is_emergency: true
      }));
    } catch (error) {
      console.error('❌ Emergency tickets error:', error);
      return [];
    }
  };

  // ✅ EMERGENCY: Create mock ticket from recent booking
  const createMockTicketFromBooking = () => {
    try {
      const recentBooking = JSON.parse(localStorage.getItem('recent_booking') || 'null');
      if (recentBooking) {
        return [{
          id: `mock_${recentBooking.booking_reference}`,
          booking_reference: recentBooking.booking_reference,
          movie_title: recentBooking.movie_title || 'Recent Movie',
          seat_numbers: recentBooking.seat_numbers || ['A1'],
          total_amount: recentBooking.total_amount || 0,
          status: 'confirmed',
          booking_date: new Date().toISOString(),
          is_mock: true
        }];
      }
    } catch (error) {
      console.error('❌ Mock ticket error:', error);
    }
    return [];
  };

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }

      try {
        console.log(`🎫 Fetching tickets for username: ${user.username}`);
        
        // ✅ COBA DARI SERVER DULU
        try {
          const response = await fetch(
            `https://beckendflyio.vercel.app/api/bookings/my-bookings?username=${user.username}`
          );
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('✅ Server tickets:', result.data);
              setTickets(result.data);
              setLoading(false);
              return;
            }
          }
        } catch (serverError) {
          console.log('⚠️ Server fetch failed, using emergency data');
        }

        // ✅ JIKA SERVER ERROR, GUNAKAN EMERGENCY DATA
        const emergencyTickets = getEmergencyTickets();
        const mockTickets = createMockTicketFromBooking();
        
        const allTickets = [...emergencyTickets, ...mockTickets];
        
        console.log('📊 All tickets for user:', user.username, 'Total:', allTickets.length);
        console.log('🔍 USER TICKETS BREAKDOWN:', allTickets);
        
        setTickets(allTickets);
        
      } catch (error) {
        console.error('❌ Fetch tickets error:', error);
        setError('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  // ✅ SIMPAN DATA BOOKING TERAKHIR UNTUK EMERGENCY
  useEffect(() => {
    // Listen untuk navigation dari payment page
    const handleStorageChange = () => {
      const recentBooking = JSON.parse(localStorage.getItem('recent_booking') || 'null');
      if (recentBooking) {
        console.log('📝 Recent booking detected:', recentBooking);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="my-tickets-container">
      <Navigation />
      
      <div className="page-content">
        <div className="tickets-header">
          <h1>My Tickets</h1>
          <p>Your movie bookings and e-tickets</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* ✅ EMERGENCY WARNING */}
        {tickets.some(ticket => ticket.is_emergency || ticket.is_mock) && (
          <div className="emergency-warning-banner">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <strong>Emergency Mode</strong>
              <p>Some tickets are loaded from local storage because server is unavailable.</p>
            </div>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="no-tickets">
            <div className="no-tickets-icon">🎭</div>
            <h3>No Tickets Found</h3>
            <p>You haven't booked any movies yet.</p>
            <button 
              onClick={() => window.location.href = '/home'}
              className="book-now-btn"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h3>{ticket.movie_title}</h3>
                  <span className={`status-badge ${ticket.status}`}>
                    {ticket.status}
                    {(ticket.is_emergency || ticket.is_mock) && ' ⚠️'}
                  </span>
                </div>
                
                <div className="ticket-details">
                  <div className="detail-row">
                    <span className="label">Booking Ref:</span>
                    <span className="value">{ticket.booking_reference}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Seats:</span>
                    <span className="value seats">
                      {Array.isArray(ticket.seat_numbers) 
                        ? ticket.seat_numbers.join(', ')
                        : ticket.seat_numbers}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value amount">
                      Rp {ticket.total_amount?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Booking Date:</span>
                    <span className="value">
                      {new Date(ticket.booking_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* ✅ TAMPILKAN PAYMENT PROOF JIKA ADA */}
                {ticket.payment_proof && (
                  <div className="payment-proof-section">
                    <h4>Payment Proof:</h4>
                    <img 
                      src={ticket.payment_proof} 
                      alt="Payment Proof" 
                      className="payment-proof-image"
                    />
                  </div>
                )}

                <div className="ticket-actions">
                  <button 
                    onClick={() => {/* View ticket details */}}
                    className="view-ticket-btn"
                  >
                    View Ticket
                  </button>
                  
                  {(ticket.is_emergency || ticket.is_mock) && (
                    <button 
                      onClick={() => {
                        // Simpan data untuk recovery
                        localStorage.setItem('recovery_ticket', JSON.stringify(ticket));
                        alert('Ticket data saved for recovery. Contact admin with booking reference: ' + ticket.booking_reference);
                      }}
                      className="recovery-btn"
                    >
                      Save for Recovery
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ EMERGENCY INSTRUCTIONS */}
        <div className="emergency-info">
          <h4>⚠️ Server Issues Detected</h4>
          <p>If your tickets are not showing correctly:</p>
          <ul>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Contact support with your booking reference</li>
            <li>Recent bookings may be saved locally</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;