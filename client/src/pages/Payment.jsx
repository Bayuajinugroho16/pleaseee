import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Payment.css';
// PERBAIKI IMPORT - hapus paymentAPI, tambah bookingsAPI jika perlu
import { uploadPaymentProof, confirmPayment } from '../services/bookingService';

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pendingBooking } = location.state || {};

  // Debug info
  useEffect(() => {
    console.log('🔍 Payment Debug:');
    console.log('Pending Booking:', pendingBooking);
  }, []);

  // TEST ENDPOINT YANG TERSEDIA
  useEffect(() => {
    const testEndpoints = async () => {
      console.log('🔍 Testing available endpoints...');
      
      const endpoints = [
        '/api/bookings',
        '/api/bookings/upload-payment',
        '/api/upload',
        '/api/payments/upload'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'GET'
          });
          console.log(`📍 ${endpoint}: ${response.status}`);
        } catch (error) {
          console.log(`❌ ${endpoint}: ${error.message}`);
        }
      }
    };
    
    testEndpoints();
  }, []);

  // Di Payment.jsx - handleFileUpload
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log('📁 File Selected:', file.name);
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('payment_proof', file);
      formData.append('booking_reference', pendingBooking.booking_reference);
      
      console.log('📤 Uploading file to:', 'http://localhost:5000/api/bookings/upload-payment');
      
      const response = await fetch('http://localhost:5000/api/bookings/upload-payment', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📥 Upload Response Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload Result:', result);
      
      if (result.success) {
        setPaymentProof({
          name: file.name,
          type: file.type,
          size: file.size,
          path: result.filePath,
          fileName: result.fileName
        });
        
        // Otomatis confirm payment setelah upload berhasil
        await handleConfirmPayment();
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  }
};
  // PERBAIKI handleConfirmPayment
  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;
    
    if (!paymentProof) {
      alert('Please upload payment proof first!');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await confirmPayment({
        booking_reference: pendingBooking.booking_reference,
        payment_proof: paymentProof.fileName || paymentProof.name
      });
      
      if (result.success) {
        navigate('/ticket', { state: { bookingData: result.data } });
      } else {
        alert(`Payment confirmation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Payment confirmation error:', error);
      alert('Payment error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pendingBooking) {
    return (
      <div className="payment-container">
        <Navigation />
        <div className="page-content">
          <div className="no-pending-booking">
            <h2>No pending booking found</h2>
            <p>Please complete a booking first to proceed with payment</p>
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
    <div className="payment-container">
      <Navigation />
      
      <div className="page-content">
        <div className="payment-content">
          <h1 className="payment-title">💳 Payment</h1>
          
          {/* Order Summary */}
          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div className="order-details">
              <p><strong>Movie:</strong> {pendingBooking.movie_title}</p>
              <p><strong>Showtime:</strong> {pendingBooking.showtime}</p>
              <p><strong>Seats:</strong> 
                <span className="seats-list">{pendingBooking.seat_numbers?.join(', ')}</span>
              </p>
              <p><strong>Total Amount:</strong> Rp {pendingBooking.total_amount?.toLocaleString()}</p>
              <p><strong>Status:</strong> <span className="status-pending">Waiting for Payment</span></p>
              <p><strong>Booking Reference:</strong> {pendingBooking.booking_reference}</p>
            </div>
          </div>

          {/* QRIS GoPay */}
          <div className="qris-section">
            <h3>💰 Scan QRIS GoPay</h3>
            <p className="qris-description">
              Scan QR code below using GoPay app
            </p>
            
            {!qrImageError ? (
              <img 
                src="http://localhost:5000/images/gopay-qr.jpg"
                alt="QRIS GoPay" 
                className="qris-image"
                onError={() => {
                  console.log('❌ QR image failed to load');
                  setQrImageError(true);
                }}
                onLoad={() => console.log('✅ QR image loaded successfully')}
              />
            ) : (
              <div className="qris-fallback">
                <div className="fallback-icon">❌</div>
                <p className="fallback-text">
                  QR Code Image Not Found<br/>
                  <span className="fallback-subtext">Check backend public folder</span>
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
              Upload screenshot of your successful payment
            </p>
            
            <div className="file-input-container">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="file-input"
              />
            </div>

            {uploading && (
              <p className="uploading-text">Uploading...</p>
            )}

            {paymentProof && !uploading && (
              <div className="upload-success">
                ✅ File uploaded: {paymentProof.name}
                {!paymentProof.fileName && <span> (Local only)</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="payment-actions">
            <button 
              onClick={() => navigate('/booking')}
              className="back-booking-btn"
            >
              Back to Booking
            </button>
            
            {/* PERBAIKI: panggil handleConfirmPayment, bukan confirmPayment */}
            <button 
              onClick={handleConfirmPayment}
              disabled={loading || !paymentProof}
              className="confirm-payment-btn"
            >
              {loading ? 'Confirming...' : 'Confirm Payment & Get Ticket'}
            </button>
          </div>

          {/* Information */}
          <div className="payment-info">
            <p>⚠️ <strong>Important:</strong></p>
            <ul>
              <li>Complete payment within 30 minutes</li>
              <li>Upload proof of payment after transferring</li>
              <li>Seats will be reserved after payment confirmation</li>
              <li>You will receive e-ticket after payment verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;