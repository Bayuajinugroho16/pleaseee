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
    console.log("📁 Original File:", file.name, "Size:", (file.size / 1024).toFixed(2), "KB");
    setUploading(true);

    try {
      // ✅ COMPRESS IMAGE AGGRESSIVELY - MAX 80KB (SAFE MARGIN)
      console.log("🔧 Aggressive compression to under 80KB...");
      const compressedFile = await compressImageAggressive(file);
      
      console.log("📊 After compression:", (compressedFile.size / 1024).toFixed(2), "KB");

      // ✅ CONVERT TO BASE64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = error => reject(error);
      });

      console.log("📊 Base64 length:", base64Image.length, "characters");

      // ✅ GUNAKAN ENDPOINT BARU
      const response = await fetch(
        "https://beckendflyio.vercel.app/api/update-payment-base64",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_reference: pendingBooking.booking_reference,
            payment_filename: compressedFile.name,
            payment_base64: base64Image,
            payment_mimetype: compressedFile.type
          }),
        }
      );

      console.log("📥 Upload Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server response:", errorText);
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Upload Result:", result);

      if (result.success) {
        setPaymentProof({
          name: compressedFile.name,
          type: compressedFile.type,
          size: compressedFile.size,
          fileName: result.fileName,
          base64: base64Image
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

// ✅ AGGRESSIVE COMPRESSION FUNCTION
const compressImageAggressive = (file) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      // Start with small dimensions
      let width = Math.min(img.width, 600);
      let height = Math.min(img.height, 600);
      let quality = 0.6; // Start with lower quality
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image with new dimensions
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try multiple compression levels
      const tryCompression = (currentQuality) => {
        canvas.toBlob(
          (blob) => {
            const sizeKB = blob.size / 1024;
            console.log(`🔄 Compression attempt: ${sizeKB.toFixed(2)}KB, Quality: ${currentQuality}`);
            
            if (sizeKB > 80 && currentQuality > 0.3) {
              // Reduce quality further
              tryCompression(currentQuality - 0.1);
            } else if (sizeKB > 80 && width > 300) {
              // Reduce dimensions if quality is already low
              width = Math.round(width * 0.8);
              height = Math.round(height * 0.8);
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              tryCompression(0.5);
            } else {
              const compressedFile = new File([blob], `payment-${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`✅ Final: ${sizeKB.toFixed(2)}KB, ${width}x${height}, Quality: ${currentQuality}`);
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          currentQuality
        );
      };
      
      tryCompression(quality);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// ✅ COMPRESS IMAGE FUNCTION
const compressImage = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set max dimensions
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image with new dimensions
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with quality 0.8 (80%)
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
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
      const response = await fetch(
        "https://beckendflyio.vercel.app/api/bookings/confirm-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_reference: pendingBooking.booking_reference,
            payment_proof: paymentProof.fileName || paymentProof.name,
          }),
        }
      );

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
            <p className="qris-description">Screenshoot Untuk Scan QR Code</p>

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

            {paymentProof && paymentProof.base64 && (
              <div className="payment-preview">
                <h4>📷 Payment Proof Preview:</h4>
                <img
                  src={`data:${paymentProof.type};base64,${paymentProof.base64}`}
                  alt="Payment Proof Preview"
                  className="payment-preview-image"
                />
                <p>
                  <small>File: {paymentProof.name}</small>
                </p>
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
