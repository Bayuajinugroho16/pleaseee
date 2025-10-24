// pages/MyTickets.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import './MyTickets.css';

const MyTickets = () => {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyTickets();
    }
  }, [isAuthenticated, user]);

  // ✅ FUNCTION UNTUK HANDLE SEAT NUMBERS DENGAN DEBUGGING
  const parseSeatNumbers = (seatData) => {
    console.log('🔍 Parsing seat data:', seatData);
    console.log('🔍 Type of seat data:', typeof seatData);
    
    if (!seatData) {
      console.log('❌ Seat data is null or undefined');
      return 'No seats assigned';
    }

    try {
      // Jika sudah array, langsung return
      if (Array.isArray(seatData)) {
        console.log('✅ Seat data is already array:', seatData);
        return seatData.filter(seat => seat && seat.trim() !== '').join(', ');
      }

      // Jika string, coba parse
      if (typeof seatData === 'string') {
        const trimmed = seatData.trim();
        
        // Cek jika string kosong
        if (trimmed === '') {
          console.log('❌ Seat data is empty string');
          return 'No seats assigned';
        }

        // Cek jika format JSON array
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            console.log('✅ Parsed JSON seats:', parsed);
            if (Array.isArray(parsed)) {
              return parsed.filter(seat => seat && seat.trim() !== '').join(', ');
            }
          } catch (jsonError) {
            console.error('❌ JSON parse error:', jsonError);
          }
        }

        // Cek jika format comma separated
        if (trimmed.includes(',')) {
          const seats = trimmed.split(',').map(seat => seat.trim().replace(/[\[\]"]/g, ''));
          console.log('✅ Comma separated seats:', seats);
          return seats.filter(seat => seat && seat.trim() !== '').join(', ');
        }

        // Single seat
        console.log('✅ Single seat:', trimmed);
        return trimmed.replace(/[\[\]"]/g, '');
      }

      // Fallback: convert to string
      console.log('✅ Fallback seat conversion:', String(seatData));
      return String(seatData);
    } catch (error) {
      console.error('❌ Error in parseSeatNumbers:', error);
      return 'Seat information not available';
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const username = user?.username;
      
      if (!username) {
        setError('User not found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('🎫 Fetching tickets for:', username);
      
      const response = await fetch(
        `http://localhost:5000/api/bookings/my-bookings?username=${encodeURIComponent(username)}`
      );

      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tickets: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Tickets loaded:', result.data.length, 'tickets');
        
        // ✅ DEBUG: Log detail setiap ticket termasuk seat_numbers
        result.data.forEach((ticket, index) => {
          console.log(`--- Ticket ${index + 1} ---`);
          console.log('Movie:', ticket.movie_title);
          console.log('Raw seat_numbers:', ticket.seat_numbers);
          console.log('Type of seat_numbers:', typeof ticket.seat_numbers);
          console.log('Parsed seats:', parseSeatNumbers(ticket.seat_numbers));
          console.log('-------------------');
        });
        
        setTickets(result.data);
      } else {
        throw new Error(result.message || 'Failed to load tickets');
      }
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
const getDisplaySeats = (seatData) => {
  if (Array.isArray(seatData) && seatData.length > 0) {
    return seatData.join(', ');
  }
  return '-';
};
  // ✅ FUNCTION UNTUK MENAMPILKAN E-TICKET
  const showETicket = (ticket) => {
    console.log('🎟️ Opening e-ticket for:', ticket.movie_title);
    console.log('🎟️ Seat numbers:', ticket.seat_numbers);
    console.log('🎟️ Parsed seats:', parseSeatNumbers(ticket.seat_numbers));
    setSelectedTicket(ticket);
  };

  // ✅ FUNCTION UNTUK MENUTUP E-TICKET
  const closeETicket = () => {
    setSelectedTicket(null);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { class: 'status-confirmed', text: 'Confirmed' },
      pending: { class: 'status-pending', text: 'Pending Payment' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { class: 'status-unknown', text: status };
    
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // ✅ FORMAT TANGGAL UNTUK E-TICKET
  const formatDateForTicket = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ HANDLE USER NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="my-tickets-container">
        <Navigation />
        <div className="page-content">
          <div className="not-authenticated">
            <div className="auth-icon">🔐</div>
            <h3>Authentication Required</h3>
            <p>Please login to view your tickets</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-tickets-container">
        <Navigation />
        <div className="page-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your tickets...</p>
            <small>Fetching data for: <strong>{user?.username}</strong></small>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-tickets-container">
        <Navigation />
        <div className="page-content">
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h3>Error Loading Tickets</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={fetchMyTickets} className="retry-btn">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-tickets-container">
      <Navigation />
      
      <div className="page-content">
        <div className="my-tickets-content">
          {/* Header */}
          <div className="tickets-header">
            <h1>My Tickets 🎫</h1>
            <p>Welcome back, <strong>{user?.username}</strong>! Manage your movie tickets</p>
          </div>

          {/* Summary Cards */}
          <div className="tickets-summary">
            <div className="summary-card total">
              <div className="summary-icon">🎫</div>
              <div className="summary-info">
                <h3>{tickets.length}</h3>
                <p>Total Tickets</p>
              </div>
            </div>
            
            <div className="summary-card confirmed">
              <div className="summary-icon">✅</div>
              <div className="summary-info">
                <h3>{tickets.filter(t => t.status === 'confirmed').length}</h3>
                <p>Confirmed</p>
              </div>
            </div>
            
            <div className="summary-card pending">
              <div className="summary-icon">⏳</div>
              <div className="summary-info">
                <h3>{tickets.filter(t => t.status === 'pending').length}</h3>
                <p>Pending</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="tickets-filter">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({tickets.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setFilter('confirmed')}
            >
              Confirmed ({tickets.filter(t => t.status === 'confirmed').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({tickets.filter(t => t.status === 'pending').length})
            </button>
          </div>

          {/* Tickets List */}
          <div className="tickets-list">
            {filteredTickets.length === 0 ? (
              <div className="no-tickets">
                <div className="no-tickets-icon">🎭</div>
                <h3>No tickets found</h3>
                <p>
                  {filter === 'all' 
                    ? "You haven't booked any tickets yet. Start by booking a movie!" 
                    : `No ${filter} tickets found.`
                  }
                </p>
                {filter !== 'all' && (
                  <button 
                    onClick={() => setFilter('all')}
                    className="view-all-btn"
                  >
                    View All Tickets
                  </button>
                )}
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className={`ticket-card ${ticket.status}`}>
                  <div className="ticket-header">
                    <div className="movie-info">
                      <h3>{ticket.movie_title}</h3>
                      <p className="showtime">
                        <span className="showtime-icon">🕒</span>
                        {ticket.showtime}
                      </p>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  <div className="ticket-details">
                    <div className="detail-row">
                      <span className="detail-label">Booking Reference:</span>
                      <span className="detail-value ref">{ticket.booking_reference}</span>
                    </div>
                    
                  <div className="detail-row">
  <span className="detail-label">Seats:</span>
  <span className="detail-value seats">
    {/* ✅ LANGSUNG TAMPILKAN STRING - TIDAK PERLU .join() */}
    {ticket.seat_numbers || 'No seat data'}
  </span>
</div>
                    

                    
                    <div className="detail-row">
                      <span className="detail-label">Total Amount:</span>
                      <span className="detail-value price">
                        {formatCurrency(ticket.total_amount)}
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Booking Date:</span>
                      <span className="detail-value">
                        {new Date(ticket.booking_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {ticket.verification_code && ticket.status === 'confirmed' && (
                      <div className="detail-row">
                        <span className="detail-label">Verification Code:</span>
                        <span className="detail-value verification-code">
                          {ticket.verification_code}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ✅ UPDATED ACTIONS - Hanya View E-Ticket untuk confirmed tickets */}
                  <div className="ticket-actions">
                    {ticket.status === 'confirmed' && (
                      <button 
                        onClick={() => showETicket(ticket)}
                        className="action-btn primary"
                      >
                        🎟️ View E-Ticket
                      </button>
                    )}
                    
                    {ticket.status === 'pending' && (
                      <button className="action-btn warning">
                        💳 Complete Payment
                      </button>
                    )}
                  </div>

                  {/* QR Code Preview */}
                  {ticket.qr_code_data && ticket.status === 'confirmed' && (
                    <div className="qr-preview">
                      <span className="qr-icon">📱</span>
                      <small>QR Code ready for cinema entry</small>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Refresh Section */}
          <div className="refresh-section">
            <button 
              onClick={fetchMyTickets}
              className="refresh-btn"
              disabled={loading}
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Tickets'}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ E-TICKET MODAL */}
      {selectedTicket && (
        <div className="e-ticket-modal">
          <div className="modal-overlay" onClick={closeETicket}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>E-Ticket 🎫</h2>
              <button onClick={closeETicket} className="close-modal">×</button>
            </div>
            
            <div className="e-ticket">
              {/* Ticket Header */}
              <div className="e-ticket-header">
                <div className="cinema-brand">
                  <h2>🎬 CINEMA TICKET</h2>
                  <div className="brand-subtitle">Bioskop Tiket Digital</div>
                </div>
                <div className="ticket-status confirmed">
                  <span className="status-icon">✅</span>
                  CONFIRMED
                </div>
              </div>

              {/* Movie Info */}
              <div className="e-ticket-section">
                <div className="section-label">MOVIE</div>
                <div className="movie-info">
                  <h3 className="movie-title">{selectedTicket.movie_title}</h3>
                  <div className="showtime-info">
                    <span className="info-icon">🕒</span>
                    {selectedTicket.showtime}
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="e-ticket-details">
                <div className="detail-item">
                  <div className="detail-label">Booking Reference</div>
                  <div className="detail-value ref">{selectedTicket.booking_reference}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Verification Code</div>
                  <div className="detail-value code">{selectedTicket.verification_code}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Seat Numbers</div>
                  <div className="detail-value seats">
                    {/* ✅ GUNAKAN parseSeatNumbers YANG SAMA DI MODAL */}
                    {parseSeatNumbers(selectedTicket.seat_numbers)}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Total Amount</div>
                  <div className="detail-value price">{formatCurrency(selectedTicket.total_amount)}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="e-ticket-section">
                <div className="section-label">CUSTOMER INFORMATION</div>
                <div className="customer-info">
                  <div className="customer-detail">
                    <span className="label">Name:</span>
                    <span className="value">{selectedTicket.customer_name}</span>
                  </div>
                  <div className="customer-detail">
                    <span className="label">Email:</span>
                    <span className="value">{selectedTicket.customer_email}</span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="e-ticket-section">
                <div className="section-label">BOOKING INFORMATION</div>
                <div className="booking-info">
                  <div className="booking-detail">
                    <span className="label">Booking Date:</span>
                    <span className="value">{formatDateForTicket(selectedTicket.booking_date)}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Area */}
              <div className="qr-section">
                <div className="section-label">CINEMA ENTRY CODE</div>
                <div className="qr-container">
                  <div className="qr-placeholder">
                    <div className="qr-icon">📱</div>
                    <div className="qr-text">Digital QR Code</div>
                    <div className="verification-code-large">
                      {selectedTicket.verification_code}
                    </div>
                  </div>
                </div>
                <div className="qr-instructions">
                  <p>🎯 <strong>Present this code at cinema entrance</strong></p>
                  <p>⏰ <strong>Arrive 15 minutes before showtime</strong></p>
                </div>
              </div>

              {/* Ticket Footer */}
              <div className="e-ticket-footer">
                <div className="footer-note">
                  <p>This is your digital ticket. No need to print.</p>
                  <p>Show this screen to cinema staff for entry.</p>
                </div>
                <div className="footer-barcode">
                  <div className="barcode">|||| |||| |||| |||| |||| ||||</div>
                  <div className="barcode-number">{selectedTicket.booking_reference}</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button 
                onClick={() => window.print()}
                className="action-btn print-btn"
              >
                🖨️ Print Ticket
              </button>
              <button 
                onClick={closeETicket}
                className="action-btn close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;