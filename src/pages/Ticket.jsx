import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Ticket.css';

const Ticket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { bookingData } = location.state || {};

  // Generate QR code data untuk petugas
  const generateTicketQRData = () => {
    if (!bookingData) return '';
    
    const ticketData = {
      type: 'CINEMA_TICKET',
      booking_reference: bookingData.booking_reference,
      verification_code: bookingData.verification_code,
      movie: bookingData.movie_title,
      seats: bookingData.seat_numbers,
      showtime: bookingData.showtime,
      customer: bookingData.customer_name,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(ticketData);
  };

  // Generate QR code image URL menggunakan API QR server
  const generateQRCodeImage = () => {
    const qrData = generateTicketQRData();
    // Encode data untuk URL
    const encodedData = encodeURIComponent(qrData);
    // Gunakan QR code generator API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
  };

  if (!bookingData) {
    return (
      <div className="ticket-container">
        <Navigation />
        <div className="page-content">
          <div className="no-ticket-data">
            <h2>No ticket data found</h2>
            <p>Please complete a booking first to view your ticket</p>
            <button 
              onClick={() => navigate('/home')}
              className="back-home-btn"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-container">
      <Navigation />
      
      <div className="page-content">
        <div className="ticket-content">
          <h1 className="ticket-title">🎫 Your E-Ticket</h1>
          
          {/* Ticket Card */}
          <div className="ticket-card">
            <h2 className="movie-title">{bookingData.movie_title}</h2>
            
            <div className="ticket-details-grid">
              <div className="detail-item">
                <p><strong>Booking Reference:</strong></p>
                <p className="reference-code">{bookingData.booking_reference}</p>
              </div>
              <div className="detail-item">
                <p><strong>Verification Code:</strong></p>
                <p className="verification-code">{bookingData.verification_code}</p>
              </div>
            </div>

            <div className="ticket-info">
              <p><strong>Showtime:</strong> {bookingData.showtime}</p>
              <p><strong>Seats:</strong> 
                <span className="seats-highlight">
                  {bookingData.seat_numbers?.join(', ')}
                </span>
              </p>
              <p><strong>Total Paid:</strong> Rp {bookingData.total_amount?.toLocaleString()}</p>
              <p><strong>Customer:</strong> {bookingData.customer_name}</p>
              <p><strong>Email:</strong> {bookingData.customer_email}</p>
              <p><strong>Status:</strong> <span className="status-confirmed">Confirmed</span></p>
            </div>

            {/* QR Code Section */}
            <div className="qr-section">
              <h3 className="qr-title">🎯 Scan QR Code for Entry</h3>
              <p className="qr-description">
                Present this QR code to theater staff for verification
              </p>
              
              <div className="qr-code-container">
                <img 
                  src={generateQRCodeImage()} 
                  alt="Ticket QR Code" 
                  className="qr-code-image"
                  onError={(e) => {
                    console.error('Failed to load QR code image');
                    // Fallback: tampilkan data text jika QR gagal load
                    e.target.style.display = 'none';
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.innerHTML = `
                      <div class="qr-fallback">
                        <div class="fallback-title">QR Code Data:</div>
                        <div class="fallback-data">${generateTicketQRData()}</div>
                      </div>
                    `;
                    e.target.parentNode.appendChild(fallbackDiv.firstChild);
                  }}
                />
              </div>
              
              {/* QR Code Data Info */}
              <div className="qr-data-info">
                <strong>QR Contains:</strong><br/>
                Ref: {bookingData.booking_reference} | 
                Code: {bookingData.verification_code} |
                Seats: {bookingData.seat_numbers?.join(', ')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ticket-actions">
            <button 
              onClick={() => navigate('/home')}
              className="book-another-btn"
            >
              Book Another Movie
            </button>
            
            <button 
              onClick={() => window.print()}
              className="print-ticket-btn"
            >
              🖨️ Print Ticket
            </button>

            <button 
              onClick={() => navigate('/ticket')}
              className="view-tickets-btn"
            >
              📱 My Tickets
            </button>
          </div>

          {/* Important Information */}
          <div className="ticket-notes">
            <h4>📋 Important Information</h4>
            <ul>
              <li>Arrive at least 15 minutes before the showtime</li>
              <li>Present this QR code at the theater entrance</li>
              <li>Keep your verification code confidential</li>
              <li>Tickets are non-refundable and non-transferable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;