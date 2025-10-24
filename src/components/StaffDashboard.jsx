import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Fixed path
import QRScanner from './QRScanner';
import Navigation from './Navigation'; // ✅ Fixed path - remove "components/"
import './StaffDashboard.css';

const StaffDashboard = () => {
  const [currentView, setCurrentView] = useState('scanner');
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState({
    totalScanned: 0,
    validTickets: 0,
    invalidTickets: 0,
    todayScans: 0,
    todayValid: 0
  });

  const { user } = useAuth(); // ✅ Added useAuth
  const navigate = useNavigate();

  // Load data dari localStorage saat component mount
  useEffect(() => {
  const savedHistory = localStorage.getItem('scanHistory');
  const savedStats = localStorage.getItem('scanStats');
  
  if (savedHistory) {
    const history = JSON.parse(savedHistory);
    // Calculate today's stats from history
    const today = new Date().toDateString();
    const todayScans = history.filter(scan => 
      new Date(scan.timestamp).toDateString() === today
    );
    const todayValid = todayScans.filter(scan => scan.valid).length;
    
    setScanHistory(history);
    setStats(prev => ({
      ...prev,
      todayScans: todayScans.length,
      todayValid: todayValid
    }));
  }
  
  if (savedStats) {
    setStats(JSON.parse(savedStats));
  }
}, []);
  // Save ke localStorage ketika ada perubahan
  useEffect(() => {
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    localStorage.setItem('scanStats', JSON.stringify(stats));
  }, [scanHistory, stats]);

  // Handle hasil scan dari QRScanner
  const handleScanResult = (result) => {
    const scanRecord = {
      ...result,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      staff: user?.username || 'Petugas'
    };

    // Tambahkan ke history (max 100 records)
    setScanHistory(prev => [scanRecord, ...prev.slice(0, 99)]);

    // Update stats
    const isToday = new Date().toDateString() === new Date(scanRecord.timestamp).toDateString();
    
    setStats(prev => ({
      totalScanned: prev.totalScanned + 1,
      validTickets: prev.validTickets + (result.valid ? 1 : 0),
      invalidTickets: prev.invalidTickets + (!result.valid ? 1 : 0),
      todayScans: isToday ? prev.todayScans + 1 : prev.todayScans,
      todayValid: isToday && result.valid ? prev.todayValid + 1 : prev.todayValid
    }));

    // Auto-show history setelah scan
    setCurrentView('history');

    // Kirim notifikasi ke semua client (WebSocket simulation)
    if (result.valid) {
      broadcastTicketValidation(result);
    }
  };

  // Broadcast ticket validation ke semua client
  const broadcastTicketValidation = (result) => {
    // Simpan di localStorage untuk diakses oleh client
    const validationEvent = {
      type: 'TICKET_VALIDATED',
      data: result,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('lastTicketValidation', JSON.stringify(validationEvent));
    
    // Trigger storage event untuk real-time update
    window.dispatchEvent(new Event('storage'));
    
    console.log('📢 Broadcast ticket validation:', result);
  };

  // Clear history
  const clearHistory = () => {
    setScanHistory([]);
    setStats({
      totalScanned: 0,
      validTickets: 0,
      invalidTickets: 0,
      todayScans: 0,
      todayValid: 0
    });
  };

  // Export history sebagai CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Status', 'Movie', 'Booking Reference', 'Customer', 'Seats', 'Message'];
    const csvData = scanHistory.map(scan => [
      new Date(scan.timestamp).toLocaleString('id-ID'),
      scan.valid ? 'VALID' : 'INVALID',
      scan.ticket_info?.movie || '-',
      scan.ticket_info?.booking_reference || '-',
      scan.ticket_info?.customer || '-',
      scan.ticket_info?.seats?.join(', ') || '-',
      scan.message || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Hitung success rate
  const successRate = stats.totalScanned > 0 
    ? Math.round((stats.validTickets / stats.totalScanned) * 100) 
    : 0;

  const todaySuccessRate = stats.todayScans > 0
    ? Math.round((stats.todayValid / stats.todayScans) * 100)
    : 0;

  return (
    <div className="staff-dashboard-container">
      <Navigation />
      
      <div className="staff-dashboard">
        {/* Header */}
        <div className="staff-header">
          <div className="header-info">
            <h1>🎬 Cinema Staff Dashboard</h1>
            <p>Panel verifikasi tiket untuk petugas bioskop</p>
          </div>
          <div className="staff-info">
            <div className="staff-badge">
              <span className="staff-name">{user?.username || 'Petugas'}</span>
              <span className="staff-role">Ticket Checker</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
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
              <h3>{successRate}%</h3>
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

        {/* Navigation Tabs */}
        <div className="navigation-tabs">
          <button 
            className={`tab ${currentView === 'scanner' ? 'active' : ''}`}
            onClick={() => setCurrentView('scanner')}
          >
            📷 Scanner
          </button>
          <button 
            className={`tab ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentView('history')}
          >
            📋 History ({scanHistory.length})
          </button>
          <button 
            className={`tab ${currentView === 'manual' ? 'active' : ''}`}
            onClick={() => setCurrentView('manual')}
          >
            🔍 Manual Check
          </button>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {currentView === 'scanner' && (
            <div className="scanner-view">
              <QRScanner onScanResult={handleScanResult} />
            </div>
          )}

          {currentView === 'history' && (
            <div className="history-view">
              <div className="history-header">
                <h3>Riwayat Scan</h3>
                <div className="history-actions">
                  <button 
                    className="export-btn"
                    onClick={exportToCSV}
                    disabled={scanHistory.length === 0}
                  >
                    📥 Export CSV
                  </button>
                  <button 
                    className="clear-btn"
                    onClick={clearHistory}
                    disabled={scanHistory.length === 0}
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>

              {scanHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>Belum ada riwayat scan</p>
                  <small>Gunakan scanner untuk memverifikasi tiket</small>
                </div>
              ) : (
                <div className="scan-history">
                  {scanHistory.map(scan => (
                    <div key={scan.id} className={`history-item ${scan.valid ? 'valid' : 'invalid'}`}>
                      <div className="item-header">
                        <div className="item-status">
                          {scan.valid ? '✅ VALID' : '❌ INVALID'}
                        </div>
                        <div className="item-time">
                          {new Date(scan.timestamp).toLocaleString('id-ID')}
                        </div>
                      </div>
                      
                      <div className="item-details">
                        {scan.valid ? (
                          <>
                            <div className="detail-row">
                              <strong>Film:</strong> {scan.ticket_info?.movie}
                            </div>
                            <div className="detail-row">
                              <strong>Booking:</strong> {scan.ticket_info?.booking_reference}
                            </div>
                            <div className="detail-row">
                              <strong>Kursi:</strong> 
                              <span className="seats-tag">
                                {scan.ticket_info?.seats?.join(', ')}
                              </span>
                            </div>
                            <div className="detail-row">
                              <strong>Customer:</strong> {scan.ticket_info?.customer}
                            </div>
                          </>
                        ) : (
                          <div className="detail-row">
                            <strong>Pesan:</strong> {scan.message}
                          </div>
                        )}
                      </div>
                      
                      <div className="item-footer">
                        <span className="staff-tag">👤 {scan.staff}</span>
                        {scan.ticket_info?.verification_code && (
                          <span className="code-tag">
                            #{scan.ticket_info.verification_code}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'manual' && (
            <div className="manual-view">
              <h3>🔍 Pencarian Manual Tiket</h3>
              <div className="manual-search">
                <div className="search-input-group">
                  <input 
                    type="text" 
                    placeholder="Masukkan Booking Reference atau Verification Code..."
                    className="search-input"
                  />
                  <button className="search-btn">
                    🔍 Search
                  </button>
                </div>
              </div>

              <div className="quick-stats">
                <h4>📊 Aktivitas Real-time</h4>
                <div className="today-stats">
                  <div className="today-stat">
                    <span className="stat-value">{stats.todayScans}</span>
                    <span className="stat-label">Scan Hari Ini</span>
                  </div>
                  <div className="today-stat">
                    <span className="stat-value">{stats.todayValid}</span>
                    <span className="stat-label">Valid Hari Ini</span>
                  </div>
                  <div className="today-stat">
                    <span className="stat-value">
                      {new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="stat-label">Tanggal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="staff-footer">
          <p>
            🎯 <strong>Sistem Verifikasi Tiket</strong> | 
            Last Update: {new Date().toLocaleString('id-ID')} |
            Total Records: {scanHistory.length} |
            Success Rate: {successRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;