// src/components/QRScanner.jsx
import React, { useState, useRef } from 'react';
import './QRScanner.css';

const QRScanner = ({ onScanResult }) => {
  const [scanResult, setScanResult] = useState('');
  const [scanData, setScanData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const fileInputRef = useRef(null);

  // Function to process QR code from image
const processQRCode = async (qrData) => {
  setIsLoading(true);
  setScanResult('Memproses QR code...');
  
  try {
    console.log('🔍 Processing QR data:', qrData);

    // ✅ TEMPORARY: Mock response untuk testing
    let result;
    
    // Simulasi response berdasarkan QR data
    if (qrData.includes('TIX001')) {
      result = {
        valid: true,
        message: 'Tiket valid - Silakan masuk',
        ticket_info: {
          movie: "AVATAR: THE WAY OF WATER",
          booking_reference: "TIX001",
          showtime: "2024-01-20 17:00",
          cinema: "CGV Grand Indonesia",
          seats: ["A1"],
          customer: "Test Customer",
          customer_email: "test@example.com",
          total_paid: 50000,
          status: "CONFIRMED",
          verification_code: "ADM001",
          scanned_at: new Date().toISOString()
        }
      };
    } else {
      result = {
        valid: false,
        message: 'Tiket tidak valid atau tidak ditemukan'
      };
    }

    console.log('📨 Mock scan response:', result);
    
    // ✅ KIRIM HASIL KE PARENT COMPONENT
    if (onScanResult) {
      onScanResult(result);
    }
    
    if (result.valid) {
      setScanStatus('success');
      setScanResult('✅ TIKET VALID - Silakan masuk');
      setScanData({
        valid: true,
        movie: result.ticket_info.movie,
        booking_reference: result.ticket_info.booking_reference,
        showtime: result.ticket_info.showtime,
        cinema: result.ticket_info.cinema,
        seats: result.ticket_info.seats,
        customer_name: result.ticket_info.customer,
        customer_email: result.ticket_info.customer_email,
        total_paid: result.ticket_info.total_paid,
        status: result.ticket_info.status,
        verification_code: result.ticket_info.verification_code,
        scanned_at: result.ticket_info.scanned_at,
        message: result.message
      });
    } else {
      setScanStatus('error');
      setScanResult(`❌ ${result.message}`);
      setScanData({
        valid: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('💥 Scan error:', error);
    
    const errorResult = {
      valid: false,
      message: 'Gagal memproses QR code'
    };
    
    if (onScanResult) {
      onScanResult(errorResult);
    }
    
    setScanStatus('error');
    setScanResult('❌ Error processing QR code');
  } finally {
    setIsLoading(false);
  }
};  // Handle file upload for QR code image
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      // Simulasikan data QR code dengan format baru
      const mockDecodedData = JSON.stringify({
        type: 'E-TICKET',
        movie_title: "AVATAR: THE WAY OF WATER",
        booking_reference: "TIX868176",
        verification_code: "X2CCYR1S",
        showtime_date: "2024-01-20",
        showtime_time: "17:00",
        cinema_name: "CGV Grand Indonesia",
        seats: ["C6"],
        customer_name: "jul",
        customer_email: "aji123@gmail.com",
        total_payment: 50000,
        status: "CONFIRMED"
      });

      await processQRCode(mockDecodedData);
    };
    reader.readAsDataURL(file);
  };

  // Manual test dengan data sesuai e-ticket Anda
  const runManualTest = (scenario) => {
    setIsLoading(true);
    setScanResult('Testing...');

    setTimeout(() => {
      setIsLoading(false);
      
      let result;
      
      switch (scenario) {
        case 'valid':
          result = {
            valid: true,
            message: 'Tiket valid - Silakan masuk',
            ticket_info: {
              movie: "AVATAR: THE WAY OF WATER",
              booking_reference: "TIX868176",
              showtime: "2024-01-20 17:00",
              cinema: "CGV Grand Indonesia",
              seats: ["C6"],
              customer: "jul",
              customer_email: "aji123@gmail.com",
              total_paid: 50000,
              status: "CONFIRMED",
              verification_code: "X2CCYR1S"
            }
          };
          break;
          
        case 'invalid':
          result = {
            valid: false,
            message: 'Tiket tidak valid atau tidak ditemukan'
          };
          break;
          
        case 'used':
          result = {
            valid: false,
            message: 'Tiket sudah digunakan sebelumnya',
            scanned_at: new Date().toISOString()
          };
          break;
          
        default:
          result = {
            valid: false,
            message: 'Kode QR tidak valid'
          };
      }
      
      // ✅ KIRIM HASIL TEST KE PARENT
      if (onScanResult) {
        onScanResult(result);
      }
      
      // Update local state
      if (result.valid) {
        setScanStatus('success');
        setScanResult('✅ TIKET VALID - Silakan masuk');
        setScanData({
          valid: true,
          movie: result.ticket_info.movie,
          booking_reference: result.ticket_info.booking_reference,
          showtime: result.ticket_info.showtime,
          cinema: result.ticket_info.cinema,
          seats: result.ticket_info.seats,
          customer_name: result.ticket_info.customer,
          customer_email: result.ticket_info.customer_email,
          total_paid: result.ticket_info.total_paid,
          status: result.ticket_info.status,
          verification_code: result.ticket_info.verification_code,
          message: result.message
        });
      } else {
        setScanStatus('error');
        setScanResult(`❌ ${result.message}`);
        setScanData({
          valid: false,
          message: result.message,
          scanned_at: result.scanned_at
        });
      }
    }, 1000);
  };

  // Reset scanner
  const resetScanner = () => {
    setScanResult('');
    setScanData(null);
    setScanStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="qr-scanner">
      <div className="scanner-header">
        <h2>🎫 Scanner Tiket Bioskop</h2>
        <p>Scan QR code dari e-ticket customer</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-icon">📷</div>
          <h4>Upload QR Code</h4>
          <p>Pilih gambar QR code dari e-ticket</p>
          <label className="upload-btn">
            Pilih File Gambar
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </label>
          <div className="supported-formats">
            <small>Format yang didukung: JPG, PNG, GIF</small>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memindai QR code...</p>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && !isLoading && (
        <div className={`scan-result ${scanStatus}`}>
          <div className="result-header">
            <h4>Hasil Scan</h4>
            <button className="reset-btn" onClick={resetScanner}>
              🔄 Scan Lagi
            </button>
          </div>
          
          <div className="result-message">
            {scanResult}
          </div>

          {scanData && (
            <div className="scan-details">
              {scanData.valid ? (
                <>
                  <div className="ticket-card valid">
                    <div className="ticket-header">
                      <h5>🎬 E-TICKET VALID</h5>
                      <span className="verification-code">
                        #{scanData.verification_code}
                      </span>
                    </div>
                    
                    <div className="ticket-info-grid">
                      <div className="info-item">
                        <label>Film:</label>
                        <span>{scanData.movie}</span>
                      </div>
                      <div className="info-item">
                        <label>Booking Reference:</label>
                        <span>{scanData.booking_reference}</span>
                      </div>
                      <div className="info-item">
                        <label>Showtime:</label>
                        <span>{scanData.showtime}</span>
                      </div>
                      <div className="info-item">
                        <label>Kursi:</label>
                        <span className="seats-badge">
                          {scanData.seats.join(', ')}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Total Paid:</label>
                        <span>Rp {scanData.total_paid?.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="info-item">
                        <label>Customer:</label>
                        <span>{scanData.customer_name}</span>
                      </div>
                      <div className="info-item">
                        <label>Email:</label>
                        <span>{scanData.customer_email}</span>
                      </div>
                      <div className="info-item">
                        <label>Status:</label>
                        <span className="status-badge">{scanData.status}</span>
                      </div>
                      <div className="info-item">
                        <label>Verification Code:</label>
                        <span>{scanData.verification_code}</span>
                      </div>
                    </div>
                    
                    <div className="ticket-footer">
                      <div className="scan-time">
                        Scanned at: {new Date().toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="ticket-card invalid">
                  <h5>❌ TIKET TIDAK VALID</h5>
                  <p>{scanData.message}</p>
                  {scanData.scanned_at && (
                    <div className="warning-info">
                      <strong>Sudah digunakan pada:</strong><br />
                      {new Date(scanData.scanned_at).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Test Section */}
      <div className="manual-test-section">
        <h4>🧪 Test Scanner</h4>
        <p>Uji scanner dengan berbagai skenario:</p>
        
        <div className="test-buttons">
          <button 
            className="test-btn success"
            onClick={() => runManualTest('valid')}
            disabled={isLoading}
          >
            ✅ Test Tiket Valid
          </button>
          
          <button 
            className="test-btn error"
            onClick={() => runManualTest('invalid')}
            disabled={isLoading}
          >
            ❌ Test Tiket Invalid
          </button>
          
          <button 
            className="test-btn warning"
            onClick={() => runManualTest('used')}
            disabled={isLoading}
          >
            ⚠️ Test Tiket Sudah Digunakan
          </button>
        </div>
      </div>

      {/* Camera Scanner (Advanced) */}
      <div className="camera-section">
        <h4>📱 Real-time Camera Scanner</h4>
        <p className="coming-soon">
          🔄 Fitur camera scanner sedang dalam pengembangan...
        </p>
      </div>
    </div>
  );
};

export default QRScanner;