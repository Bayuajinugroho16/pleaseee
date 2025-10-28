import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Ticket.css";

const Ticket = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { bookingData } = location.state || {};

  if (!bookingData) {
    return (
      <div className="ticket-container">
        <Navigation />
        <div className="page-content">
          <h2>No booking data found</h2>
          <p>Please complete a booking first to view your ticket</p>
          <button onClick={() => navigate("/home")} className="back-home-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const renderTicketContent = () => {
    const seats = Array.isArray(bookingData.seat_numbers)
      ? bookingData.seat_numbers
      : JSON.parse(bookingData.seat_numbers || "[]");

    switch (bookingData.status) {
      case "pending_verification":
        return (
          <div className="pending-verification-section">
            <div className="pending-icon">⏳</div>
            <h2>Tiket Menunggu Verifikasi Admin</h2>
            <div className="info-card">
              <p><strong>Movie:</strong> {bookingData.movie_title}</p>
              <p><strong>Seats:</strong> {seats.join(", ")}</p>
              <p><strong>Total:</strong> Rp {parseFloat(bookingData.total_amount || 0).toLocaleString()}</p>
            </div>
            <div className="instructions">
              <p>✅ Bukti pembayaran sudah diupload</p>
              <p>⏳ Silakan hubungi admin untuk verifikasi</p>
              <p>🔐 Simpan Booking Reference & Verification Code</p>
            </div>
            <button onClick={() => navigate("/home")} className="back-btn">
              Kembali ke Home
            </button>
          </div>
        );
      case "confirmed":
        return (
          <div className="confirmed-ticket-section">
            <h2>🎫 Tiket Anda Sudah Dikonfirmasi</h2>
            <div className="ticket-info">
              <p><strong>Movie:</strong> {bookingData.movie_title}</p>
              <p><strong>Seats:</strong> {seats.join(", ")}</p>
              <p><strong>Total Paid:</strong> Rp {parseFloat(bookingData.total_amount || 0).toLocaleString()}</p>
              <p><strong>Status:</strong> ✅ Terkonfirmasi</p>
            </div>
            <button onClick={() => navigate("/my-tickets")} className="view-tickets-btn">
              Lihat Semua Tiket Saya
            </button>
          </div>
        );
      case "rejected":
        return (
          <div className="rejected-ticket-section">
            <div className="rejected-icon">❌</div>
            <h2>Pembayaran Ditolak</h2>
            <p>Silakan periksa bukti pembayaran atau hubungi admin</p>
            <button onClick={() => navigate("/payment")} className="retry-btn">
              Upload Ulang Bukti Pembayaran
            </button>
          </div>
        );
      default:
        return (
          <div className="unknown-status">
            <h2>Status Tiket Tidak Diketahui</h2>
            <button onClick={() => navigate("/home")} className="back-btn">
              Kembali ke Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="ticket-container">
      <Navigation />
      <div className="page-content">
        <h1>📋 Informasi Tiket</h1>
        {renderTicketContent()}
      </div>
    </div>
  );
};

export default Ticket;
