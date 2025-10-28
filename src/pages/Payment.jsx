import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Payment.css";
import { supabase } from "../lib/supabase";
import gopayQR from "../../public/images/gopay1-qr.jpg";

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Ambil pendingBooking dari location state
  useEffect(() => {
    if (location.state?.pendingBooking) {
      setPendingBooking(location.state.pendingBooking);
    }
  }, [location.state]);

  // Handle Upload File
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File terlalu besar (max 5MB)");
      if (!file.type.startsWith("image/")) throw new Error("Hanya file gambar yang diizinkan");

      // Simpan file ke Supabase
      const fileExt = file.name.split(".").pop();
      const fileName = `${pendingBooking.username}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error } = await supabase.storage
        .from(import.meta.env.VITE_SUPABASE_BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(import.meta.env.VITE_SUPABASE_BUCKET)
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
      });

      setPaymentProof({ name: file.name, base64: base64Image, fileUrl: imageUrl });

      // Update pendingBooking dengan link file
      setPendingBooking((prev) => ({
        ...prev,
        status: "pending_verification",
        payment_proof: imageUrl,
      }));

      setShowConfirmation(true);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Konfirmasi pembayaran & navigasi ke tiket
  const handleConfirmPayment = () => {
    if (!pendingBooking || !paymentProof) return;

    const ticketData = {
      ...pendingBooking,
      is_verified: 0,
      booking_date: new Date().toISOString(),
    };

    setShowConfirmation(false);
    navigate("/ticket", { state: { bookingData: ticketData } });
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPaymentProof(null);
  };

  if (!pendingBooking) {
    return (
      <div className="payment-container">
        <Navigation />
        <div className="page-content">
          <div className="no-pending-booking">
            <h2>No pending booking found</h2>
            <button onClick={() => navigate("/home")} className="back-home-btn">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <Navigation />

      {/* Modal Konfirmasi */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>✅ Upload Successful!</h3>
            </div>
            <div className="modal-content">
              <p>Payment proof uploaded successfully.</p>
              <p>Proceed to your ticket?</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleCancelConfirmation} disabled={loading}>Cancel</button>
              <button onClick={handleConfirmPayment} disabled={loading}>
                {loading ? "Processing..." : "Yes, View Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        <h1 className="payment-title">💳 Payment</h1>

        <div className="order-summary-card">
          <h3>Order Summary</h3>
          <p><strong>Movie:</strong> {pendingBooking.movie_title}</p>
          <p><strong>Showtime:</strong> {pendingBooking.showtime}</p>
          <p><strong>Seats:</strong> {pendingBooking.seat_numbers?.join(", ")}</p>
          <p><strong>Total Amount:</strong> Rp {pendingBooking.total_amount?.toLocaleString()}</p>
          <p><strong>Status:</strong> <span className="status-pending">Waiting for Payment</span></p>
        </div>

        <div className="qris-section">
          <h3>Bayar Sesuai Nominal</h3>
          {!qrImageError ? (
            <img
              src={gopayQR}
              alt="QRIS GoPay"
              className="qris-image"
              onError={() => setQrImageError(true)}
            />
          ) : (
            <p>Transfer ke: 08123456789 (GoPay) | Total: Rp {pendingBooking.total_amount?.toLocaleString()}</p>
          )}
        </div>

        <div className="upload-section">
          <h3>📎 Upload Payment Proof</h3>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={uploading || paymentProof}
          />
          {uploading && <p>Uploading...</p>}
          {paymentProof && (
            <div>
              <h4>Preview:</h4>
              <img src={paymentProof.fileUrl || paymentProof.base64} alt="Payment Preview" />
            </div>
          )}
        </div>

        <div className="payment-actions">
          <button onClick={() => navigate("/booking")}>Back to Booking</button>
          {paymentProof && !showConfirmation && (
            <button onClick={() => setShowConfirmation(true)}>Confirm Payment & Get Ticket</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
