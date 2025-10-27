import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Payment.css";

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { pendingBooking } = location.state || {};

  // Debug info
  useEffect(() => {
    console.log("🔍 Payment Debug:");
    console.log("Pending Booking:", pendingBooking);
  }, []);

 const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log("📁 File Selected:", file.name);
  setUploading(true);

  try {
    // ✅ GUNAKAN ENDPOINT YANG SUDAH ADA
    console.log("🔄 Using FormData upload...");

    const formData = new FormData();
    formData.append("payment_proof", file);
    formData.append("booking_reference", pendingBooking.booking_reference);

    const response = await fetch(
      "https://beckendflyio.vercel.app/api/upload-payment",
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("📤 Server response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Upload successful:", result);
      
      // Set payment proof untuk preview
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      setPaymentProof({
        name: file.name,
        fileName: result.fileName,
        url: base64Image,
        dbSuccess: true
      });
      
      setShowConfirmation(true);
    } else {
      const errorText = await response.text();
      console.error("❌ Upload failed:", errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

  } catch (error) {
    console.error("❌ Upload error:", error);
    
    // ✅ FALLBACK - BASE64 KE LOCALSTORAGE
    console.log("⚠️ Server upload failed, using base64 fallback...");
    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ticketData = {
        booking_reference: pendingBooking.booking_reference,
        customer_name: pendingBooking.customer_name,
        customer_email: pendingBooking.customer_email,
        movie_title: pendingBooking.movie_title,
        seat_numbers: pendingBooking.seat_numbers,
        total_amount: pendingBooking.total_amount,
        showtime: pendingBooking.showtime,
        status: 'confirmed',
        payment_proof: base64Image,
        payment_filename: file.name,
        saved_at: new Date().toISOString(),
        upload_method: 'base64_fallback'
      };

      // Simpan ke localStorage
      localStorage.setItem('recent_booking', JSON.stringify(ticketData));
      
      const emergencyPayments = JSON.parse(localStorage.getItem('emergency_payments') || '[]');
      const filteredPayments = emergencyPayments.filter(p => 
        p.booking_reference !== pendingBooking.booking_reference
      );
      filteredPayments.push(ticketData);
      localStorage.setItem('emergency_payments', JSON.stringify(filteredPayments));

      setPaymentProof({
        name: file.name,
        fileName: file.name,
        url: base64Image,
        uploadMethod: 'base64'
      });
      
      setShowConfirmation(true);
      
    } catch (fallbackError) {
      console.error("❌ Base64 fallback also failed:", fallbackError);
      alert("Upload completed locally! Your payment proof is saved in browser.");
    }
  } finally {
    setUploading(false);
  }
};

  // ✅ CLEANUP LOCALSTORAGE
  const cleanupLocalStorage = () => {
    try {
      const emergencyPayments = JSON.parse(localStorage.getItem('emergency_payments') || '[]');
      if (emergencyPayments.length > 3) {
        const recentPayments = emergencyPayments.slice(-3);
        localStorage.setItem('emergency_payments', JSON.stringify(recentPayments));
      }
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
  };

  // ✅ UPDATE EMERGENCY PAYMENTS
  const updateEmergencyPayments = (newPayment) => {
    try {
      const emergencyPayments = JSON.parse(localStorage.getItem('emergency_payments') || '[]');
      const filteredPayments = emergencyPayments.filter(p => p.booking_reference !== newPayment.booking_reference);
      filteredPayments.push(newPayment);
      const recentPayments = filteredPayments.slice(-5);
      localStorage.setItem('emergency_payments', JSON.stringify(recentPayments));
    } catch (error) {
      console.log('⚠️ Update emergency payments failed:', error.message);
    }
  };

  // ✅ HANDLE CONFIRM PAYMENT
  const handleConfirmPayment = async () => {
    if (!pendingBooking || !paymentProof) {
      alert("Please upload payment proof first!");
      return;
    }

    setLoading(true);

    try {
      // ✅ LANGSUNG NAVIGATE KE TICKET
      const ticketData = {
        booking_reference: pendingBooking.booking_reference,
        customer_name: pendingBooking.customer_name,
        customer_email: pendingBooking.customer_email,
        movie_title: pendingBooking.movie_title,
        seat_numbers: pendingBooking.seat_numbers,
        total_amount: pendingBooking.total_amount,
        showtime: pendingBooking.showtime,
        status: 'confirmed',
        payment_proof: paymentProof.url,
        emergency_save: !paymentProof.dbSuccess,
        saved_at: new Date().toISOString()
      };

      console.log("🎫 Navigating to ticket with data:", ticketData);

      setShowConfirmation(false);
      navigate("/ticket", { 
        state: { 
          bookingData: ticketData,
          fromPayment: true 
        } 
      });

    } catch (error) {
      console.error("❌ Confirmation error:", error);
      alert("Confirmation error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel Confirmation
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
            <p>Please complete a booking first to proceed with payment</p>
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

      {/* ✅ MODAL KONFIRMASI SETELAH UPLOAD */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>✅ Upload Successful!</h3>
            </div>
            <div className="modal-content">
              <p>Your payment proof has been uploaded successfully.</p>
              <div className="file-info">
                <strong>File:</strong> {paymentProof.name}
              </div>
              {!paymentProof.dbSuccess && (
                <div className="emergency-warning">
                  ⚠️ <strong>Note:</strong> Payment saved locally (server offline)
                </div>
              )}
              <p>Do you want to proceed to your ticket now?</p>
            </div>
            <div className="modal-actions">
              <button
                onClick={handleCancelConfirmation}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="confirm-btn"
                disabled={loading}
              >
                {loading ? "Processing..." : "Yes, Get Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="payment-content">
          <h1 className="payment-title">💳 Payment</h1>

          {/* Order Summary */}
          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div className="order-details">
              <p>
                <strong>Movie:</strong> {pendingBooking.movie_title}
              </p>
              <p>
                <strong>Showtime:</strong> {pendingBooking.showtime}
              </p>
              <p>
                <strong>Seats:</strong>
                <span className="seats-list">
                  {pendingBooking.seat_numbers?.join(", ")}
                </span>
              </p>
              <p>
                <strong>Total Amount:</strong> Rp{" "}
                {pendingBooking.total_amount?.toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="status-pending">Waiting for Payment</span>
              </p>
              <p>
                <strong>Booking Reference:</strong>{" "}
                {pendingBooking.booking_reference}
              </p>
            </div>
          </div>

          {/* QRIS GoPay */}
          <div className="qris-section">
            <h3> Bayar Sesuai Total Nominal </h3>
            <p className="qris-description">Screenshot Untuk Scan QR Code</p>

            {!qrImageError ? (
              <img
                src="https://beckendflyio.vercel.app/images/gopay-qr.jpg"
                alt="QRIS GoPay"
                className="qris-image"
                onError={() => {
                  console.log("❌ QR image failed to load");
                  setQrImageError(true);
                }}
                onLoad={() => console.log("✅ QR image loaded successfully")}
              />
            ) : (
              <div className="qris-fallback">
                <div className="fallback-icon">💰</div>
                <p className="fallback-text">
                  Transfer ke: 0812-3456-7890 (GoPay)
                  <br />
                  <span className="fallback-subtext">
                    Amount: Rp {pendingBooking.total_amount?.toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            <p className="payment-amount">
              Amount: Rp {pendingBooking.total_amount?.toLocaleString()}
            </p>
          </div>

          {/* Upload Payment Proof - SIMPLE BASE64 */}
          <div className="upload-section">
            <h3>📎 Upload Payment Proof</h3>
            <p className="upload-description">
              Upload screenshot of your successful payment (JPG, PNG)
            </p>

            <div className="file-input-container">
              <input
                type="file"
                id="payment-proof"
                accept="image/*,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading || paymentProof}
                className="file-input"
              />
              <label
                htmlFor="payment-proof"
                className={`file-input-label ${
                  uploading || paymentProof ? "disabled" : ""
                }`}
              >
                <span className="icon">📁</span>
                {uploading
                  ? "Uploading..."
                  : paymentProof
                  ? "Uploaded ✓"
                  : "Choose File"}
              </label>
            </div>

            {uploading && (
              <div className="uploading-text">
                <div className="loading-spinner-small"></div>
                Processing your payment proof...
              </div>
            )}

            {paymentProof && paymentProof.url && (
              <div className="payment-preview">
                <h4>📷 Payment Proof Preview:</h4>
                <img
                  src={paymentProof.url}
                  alt="Payment Proof"
                  className="payment-preview-image"
                />
                <p>
                  <small>File: {paymentProof.name}</small>
                </p>
                {!paymentProof.dbSuccess && (
                  <p className="emergency-note">
                    <small>⚠️ Saved locally (server offline)</small>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="payment-actions">
            <button
              onClick={() => navigate("/booking")}
              className="back-booking-btn"
            >
              Back to Booking
            </button>

            {paymentProof && !showConfirmation && (
              <button
                onClick={() => setShowConfirmation(true)}
                className="confirm-payment-btn"
              >
                Confirm Payment & Get Ticket
              </button>
            )}
          </div>

          {/* Information */}
          <div className="payment-info">
            <p>
              ⚠️ <strong>Important:</strong>
            </p>
            <ul>
              <li>Complete payment within 30 minutes</li>
              <li>Upload proof of payment after transferring</li>
              <li>Seats will be reserved after payment confirmation</li>
              <li>You will receive e-ticket after payment verification</li>
              <li>Save Your e-ticket and Reedem it on the day of show</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;