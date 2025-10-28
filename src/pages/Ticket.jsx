import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Ticket.css';

const Ticket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { bookingData } = location.state || {};

  // Generate QR code data - HANYA untuk tiket confirmed
  const generateTicketQRData = () => {
    if (!bookingData) return '';
    
    const ticketData = {
      type: 'CINEMA_TICKET',
      booking_reference: bookingData.booking_reference,
      verification_code: bookingData.verification_code,
      movie: bookingData.movie_title,
      seats: Array.isArray(bookingData.seat_numbers) ? bookingData.seat_numbers : JSON.parse(bookingData.seat_numbers || '[]'),
      total_amount: bookingData.total_amount,
      status: bookingData.status,
      is_verified: bookingData.is_verified,
      booking_date: bookingData.booking_date,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(ticketData);
  };

  // Generate QR code image - HANYA untuk tiket confirmed
  const generateQRCodeImage = () => {
    const qrData = generateTicketQRData();
    const encodedData = encodeURIComponent(qrData);
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
            <button onClick={() => navigate('/home')} className="back-home-btn">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parse seat numbers dari JSON string jika perlu
  const getSeatNumbers = () => {
    try {
      if (Array.isArray(bookingData.seat_numbers)) {
        return bookingData.seat_numbers;
      }
      if (typeof bookingData.seat_numbers === 'string') {
        return JSON.parse(bookingData.seat_numbers);
      }
      return ['Unknown'];
    } catch (error) {
      console.error('Error parsing seat numbers:', error);
      return ['Unknown'];
    }
  };

  const seatNumbers = getSeatNumbers();

  // ✅ TAMPILKAN HALAMAN BERBEDA BERDASARKAN STATUS
  const renderTicketContent = () => {
    // CASE 1: TIKET SUDAH CONFIRMED - Tampilkan tiket lengkap
    if (bookingData.status === 'confirmed' || bookingData.is_verified) {
      return (
        <>
          {/* Ticket Card */}
          <div className="ticket-card">
            <h2 className="movie-title">{bookingData.movie_title}</h2>
            
            {/* Booking Reference & Verification Code */}
            <div className="ticket-codes-section">
              <div className="code-item">
                <span className="code-label">Booking Reference:</span>
                <span className="code-value reference">{bookingData.booking_reference}</span>
              </div>
              <div className="code-item">
                <span className="code-label">Verification Code:</span>
                <span className="code-value verification">
                  {bookingData.verification_code}
                </span>
              </div>
            </div>

            <div className="ticket-info">
              <p><strong>Showtime:</strong> {bookingData.showtime || 'N/A'}</p>
              <p><strong>Seats:</strong> 
                <span className="seats-highlight">
                  {seatNumbers.join(', ')}
                </span>
              </p>
              <p><strong>Total Paid:</strong> Rp {parseFloat(bookingData.total_amount || 0).toLocaleString()}</p>
              <p><strong>Customer:</strong> {bookingData.customer_name || bookingData.username || 'Customer'}</p>
              <p><strong>Email:</strong> {bookingData.customer_email || 'N/A'}</p>
              <p><strong>Status:</strong> 
                <span className="status-confirmed">
                  ✅ Terkonfirmasi
                </span>
              </p>
              <p><strong>Verified:</strong> ✅ Yes</p>
            </div>

            {/* QR Code Section - HANYA untuk tiket confirmed */}
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
                    e.target.style.display = 'none';
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'qr-fallback';
                    fallbackDiv.innerHTML = `
                      <div class="fallback-title">QR Code Data:</div>
                      <div class="fallback-data">${generateTicketQRData()}</div>
                    `;
                    e.target.parentNode.appendChild(fallbackDiv);
                  }}
                />
              </div>
              
              <div className="qr-data-info">
                <strong>QR Contains:</strong><br/>
                Ref: {bookingData.booking_reference} | 
                Code: {bookingData.verification_code} |
                Seats: {seatNumbers.join(', ')}
              </div>
            </div>
          </div>

          {/* Important Instructions */}
          <div className="important-instructions">
            <h4>🔐 Simpan Informasi Berikut:</h4>
            <div className="instructions-grid">
              <div className="instruction-item">
                <strong>Booking Reference:</strong>
                <code>{bookingData.booking_reference}</code>
                <small>Untuk tracking booking Anda</small>
              </div>
              <div className="instruction-item">
                <strong>Verification Code:</strong>
                <code>{bookingData.verification_code}</code>
                <small>Untuk penukaran tiket di bioskop</small>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ticket-actions">
            <button onClick={() => navigate('/home')} className="book-another-btn">
              Book Another Movie
            </button>
            <button onClick={() => window.print()} className="print-ticket-btn">
              🖨️ Print Ticket
            </button>
            <button onClick={() => navigate('/mytickets')} className="view-tickets-btn">
              📱 My Tickets
            </button>
          </div>

          {/* Important Information */}
          <div className="ticket-notes">
            <h4>📋 Important Information</h4>
            <ul>
              <li>Arrive at least 15 minutes before the showtime</li>
              <li>Present this QR code at the theater entrance</li>
              <li><strong>Save your Booking Reference & Verification Code!</strong></li>
              <li>Keep your verification code confidential</li>
              <li>Tickets are non-refundable and non-transferable</li>
            </ul>
          </div>
        </>
      );
    }

    // CASE 2: MENUNGGU VERIFIKASI ADMIN
    if (bookingData.status === 'pending_verification') {
      return (
        <div className="pending-verification-section">
          <div className="pending-icon">⏳</div>
          <h2>Tiket Menunggu Verifikasi Admin</h2>
          
          <div className="verification-info-card">
            <h3>📋 Informasi Booking Anda</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Movie:</strong> {bookingData.movie_title}
              </div>
              <div className="info-item">
                <strong>Seats:</strong> {seatNumbers.join(', ')}
              </div>
              <div className="info-item">
                <strong>Total:</strong> Rp {parseFloat(bookingData.total_amount || 0).toLocaleString()}
              </div>
              <div className="info-item highlight">
                <strong>Booking Reference:</strong> 
                <code>{bookingData.booking_reference}</code>
              </div>
              <div className="info-item highlight">
                <strong>Verification Code:</strong> 
                <code>{bookingData.verification_code}</code>
              </div>
            </div>
          </div>

          <div className="verification-instructions">
            <h4>📝 Yang Perlu Dilakukan:</h4>
            <ul>
              <li>✅ <strong>Bukti pembayaran sudah diupload</strong></li>
              <li>⏳ <strong>Menunggu verifikasi admin</strong></li>
              <li>📧 <strong>Anda akan mendapat notifikasi ketika tiket dikonfirmasi</strong></li>
              <li>🔐 <strong>Simpan Booking Reference & Verification Code Anda!</strong></li>
            </ul>
          </div>

          <div className="pending-actions">
            <button onClick={() => navigate('/mytickets')} className="view-tickets-btn">
              📱 Lihat Semua Tiket Saya
            </button>
            <button onClick={() => navigate('/home')} className="book-another-btn">
              🎬 Booking Film Lain
            </button>
          </div>
        </div>
      );
    }

    // CASE 3: BELUM BAYAR (PENDING)
    if (bookingData.status === 'pending') {
      return (
        <div className="pending-payment-section">
          <div className="pending-icon">💳</div>
          <h2>Menunggu Pembayaran</h2>
          
          <div className="payment-info-card">
            <h3>📋 Detail Booking</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Movie:</strong> {bookingData.movie_title}
              </div>
              <div className="info-item">
                <strong>Seats:</strong> {seatNumbers.join(', ')}
              </div>
              <div className="info-item">
                <strong>Total:</strong> Rp {parseFloat(bookingData.total_amount || 0).toLocaleString()}
              </div>
              <div className="info-item">
                <strong>Status:</strong> <span className="status-pending">Menunggu Pembayaran</span>
              </div>
            </div>
          </div>

          <div className="payment-instructions">
            <h4>💡 Langkah Selanjutnya:</h4>
            <ol>
              <li>1. Selesaikan pembayaran sesuai nominal</li>
              <li>2. Upload bukti transfer di halaman payment</li>
              <li>3. Dapatkan Booking Reference & Verification Code</li>
              <li>4. Tunggu verifikasi admin</li>
              <li>5. Dapatkan e-ticket lengkap</li>
            </ol>
          </div>

          <div className="payment-actions">
            <button 
              onClick={() => navigate('/payment', { state: { pendingBooking: bookingData } })}
              className="proceed-payment-btn"
            >
              💳 Lanjutkan ke Pembayaran
            </button>
            <button onClick={() => navigate('/home')} className="cancel-booking-btn">
              ❌ Batalkan Booking
            </button>
          </div>
        </div>
      );
    }

    // CASE 4: STATUS LAIN (canceled, payment_rejected, dll)
    return (
      <div className="other-status-section">
        <div className="status-icon">❓</div>
        <h2>Status Tiket: {bookingData.status}</h2>
        <p>Status tiket Anda saat ini: <strong>{bookingData.status}</strong></p>
        <button onClick={() => navigate('/mytickets')} className="view-tickets-btn">
          📱 Lihat Tiket Saya
        </button>
      </div>
    );
  };

  return (
    <div className="ticket-container">
      <Navigation />
      
      <div className="page-content">
        <div className="ticket-content">
          <h1 className="ticket-title">
            {bookingData.status === 'confirmed' ? '🎫 E-Ticket Anda' : 
             bookingData.status === 'pending_verification' ? '⏳ Menunggu Verifikasi' :
             bookingData.status === 'pending' ? '💳 Menunggu Pembayaran' : '📋 Status Tiket'}
          </h1>
          
          {renderTicketContent()}
        </div>
      </div>
    </div>
  );
};

export default Ticket;