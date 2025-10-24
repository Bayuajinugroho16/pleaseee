// src/hooks/useWebSocket.js
import { useEffect, useState, useRef } from 'react';
const socket = new WebSocket(import.meta.env.VITE_WS_URL);

const useWebSocket = (onNotification) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const onNotificationRef = useRef(onNotification);

  // Update ref when onNotification changes
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    // Connect to WebSocket dengan user email jika available
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('username') || 'anonymous';
    // ✅ BENAR - PAKAI ENVIRONMENT VARIABLE
const websocketUrl = `${import.meta.env.VITE_WS_URL}?userEmail=${encodeURIComponent(userEmail)}`;
    
    console.log('🔌 Connecting to WebSocket:', websocketUrl);
    
    const websocket = new WebSocket(websocketUrl);
    
    websocket.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      setWs(websocket);
      
      // Send connection confirmation
      websocket.send(JSON.stringify({
        type: 'CLIENT_CONNECTED',
        userEmail: userEmail,
        timestamp: new Date().toISOString()
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'NOTIFICATION':
            console.log('🔔 Notification received:', data.notification);
            if (onNotificationRef.current) {
              onNotificationRef.current(data.notification);
            }
            break;
            
          case 'SEAT_UPDATE':
            console.log('🔄 Seat update received:', data.seats);
            // Bisa ditambahkan handler untuk seat update jika diperlukan
            break;
            
          case 'CONNECTED':
            console.log('✅ WebSocket connection confirmed by server');
            break;
            
          case 'PONG':
            console.log('🏓 Pong received from server');
            break;
            
          default:
            console.log('📨 Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('❌ WebSocket message parse error:', error);
        console.log('📄 Raw message:', event.data);
      }
    };

    websocket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setWs(null);
      
      // Clear existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Attempt reconnect after 3 seconds (kecuali close normal)
      if (event.code !== 1000) { // 1000 = normal closure
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          setWs(new WebSocket(websocketUrl));
        }, 3000);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close(1000, 'Component unmounted');
      }
    };
  }, []); // Empty dependency array - hanya run sekali saat mount

  // Function untuk send message (optional)
  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  // Function untuk ping server (optional)
  const pingServer = () => {
    return sendMessage({ type: 'PING', timestamp: new Date().toISOString() });
  };

  return { 
    ws, 
    isConnected, 
    sendMessage, 
    pingServer 
  };
};

export default useWebSocket;