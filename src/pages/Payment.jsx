import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Payment.css";
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

  // Initialize pendingBooking from location state
  useEffect(() => {
    if (location.state?.pendingBooking) {
      setPendingBooking(location.state.pendingBooking);
    }
  }, [location.state]);

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log("📁 File Selected:", file.name);
    setUploading(true);

    try {
      // ✅ VALIDASI FILE
      if (file.size > 5 * 1024 * 1024) {
        alert("File terlalu besar! Maksimal 5MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Hanya file gambar yang diizinkan!");
        return;
      }

      // Generate codes
      const bookingReference = `BK${Date.now().toString().slice(-6)}`;
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // ✅ 1. DEBUG DETAIL
      console.log("🔍 DETAIL pendingBooking:", {
        showtime_id: pendingBooking.showtime_id,
        username: pendingBooking.username,
        email: pendingBooking.email,
        seat_numbers: pendingBooking.seat_numbers,
        total_amount: pendingBooking.total_amount,
        movie_title: pendingBooking.movie_title,
        phone: pendingBooking.phone
      });

      // ✅ 2. VALIDASI YANG LEBIH SIMPLE
      if (!pendingBooking.showtime_id || !pendingBooking.username || !pendingBooking.email || 
          !pendingBooking.seat_numbers || !pendingBooking.total_amount || !pendingBooking.movie_title) {
        throw new Error("Data booking tidak lengkap. Pastikan semua field terisi.");
      }

      // ✅ 3. FORMAT DATA - PERBAIKI seat_numbers
      const bookingData = {
        showtime_id: pendingBooking.showtime_id,
        customer_name: pendingBooking.username,
        customer_email: pendingBooking.email,
        customer_phone: pendingBooking.phone || "",
        seat_numbers: pendingBooking.seat_numbers, // ✅ LANGSUNG PAKAI ARRAY, biar backend yang handle JSON
        total_amount: parseFloat(pendingBooking.total_amount),
        movie_title: pendingBooking.movie_title,
        booking_reference: bookingReference,
        verification_code: verificationCode,
        status: "pending"
      };

      console.log("📤 Data final untuk backend:", bookingData);

      // ✅ 4. KIRIM KE BACKEND
      const bookingResponse = await fetch(
        "https://beckendflyio.vercel.app/api/bookings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        }
      );

      const bookingResult = await bookingResponse.json();

      console.log("📥 Response dari backend:", {
        status: bookingResponse.status,
        ok: bookingResponse.ok,
        result: bookingResult
      });

      if (!bookingResponse.ok) {
        throw new Error(bookingResult.message || `Error: ${bookingResponse.status}`);
      }

      console.log("✅ Booking berhasil disimpan!");

      // ✅ 5. UPLOAD FILE
      console.log("📤 Uploading payment proof...");

      const formData = new FormData();
      formData.append("payment_proof", file);
      formData.append("booking_reference", bookingReference);

      const uploadResponse = await fetch(
        "https://beckendflyio.vercel.app/api/upload-payment",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResult = await uploadResponse.json();

      console.log("📥 Upload response:", uploadResult);

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.message || `Upload gagal`);
      }

      console.log("✅✅✅ FILE UPLOADED SUCCESS!");

      // ✅ 6. GENERATE URL GAMBAR
      const fileName = uploadResult.data?.fileName || uploadResult.fileName;
      const imageUrl = fileName
        ? `https://beckendflyio.vercel.app/bukti_pembayaran/${fileName}`
        : null;

      console.log("🖼️ Payment proof URL:", imageUrl);

      // Convert file untuk preview lokal
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      // ✅ 7. UPDATE STATE
      setPendingBooking((prev) => ({
        ...prev,
        booking_reference: bookingReference,
        verification_code: verificationCode,
        status: "pending_verification",
        payment_proof: imageUrl,
        payment_filename: file.name,
      }));

      setPaymentProof({
        name: file.name,
        base64: base64Image,
        fileUrl: imageUrl,
      });

      setShowConfirmation(true);

      console.log("🎉 PROSES SELESAI!");

    } catch (error) {
      console.error("❌ ERROR DETAIL:", {
        message: error.message,
        name: error.name
      });
      alert("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  }
};
 // Di Payment.jsx - PERBAIKI handleConfirmPayment
const handleConfirmPayment = async () => {
  if (!pendingBooking) return;

  if (!paymentProof) {
    alert("Please upload payment proof first!");
    return;
  }

  setLoading(true);

  try {
    // ✅ HAPUS DUPLICATE BOOKING CREATION
    // Booking sudah dibuat di handleFileUpload, jadi tidak perlu buat lagi
    
    console.log("🎫 Proceeding to ticket with booking:", {
      booking_reference: pendingBooking.booking_reference,
      status: pendingBooking.status
    });

    // ✅ LANGSUNG NAVIGATE KE TICKET
    const ticketData = {
      ...pendingBooking,
      id: pendingBooking.id,
      is_verified: 0,
      booking_date: new Date().toISOString(),
      status: "pending_verification"
    };

    setShowConfirmation(false);
    navigate("/ticket", { state: { bookingData: ticketData } });
    
  } catch (error) {
    console.error("❌ Confirmation error:", error);
    alert("Error navigating to ticket: " + error.message);
    setShowConfirmation(false);
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
              <p>
                <strong>
                  Booking details will be available on your ticket page.
                </strong>
              </p>
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
                {loading ? "Processing..." : "Yes, View Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="payment-content">
          <h1 className="payment-title">💳 Payment</h1>

          {/* Order Summary - TANPA booking reference & verification code */}
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
              {/* ❌ HAPUS booking reference dan verification code dari sini */}
            </div>
          </div>

          {/* QRIS GoPay */}
          <div className="qris-section">
            <h3> Bayar Sesuai Total Nominal </h3>
            <p className="qris-description">Screenshoot Untuk Scan QR Code</p>

            {!qrImageError ? (
              <img
                src={gopayQR}
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
                <div className="fallback-icon">💳</div>
                <p className="fallback-text">
                  Transfer ke: 08123456789 (GoPay)
                  <br />
                  <span className="fallback-subtext">
                    Total: Rp {pendingBooking.total_amount?.toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            <p className="payment-amount">
              Amount: Rp {pendingBooking.total_amount?.toLocaleString()}
            </p>
          </div>

          {/* Upload Payment Proof */}
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
                Uploading your payment proof...
              </div>
            )}

            {paymentProof && (
              <div className="payment-preview">
                <h4>📷 Payment Proof Preview:</h4>

                {/* ✅ COBA TAMPILKAN DARI URL GAMBAR ASLI DULU */}
                {paymentProof.fileUrl ? (
                  <img
                    src={paymentProof.fileUrl}
                    alt="Payment Proof Preview"
                    className="payment-preview-image"
                    onError={(e) => {
                      console.error("❌ URL image failed, fallback to base64");
                      // Fallback ke base64 jika URL gagal
                      e.target.src = paymentProof.base64;
                    }}
                    onLoad={() =>
                      console.log("✅ URL image loaded successfully")
                    }
                  />
                ) : (
                  /* ✅ FALLBACK KE BASE64 PREVIEW */
                  <img
                    src={paymentProof.base64}
                    alt="Payment Proof Preview"
                    className="payment-preview-image"
                  />
                )}

                <p>
                  <small>
                    File: {paymentProof.name}
                    {paymentProof.fileUrl && (
                      <span style={{ marginLeft: "10px" }}>
                        |{" "}
                        <a
                          href={paymentProof.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#007bff", textDecoration: "none" }}
                        >
                          🔗 Open Full Size
                        </a>
                      </span>
                    )}
                  </small>
                </p>

                {/* ✅ DEBUG INFO */}
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  {paymentProof.fileUrl && (
                    <div>URL: {paymentProof.fileUrl}</div>
                  )}
                  <div>
                    Base64:{" "}
                    {paymentProof.base64 ? "Available" : "Not available"}
                  </div>
                </div>
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

            {/* Tombol manual confirm */}
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
              <li>
                <strong>
                  Booking reference and verification code will be available on
                  your ticket page
                </strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
