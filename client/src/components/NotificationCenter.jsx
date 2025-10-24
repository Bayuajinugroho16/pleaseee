// components/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import useNotificationPolling from '../hooks/useNotificationPolling';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [pollingStatus, setPollingStatus] = useState('disconnected');

  const handleNewNotification = (notification) => {
    console.log('🔔 New notification received via polling:', notification);
    
    // 1. Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    
    // 2. SHOW POPUP/TOAST FOR ALL NOTIFICATIONS
    showPopup(notification);
    
    // 3. Play sound for important notifications (optional)
    if (notification.type === 'warning' || notification.type === 'error') {
      playNotificationSound();
    }
  };

  // Initialize Polling connection
  const { isConnected, manualRefresh, lastUpdate } = useNotificationPolling(handleNewNotification, 10000);

  // Update polling status
  useEffect(() => {
    setPollingStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // ✅ FUNCTION UNTUK MENAMPILKAN POPUP
  const showPopup = (notification) => {
    setActivePopup(notification);
    
    // Auto-hide popup setelah 5 detik
    setTimeout(() => {
      setActivePopup(null);
    }, 5000);
  };

  // ✅ FUNCTION UNTUK PLAY SOUND (optional)
  const playNotificationSound = () => {
    // Anda bisa tambahkan sound effect di sini
    console.log('🔊 Playing notification sound');
    // Contoh: new Audio('/notification-sound.mp3').play();
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  // Manual refresh notifications
  const handleManualRefresh = () => {
    console.log('🔄 Manually refreshing notifications...');
    manualRefresh();
  };

  return (
    <div className="notification-center">
      {/* Notification Bell Icon */}
      <div 
        className="notification-bell"
        onClick={() => setIsVisible(!isVisible)}
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">
            {notifications.length}
          </span>
        )}
        
        {/* Polling status indicator */}
        <div className={`polling-indicator ${pollingStatus}`}>
          {pollingStatus === 'connected' ? '🟢' : '🔴'}
        </div>
      </div>

      {/* ✅ REAL-TIME POPUP NOTIFICATION */}
      {activePopup && (
        <div className={`notification-popup ${activePopup.type}`}>
          <div className="popup-header">
            <span className="popup-icon">
              {getNotificationIcon(activePopup.type)}
            </span>
            <strong>{activePopup.title}</strong>
            <button onClick={closePopup} className="popup-close">×</button>
          </div>
          <div className="popup-body">
            <p>{activePopup.message}</p>
          </div>
          <div className="popup-footer">
            <small>{formatTime(activePopup.createdAt)}</small>
          </div>
          {/* Progress bar untuk auto-close */}
          <div className="popup-progress"></div>
        </div>
      )}

      {/* Notifications Panel */}
      {isVisible && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications ({notifications.length})</h3>
            <div className="header-actions">
              <button 
                onClick={handleManualRefresh}
                className="refresh-btn"
                title="Refresh notifications"
              >
                🔄
              </button>
              <button 
                onClick={clearAllNotifications}
                className="clear-all-btn"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {/* Polling status display */}
          <div className={`polling-status ${pollingStatus}`}>
            Status: {pollingStatus === 'connected' ? 'Connected' : 'Disconnected'}
            {lastUpdate && ` • Last update: ${formatTime(lastUpdate)}`}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No new notifications
                <br />
                <small>Polling every 10 seconds</small>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.type}`}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <span className="item-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <strong>{notification.title}</strong>
                    </div>
                    <p>{notification.message}</p>
                    <small>
                      {formatTime(notification.createdAt)}
                      {notification.from && ` • From: ${notification.from}`}
                    </small>
                  </div>
                  <button 
                    onClick={() => removeNotification(notification.id)}
                    className="close-notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ HELPER FUNCTION UNTUK ICON
const getNotificationIcon = (type) => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  return icons[type] || '🔔';
};

// ✅ HELPER FUNCTION UNTUK FORMAT WAKTU
const formatTime = (timestamp) => {
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  } catch (error) {
    return 'Recently';
  }
};

export default NotificationCenter;