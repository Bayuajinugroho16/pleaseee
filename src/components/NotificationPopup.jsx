// src/components/NotificationPopup.jsx
import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket'; // ✅ Path yang benar
import './NotificationPopup.css';

const NotificationPopup = () => {
  const [notifications, setNotifications] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');

  const handleNewNotification = (notification) => {
    console.log('🔔 Real-time notification received:', notification);
    
    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    
    // Show popup immediately
    showPopup(notification);
    
    // Play sound for important notifications
    if (notification.type === 'warning' || notification.type === 'error') {
      playNotificationSound();
    }
  };

  // Initialize WebSocket connection
  const { isConnected, sendMessage } = useWebSocket(handleNewNotification);

  // Update WebSocket status
  useEffect(() => {
    setWsStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  const showPopup = (notification) => {
    setActivePopup(notification);
    
    // Auto-hide popup after 6 seconds
    const timer = setTimeout(() => {
      setActivePopup(null);
    }, 6000);

    return () => clearTimeout(timer);
  };

  const playNotificationSound = () => {
    // Simple browser notification sound menggunakan Web Audio API
    try {
      // Coba buat audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch (error) {
      console.log('🔊 Notification sound not supported in this browser');
      // Fallback: menggunakan HTML5 audio jika diperlukan
    }
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || '🔔';
  };

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

  // Debug: Tampilkan status WebSocket di console
  useEffect(() => {
    console.log(`🌐 WebSocket status: ${wsStatus}`);
  }, [wsStatus]);

  if (!activePopup) return null;

  return (
    <div className={`notification-popup ${activePopup.type}`}>
      <div className="popup-header">
        <span className="popup-icon">
          {getNotificationIcon(activePopup.type)}
        </span>
        <strong className="popup-title">{activePopup.title}</strong>
        <button onClick={closePopup} className="popup-close">×</button>
      </div>
      
      <div className="popup-body">
        <p>{activePopup.message}</p>
      </div>
      
      <div className="popup-footer">
        <small>{formatTime(activePopup.createdAt)}</small>
        {activePopup.from && <span className="popup-source">From: {activePopup.from}</span>}
      </div>
      
      {/* Auto-close progress bar */}
      <div className="popup-progress">
        <div className="progress-bar"></div>
      </div>

      {/* WebSocket status indicator (debug) */}
      <div className={`ws-status ${wsStatus}`}>
        {wsStatus === 'connected' ? '🔵' : '🔴'}
      </div>
    </div>
  );
};

export default NotificationPopup;