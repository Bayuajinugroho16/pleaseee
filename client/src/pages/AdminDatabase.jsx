import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import './AdminDatabase.css';

const AdminDatabase = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const result = await response.json();
      console.log('📊 Bookings data:', result);
      
      if (result.success) {
        setBookings(result.data);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Cannot connect to server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedPayments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings/uploaded-payments');
      const result = await response.json();
      
      if (result.success) {
        console.log('💰 Uploaded payments:', result.data);
        alert(`Found ${result.data.length} payments with proof`);
      } else {
        alert('No payments with proof found');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <Navigation />
        <div className="loading">Loading database data...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Navigation />
      
      <div className="admin-content">
        <h1>🗃️ Database Viewer</h1>
        
        <div className="admin-actions">
          <button onClick={fetchBookings} className="refresh-btn">
            🔄 Refresh Data
          </button>
          <button onClick={fetchUploadedPayments} className="payment-btn">
            💰 Check Payment Proofs
          </button>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p>{bookings.length}</p>
          </div>
          <div className="stat-card">
            <h3>With Payment Proof</h3>
            <p>{bookings.filter(b => b.payment_proof).length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p>{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
        </div>

        <div className="bookings-table">
          <h2>📋 All Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="no-data">
              <p>No bookings found in database</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Movie</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Proof</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td className="reference">{booking.booking_reference}</td>
                    <td>{booking.customer_name}</td>
                    <td>{booking.movie_title}</td>
                    <td>Rp {booking.total_amount?.toLocaleString()}</td>
                    <td>
                      <span className={`status ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      {booking.payment_proof ? (
                        <div className="proof-cell">
                          <span className="proof-name">{booking.payment_proof}</span>
                          <a 
                            href={`http://localhost:5000/uploads/payments/${booking.payment_proof}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="view-proof"
                          >
                            👁️ View
                          </a>
                        </div>
                      ) : (
                        <span className="no-proof">❌ No proof</span>
                      )}
                    </td>
                    <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDatabase;