import React, { useState, useEffect } from 'react';
import './TicketValidationAlert.css';

const TicketValidationAlert = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let timeoutId;

    const handleStorageChange = () => {
      const lastValidation = localStorage.getItem('lastTicketValidation');
      
      if (lastValidation) {
        try {
          const validationData = JSON.parse(lastValidation);
          
          if (validationData.type === 'TICKET_VALIDATED') {
            console.log('🎯 New notification received');
            setNotification(validationData.data);
            
            // Clear previous timeout if exists
            if (timeoutId) clearTimeout(timeoutId);
            
            // Auto remove after 8 seconds
            timeoutId = setTimeout(() => {
              setNotification(null);
              localStorage.removeItem('lastTicketValidation');
            }, 8000);
            
            // Immediately remove from storage to prevent re-show
            setTimeout(() => {
              localStorage.removeItem('lastTicketValidation');
            }, 100);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
          localStorage.removeItem('lastTicketValidation');
        }
      }
    };

    // Check on mount and remove any existing notifications
    localStorage.removeItem('lastTicketValidation');
    
    // Listen for new notifications
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const closeNotification = () => {
    setNotification(null);
    localStorage.removeItem('lastTicketValidation');
  };

  if (!notification) return null;

  return (
    <div className={`ticket-validation-alert ${notification.valid ? 'valid' : 'invalid'}`}>
      <div className="alert-content">
        <div className="alert-icon">
          {notification.valid ? '✅' : '❌'}
        </div>
        <div className="alert-message">
          <h4>
            {notification.valid ? '🎉 Tiket Valid!' : '❌ Tiket Tidak Valid'}
          </h4>
          <p>{notification.message}</p>
          {notification.valid && notification.ticket_info && (
            <div className="ticket-details">
              <div className="detail-row">
                <strong>Film:</strong> 
                <span>{notification.ticket_info.movie}</span>
              </div>
              <div className="detail-row">
                <strong>Kursi:</strong> 
                <span className="seats">{notification.ticket_info.seats?.join(', ')}</span>
              </div>
              <div className="detail-row">
                <strong>Booking:</strong> 
                <span className="reference">{notification.ticket_info.booking_reference}</span>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={closeNotification}
          className="close-alert"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
      
      <div className="progress-bar">
        <div className="progress-fill"></div>
      </div>
    </div>
  );
};

export default TicketValidationAlert;