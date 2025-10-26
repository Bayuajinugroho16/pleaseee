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
    if (file) {
      console.log("=== 🚀 UPLOAD PROCESS START ===");
      console.log("📁 File Selected:", file);
      console.log("🎫 Booking Reference:", pendingBooking.booking_reference);

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("payment_proof", file);
        formData.append("booking_reference", pendingBooking.booking_reference);

        // Log FormData contents
        for (let [key, value] of formData.entries()) {
          console.log(`📦 FormData: ${key} =`, value);
        }

        console.log(
          "📤 Uploading to:",
          "https://beckendflyio.vercel.app/api/bookings/upload-payment"
        );

        const response = await fetch(
          "https://beckendflyio.vercel.app/api/bookings/upload-payment",
          {
            method: "POST",
            body: formData,
          }
        );

        console.log("📥 Response Status:", response.status);
        console.log("📥 Response OK:", response.ok);

        const responseText = await response.text();
        console.log("📥 Raw Response:", responseText);

        let result;
        try {
          result = JSON.parse(responseText);
          console.log("✅ Parsed Result:", result);
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status} - ${result.message}`);
        }

        if (result.success) {
          console.log("🎉 UPLOAD SUCCESS!");
          setPaymentProof({
            name: file.name,
            type: file.type,
            size: file.size,
            fileName: result.fileName,
            filePath: result.filePath || null, // Optional
          });
          
          setShowConfirmation(true);
        } else {
          alert("Upload failed: " + result.message);
        }
      } catch (error) {
        console.error("❌ Upload error:", error);
        alert("Upload error: " + error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle Confirm Payment
  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;

    if (!paymentProof) {
      alert("Please upload payment proof first!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://beckendflyio.vercel.app/api/bookings/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_reference: pendingBooking.booking_reference,
          payment_proof: paymentProof.fileName || paymentProof.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // ✅ TUTUP MODAL KONFIRMASI DAN NAVIGATE
        setShowConfirmation(false);
        navigate("/ticket", { state: { bookingData: result.data } });
      } else {
        alert(`Payment confirmation failed: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Payment confirmation error:", error);
      alert("Payment error: " + error.message);
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
              <p>Do you want to confirm payment and get your ticket now?</p>
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
              <p><strong>Movie:</strong> {pendingBooking.movie_title}</p>
              <p><strong>Showtime:</strong> {pendingBooking.showtime}</p>
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
            <p className="qris-description">
              Screenshoot Untuk Scan QR Code
            </p>

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
                <div className="fallback-icon">❌</div>
                <p className="fallback-text">
                  QR Code Image Not Found
                  <br />
                  <span className="fallback-subtext">
                    Check backend public folder
                  </span>
                </p>
              </div>
            )}

            <p className="payment-amount">
              Amount: Rp {pendingBooking.total_amount?.toLocaleString()}
            </p>
          </div>

          {/* Upload Payment Proof - HANYA SATU KALI */}
          <div className="upload-section">
            <h3>📎 Upload Payment Proof</h3>
            <p className="upload-description">
              Upload screenshot of your successful payment (JPG, PNG, PDF)
            </p>

            <div className="file-input-container">
              <input
                type="file"
                id="payment-proof"
                accept="image/*,.pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading || paymentProof}
                className="file-input"
              />
              <label
                htmlFor="payment-proof"
                className={`file-input-label ${uploading || paymentProof ? "disabled" : ""}`}
              >
                <span className="icon">📁</span>
                {uploading ? "Uploading..." : paymentProof ? "Uploaded ✓" : "Choose File"}
              </label>
            </div>

            {uploading && (
              <div className="uploading-text">
                <div className="loading-spinner-small"></div>
                Uploading your payment proof...
              </div>
            )}

            {paymentProof && !uploading && !showConfirmation && (
              <div className="upload-success">
                ✅ File uploaded: {paymentProof.name}
                <button 
                  onClick={() => setShowConfirmation(true)}
                  className="proceed-btn"
                >
                  Proceed to Confirm
                </button>
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

            {/* Tombol manual confirm jika user ingin confirm manual */}
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