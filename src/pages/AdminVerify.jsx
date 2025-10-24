import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import './AdminVerify.css';

const AdminVerify = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [manualInput, setManualInput] = useState({
    booking_reference: '',
    verification_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState({
    totalScanned: 0,
    validTickets: 0,
    invalidTickets: 0,
    todayScans: 0,
    todayValid: 0
  });
  const [scanHistory, setScanHistory] = useState([]);

  // Load data dari localStorage saat component mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = () => {
    try {
      const savedHistory = localStorage.getItem('adminScanHistory');
      const savedStats = localStorage.getItem('adminScanStats');
      
      console.log('📥 Loading persisted data...');
      console.log('Saved History:', savedHistory);
      console.log('Saved Stats:', savedStats);
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setScanHistory(history);
        
        // Hitung statistik dari history
        calculateStatsFromHistory(history);
      }
      
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
      }
    } catch (error) {
      console.error('❌ Error loading persisted data:', error);
    }
  };

  const calculateStatsFromHistory = (history) => {
    const today = new Date().toDateString();
    const todayScans = history.filter(scan => 
      new Date(scan.timestamp).toDateString() === today
    );
    const todayValid = todayScans.filter(scan => scan.valid).length;
    
    const totalScanned = history.length;
    const validTickets = history.filter(scan => scan.valid).length;
    const invalidTickets = history.filter(scan => !scan.valid).length;

    setStats({
      totalScanned,
      validTickets,
      invalidTickets,
      todayScans: todayScans.length,
      todayValid
    });
  };

  // Save ke localStorage ketika ada perubahan
  useEffect(() => {
    if (scanHistory.length > 0 || stats.totalScanned > 0) {
      console.log('💾 Saving data to localStorage...');
      console.log('History:', scanHistory.length, 'items');
      console.log('Stats:', stats);
      
      localStorage.setItem('adminScanHistory', JSON.stringify(scanHistory));
      localStorage.setItem('adminScanStats', JSON.stringify(stats));
    }
  }, [scanHistory, stats]);

  const goToScanner = () => {
    navigate('/admin/scanner');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManualInput(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  };

  // Broadcast ticket validation ke semua client
  const broadcastTicketValidation = (result) => {
    const validationEvent = {
      type: 'TICKET_VALIDATED',
      data: result,
      timestamp: new Date().toISOString(),
      admin: user?.username || 'Admin'
    };
    
    localStorage.setItem('lastTicketValidation', JSON.stringify(validationEvent));
    
    // Trigger storage event untuk real-time update
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 100);
    
    console.log('📢 Broadcast ticket validation:', result);
  };

  const verifyTicket = async () => {
    if (!manualInput.booking_reference || !manualInput.verification_code) {
      alert('Please enter both Booking Reference and Verification Code');
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      // Prepare QR data format
      const qrData = {
        type: 'CINEMA_TICKET',
        booking_reference: manualInput.booking_reference,
        verification_code: manualInput.verification_code,
        timestamp: new Date().toISOString()
      };

      console.log('🔍 Verifying ticket:', qrData);

      const response = await fetch('https://beckendflyio.vercel.app/api/bookings/scan-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_data: JSON.stringify(qrData)
        })
      });

      const result = await response.json();
      console.log('📦 Verification result:', result);

      setScanResult(result);

      // Update stats dan history
      const newScanRecord = {
        ...result,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        staff: user?.username || 'Admin',
        method: 'manual',
        booking_reference: manualInput.booking_reference,
        verification_code: manualInput.verification_code
      };

      const isToday = new Date().toDateString() === new Date(newScanRecord.timestamp).toDateString();
      
      // Update history
      const updatedHistory = [newScanRecord, ...scanHistory];
      setScanHistory(updatedHistory);
      
      // Update stats
      setStats(prev => ({
        totalScanned: prev.totalScanned + 1,
        validTickets: prev.validTickets + (result.valid ? 1 : 0),
        invalidTickets: prev.invalidTickets + (!result.valid ? 1 : 0),
        todayScans: isToday ? prev.todayScans + 1 : prev.todayScans,
        todayValid: isToday && result.valid ? prev.todayValid + 1 : prev.todayValid
      }));

      // Broadcast ke client jika tiket valid
      if (result.valid) {
        broadcastTicketValidation(result);
      }

      // Reset form jika valid
      if (result.valid) {
        setManualInput({
          booking_reference: '',
          verification_code: ''
        });
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      setScanResult({
        valid: false,
        message: 'Error connecting to server: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setScanResult(null);
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setScanHistory([]);
      setStats({
        totalScanned: 0,
        validTickets: 0,
        invalidTickets: 0,
        todayScans: 0,
        todayValid: 0
      });
      setScanResult(null);
      localStorage.removeItem('adminScanHistory');
      localStorage.removeItem('adminScanStats');
      console.log('🗑️ All data cleared');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyTicket();
    }
  };

  // Hitung success rates
  const overallSuccessRate = stats.totalScanned > 0 
    ? Math.round((stats.validTickets / stats.totalScanned) * 100) 
    : 0;

  const todaySuccessRate = stats.todayScans > 0
    ? Math.round((stats.todayValid / stats.todayScans) * 100)
    : 0;

  return (
    <div className="admin-verify-container">
      <Navigation />
      
      <div className="admin-content">
        <div className="admin-welcome">
          <h2>Selamat Datang, {user?.username}! 👋</h2>
          <p>Panel administrasi untuk verifikasi tiket dan manajemen bioskop</p>
          <button 
            onClick={loadPersistedData}
            className="refresh-data-btn"
            title="Reload data from storage"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Quick Actions */}
        <div className="admin-actions-grid">
          <div className="action-card" onClick={goToScanner}>
            <div className="action-icon">📷</div>
            <h3>QR Scanner</h3>
            <p>Scan tiket dengan kamera</p>
          </div>

          <div className="action-card" onClick={() => navigate('/staff')}>
            <div className="action-icon">📊</div>
            <h3>Dashboard</h3>
            <p>Lihat statistik dan laporan</p>
          </div>

          <div className="action-card" onClick={() => navigate('/home')}>
            <div className="action-icon">🎬</div>
            <h3>Lihat Bioskop</h3>
            <p>Buka halaman user</p>
          </div>

          <div className="action-card" onClick={clearAllData}>
            <div className="action-icon">🔄</div>
            <h3>Reset Data</h3>
            <p>Hapus semua data</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.totalScanned}</h3>
              <p>Total Scan</p>
            </div>
          </div>
          <div className="stat-card valid">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.validTickets}</h3>
              <p>Tiket Valid</p>
            </div>
          </div>
          <div className="stat-card invalid">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <h3>{stats.invalidTickets}</h3>
              <p>Tiket Invalid</p>
            </div>
          </div>
          <div className="stat-card rate">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>{overallSuccessRate}%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="today-stats-section">
          <h3>📅 Statistik Hari Ini</h3>
          <div className="today-stats-grid">
            <div className="today-stat">
              <span className="today-value">{stats.todayScans}</span>
              <span className="today-label">Scan Hari Ini</span>
            </div>
            <div className="today-stat">
              <span className="today-value">{stats.todayValid}</span>
              <span className="today-label">Valid Hari Ini</span>
            </div>
            <div className="today-stat">
              <span className="today-value">{todaySuccessRate}%</span>
              <span className="today-label">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Manual Verification Section */}
        <div className="manual-verify-section">
          <h3>🔍 Verifikasi Manual Tiket</h3>
          <p className="verify-description">
            Masukkan Booking Reference dan Verification Code untuk verifikasi tiket
          </p>
          
          <div className="verify-form">
            <div className="input-group">
              <label>Booking Reference</label>
              <input 
                type="text" 
                name="booking_reference"
                placeholder="TIX123456"
                value={manualInput.booking_reference}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="verify-input"
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <label>Verification Code</label>
              <input 
                type="text" 
                name="verification_code"
                placeholder="ABC123XY"
                value={manualInput.verification_code}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="verify-input"
                disabled={loading}
              />
            </div>
            
            <button 
              onClick={verifyTicket}
              disabled={loading || !manualInput.booking_reference || !manualInput.verification_code}
              className="verify-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Verifying...
                </>
              ) : (
                '✅ Verify Ticket'
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="examples-section">
            <h4>📋 Contoh Format:</h4>
            <div className="examples-grid">
              <div className="example-item">
                <strong>Booking Reference:</strong>
                <code>TIX868176</code>
              </div>
              <div className="example-item">
                <strong>Verification Code:</strong>
                <code>X2CCYR1S</code>
              </div>
            </div>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`scan-result ${scanResult.valid ? 'valid' : 'invalid'}`}>
            <div className="result-header">
              <div className="result-icon">
                {scanResult.valid ? '✅' : '❌'}
              </div>
              <div className="result-title">
                <h3>{scanResult.valid ? 'Tiket Valid' : 'Tiket Tidak Valid'}</h3>
                <p>{scanResult.message}</p>
                <small>
                  {new Date().toLocaleString('id-ID')} • 
                  Method: Manual • 
                  Admin: {user?.username}
                </small>
              </div>
              <button onClick={clearResult} className="close-result">
                ✕
              </button>
            </div>

            {scanResult.valid && scanResult.ticket_info && (
              <div className="ticket-details">
                <h4>🎫 Detail Tiket:</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Film:</strong>
                    <span>{scanResult.ticket_info.movie}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Booking Reference:</strong>
                    <span className="reference">{scanResult.ticket_info.booking_reference}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Verification Code:</strong>
                    <span className="code">{scanResult.ticket_info.verification_code}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Kursi:</strong>
                    <span className="seats">{scanResult.ticket_info.seats?.join(', ')}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Customer:</strong>
                    <span>{scanResult.ticket_info.customer}</span>
                  </div>
                  {scanResult.ticket_info.showtime && (
                    <div className="detail-item">
                      <strong>Showtime:</strong>
                      <span>{scanResult.ticket_info.showtime}</span>
                    </div>
                  )}
                </div>
                <div className="broadcast-info">
                  <small>✅ Notifikasi telah dikirim ke client</small>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {scanHistory.length > 0 && (
          <div className="recent-activity">
            <h3>📋 Aktivitas Terbaru ({scanHistory.length} total)</h3>
            <div className="activity-list">
              {scanHistory.slice(0, 5).map(scan => (
                <div key={scan.id} className={`activity-item ${scan.valid ? 'valid' : 'invalid'}`}>
                  <div className="activity-icon">
                    {scan.valid ? '✅' : '❌'}
                  </div>
                  <div className="activity-info">
                    <div className="activity-main">
                      <strong>{scan.ticket_info?.booking_reference || scan.booking_reference}</strong>
                      <span className={`status ${scan.valid ? 'valid' : 'invalid'}`}>
                        {scan.valid ? 'VALID' : 'INVALID'}
                      </span>
                    </div>
                    <div className="activity-details">
                      {scan.ticket_info?.movie || 'N/A'} • 
                      {scan.ticket_info?.seats?.join(', ') || 'N/A'} • 
                      {new Date(scan.timestamp).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {scanHistory.length > 5 && (
              <div className="activity-footer">
                <small>Menampilkan 5 dari {scanHistory.length} aktivitas</small>
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="debug-info">
          <details>
            <summary>🐛 Debug Information</summary>
            <div className="debug-content">
              <p><strong>LocalStorage Keys:</strong></p>
              <ul>
                {Object.keys(localStorage).map(key => (
                  <li key={key}>{key}: {localStorage.getItem(key)?.length} chars</li>
                ))}
              </ul>
              <p><strong>Current Stats:</strong> {JSON.stringify(stats)}</p>
              <p><strong>History Count:</strong> {scanHistory.length}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AdminVerify;