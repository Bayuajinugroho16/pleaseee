import React from 'react';
import './QRCodeTicket.css';

const QRCodeTicket = ({ bookingData }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ticket-container">
      <div className="ticket">
        {/* Ticket Header */}
        <div className="ticket-header">
          <h1>🎬 UNEFF 2025</h1>
          <div className="booking-reference">
            REF: {bookingData.booking_reference}
          </div>
        </div>

        {/* Movie Info */}
        <div className="ticket-section">
          <h2>{bookingData.movie_title}</h2>
          <div className="ticket-details">
            <div className="detail-item">
              <span>Tanggal</span>
              <span>{formatDate(bookingData.start_time)}</span>
            </div>
            <div className="detail-item">
              <span>Jam Tayang</span>
              <span>{formatTime(bookingData.start_time)}</span>
            </div>
            <div className="detail-item">
              <span>Teater</span>
              <span>{bookingData.theater_name}</span>
            </div>
            <div className="detail-item">
              <span>Kursi</span>
              <span className="seats">{bookingData.seat_numbers.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="ticket-section qr-section">
          <div className="qr-code">
            <img src={bookingData.qr_code_data} alt="QR Code" />
          </div>
          <p className="scan-instruction">
            Scan QR code di loket bioskop
          </p>
          <div className="verification-code">
            Kode Verifikasi: <strong>{bookingData.verification_code}</strong>
          </div>
        </div>

        {/* Customer Info */}
        <div className="ticket-section customer-info">
          <div className="detail-item">
            <span>Nama</span>
            <span>{bookingData.customer_name}</span>
          </div>
          <div className="detail-item">
            <span>Email</span>
            <span>{bookingData.customer_email}</span>
          </div>
          <div className="detail-item">
            <span>Total</span>
            <span className="total-amount">
              Rp {parseInt(bookingData.total_amount).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="ticket-footer">
          <p>Terima kasih telah memesan di UNEFF 2025</p>
          <p>Harap datang 15 menit sebelum film dimulai</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ticket-actions">
        <button 
          className="btn-primary"
          onClick={() => window.print()}
        >
          🖨️ Print Tiket
        </button>
        <button 
          className="btn-secondary"
          onClick={() => window.location.href = '/'}
        >
          🎬 Pesan Lagi
        </button>
      </div>
    </div>
  );
};

export default QRCodeTicket;