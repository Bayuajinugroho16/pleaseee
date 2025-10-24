// // src/hooks/useWebSocket.js - DISABLED FOR VERCEL DEPLOY
import { useState } from 'react';

const useWebSocket = (onNotification) => {
  console.log('⚠️ WebSocket disabled - using mock mode');
  
  const [isConnected, setIsConnected] = useState(false);

  // Mock functions that do nothing
  const sendMessage = (message) => {
    console.log('📨 Mock WebSocket message (disabled):', message);
    return false;
  };

  const pingServer = () => {
    console.log('🏓 Mock WebSocket ping (disabled)');
    return false;
  };

  return { 
    ws: null, 
    isConnected, 
    sendMessage, 
    pingServer 
  };
};

export default useWebSocket;