// src/hooks/useNotificationPolling.js
import { useEffect, useState, useRef } from 'react';

const useNotificationPolling = (onNotification, interval = 10000) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const onNotificationRef = useRef(onNotification);

  // Update ref when callback changes
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const fetchNotifications = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('username');
      if (!userEmail) {
        console.log('👤 No user email found for notification polling');
        return;
      }

      console.log('🔔 Fetching notifications for:', userEmail);
      const response = await fetch(`/api/notifications/user/${encodeURIComponent(userEmail)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          console.log('📨 Notifications received:', data.data.length);
          
          data.data.forEach(notification => {
            // Only trigger callback for new notifications
            if (onNotificationRef.current && 
                (!lastUpdate || new Date(notification.created_at) > lastUpdate)) {
              onNotificationRef.current(notification);
            }
          });
          
          setLastUpdate(new Date());
          setIsConnected(true);
        }
      } else {
        console.error('❌ Notification fetch failed:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('❌ Notification polling error:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    console.log('🔔 Starting notification polling every', interval, 'ms');
    
    // Initial fetch
    fetchNotifications();
    
    // Set up polling interval
    intervalRef.current = setInterval(fetchNotifications, interval);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🧹 Notification polling stopped');
      }
    };
  }, [interval]);

  const manualRefresh = () => {
    console.log('🔄 Manual notification refresh');
    fetchNotifications();
  };

  return { 
    isConnected, 
    lastUpdate, 
    manualRefresh 
  };
};

export default useNotificationPolling;