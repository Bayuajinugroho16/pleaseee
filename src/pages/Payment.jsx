import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { supabase } from "../lib/supabase";
import gopayQR from "../../public/images/gopay1-qr.jpg";
import "./Payment.css";

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.pendingBooking) {
      setPendingBooking(location.state.pendingBooking);
    }
  }, [location.state]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File >5MB");
      if (!file.type.startsWith("image/")) throw new Error("File harus gambar");

      const bookingReference = `BK${Date.now().toString().slice(-6)}`;
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const bookingData = {
        ...pendingBooking,
        booking_reference: bookingReference,
        verification_code: verificationCode,
        status: "pending_verification",
      };

      // Simpan ke backend
      const res = await fetch("https://beckendflyio.vercel.app/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Booking gagal");

      // Upload ke Supabase
      const fileExt = file.name.split(".").pop();
      const fileName = `${bookingReference}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from(import.meta.env.VITE_SUPABASE_BUCKET)
        .upload(fileName, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(import.meta.env.VITE_SUPABASE_BUCKET)
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      // Convert base64 untuk preview
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
      });

      setPaymentProof({ name: file.name, base64, fileUrl: imageUrl });

      // Update booking state
      setPendingBooking((prev) => ({
        ...prev,
        booking_reference: bookingReference,
        verification_code: verificationCode,
        status: "pending_verification",
        payment_proof: imageUrl,
      }));

      setShowConfirmation(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!pendingBooking || !paymentProof) return;
    navigate("/ticket", { state: { bookingData: pendingBooking } });
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPaymentProof(null);
  };

  if (!pendingBooking)
    return (
      <div className="payment-container">
        <Navigation />
        <div className="page-content">
          <h2>No pending booking found</h2>
          <button onClick={() => navigate("/booking")}>Back to Booking</button>
        </div>
      </div>
    );

  return (
    <div className="payment-container">
      <Navigation />
      <h1>💳 Payment</h1>

      {/* Order Summary */}
      <div className="order-summary-card">
        <p><strong>Movie:</strong> {pendingBooking.movie_title}</p>
        <p><strong>Showtime:</strong> {pendingBooking.showtime}</p>
        <p><strong>Seats:</strong> {pendingBooking.seat_numbers.join(", ")}</p>
        <p><strong>Total:</strong> Rp {pendingBooking.total_amount.toLocaleString()}</p>
        <p><strong>Status:</strong> Waiting for Payment</p>
      </div>

      {/* QR Code */}
      <div className="qris-section">
        <img src={gopayQR} alt="QRIS GoPay" className="qris-image" />
        <p>Amount: Rp {pendingBooking.total_amount.toLocaleString()}</p>
      </div>

      {/* Upload Payment */}
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading || paymentProof}
        />
        {paymentProof && <p>Uploaded: {paymentProof.name}</p>}
      </div>

      {/* Modal Confirmation */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <h3>✅ Upload Successful!</h3>
            <p>Proceed to view your ticket?</p>
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={handleConfirmPayment}>Yes, View Ticket</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
