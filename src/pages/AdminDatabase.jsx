import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import './AdminDatabase.css';

const AdminDatabase = () => {
  const [bookings, setBookings] = useState([]);
  const [bundleOrders, setBundleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // ✅ CEK APAKAH USER ADALAH ADMIN
  useEffect(() => {
    if (!isAdmin) {
      console.log('❌ Access denied: User is not admin');
      navigate('/home');
      return;
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // ✅ FETCH REGULAR BOOKINGS DAN BUNDLE ORDERS SECARA PARALEL
      const [bookingsResponse, bundleOrdersResponse] = await Promise.all([
        fetch('https://beckendflyio.vercel.app/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('https://beckendflyio.vercel.app/api/bookings/bundle-orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Handle regular bookings response
      if (!bookingsResponse.ok) {
        throw new Error('Failed to fetch regular bookings');
      }
      const bookingsResult = await bookingsResponse.json();
      
      // Handle bundle orders response (bisa 404 jika endpoint belum ada)
      let bundleOrdersResult = { success: true, data: [] };
      if (bundleOrdersResponse.ok) {
        bundleOrdersResult = await bundleOrdersResponse.json();
      } else {
        console.log('⚠️ Bundle orders endpoint not available yet');
      }

      console.log('📊 Regular bookings:', bookingsResult.data?.length || 0);
      console.log('📦 Bundle orders:', bundleOrdersResult.data?.length || 0);

      if (bookingsResult.success) {
        setBookings(bookingsResult.data || []);
      } else {
        setError(bookingsResult.message);
      }

      if (bundleOrdersResult.success) {
        setBundleOrders(bundleOrdersResult.data || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ GABUNGKAN DATA REGULAR BOOKINGS DAN BUNDLE ORDERS
  const getAllOrders = () => {
    const regularBookings = bookings.map(booking => ({
      ...booking,
      order_type: 'regular',
      display_movie: booking.movie_title,
      display_reference: booking.booking_reference,
      display_customer: booking.customer_name,
      display_amount: booking.total_amount,
      display_status: booking.status,
      display_proof: booking.payment_proof,
      display_date: booking.booking_date
    }));

    const bundleOrdersFormatted = bundleOrders.map(order => ({
      ...order,
      order_type: 'bundle',
      display_movie: order.movie_title || order.bundle_name,
      display_reference: order.order_reference,
      display_customer: order.customer_name,
      display_amount: order.total_amount || order.total_price,
      display_status: order.status,
      display_proof: order.payment_proof,
      display_date: order.order_date || order.booking_date
    }));

    return [...regularBookings, ...bundleOrdersFormatted].sort((a, b) => 
      new Date(b.display_date) - new Date(a.display_date)
    );
  };

  const allOrders = getAllOrders();

  const fetchUploadedPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://beckendflyio.vercel.app/api/bookings/uploaded-payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('💰 Uploaded payments:', result.data);
        alert(`Found ${result.data.length} payments with proof`);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ✅ JIKA BUKAN ADMIN, TAMPILKAN ACCESS DENIED
  if (!isAdmin) {
    return (
      <div className="admin-container">
        <Navigation />
        <div className="access-denied">
          <h1>🚫 Access Denied</h1>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => navigate('/home')} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <Navigation />
        <div className="loading">
          <div className="spinner"></div>
          Loading database data...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Navigation />
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>🗃️ Database Viewer</h1>
          <div className="user-info">
            <span>Logged in as: <strong>{user?.username}</strong> ({user?.role})</span>
          </div>
        </div>
        
        <div className="admin-actions">
          <button onClick={fetchAllData} className="refresh-btn">
            🔄 Refresh All Data
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
            <h3>Total Orders</h3>
            <p>{allOrders.length}</p>
          </div>
          <div className="stat-card">
            <h3>Regular Bookings</h3>
            <p>{bookings.length}</p>
          </div>
          <div className="stat-card">
            <h3>Bundle Orders</h3>
            <p>{bundleOrders.length}</p>
          </div>
          <div className="stat-card">
            <h3>With Payment Proof</h3>
            <p>{allOrders.filter(order => order.display_proof).length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p>{allOrders.filter(order => order.display_status === 'confirmed').length}</p>
          </div>
        </div>

        <div className="bookings-table">
          <h2>📋 All Orders (Regular + Bundle)</h2>
          
          {allOrders.length === 0 ? (
            <div className="no-data">
              <p>No orders found in database</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>ID</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Movie/Bundle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Proof</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map((order, index) => (
                  <tr key={`${order.order_type}-${order.id || index}`}>
                    <td>
                      <span className={`order-type ${order.order_type}`}>
                        {order.order_type === 'bundle' ? '🎁 Bundle' : '🎬 Movie'}
                      </span>
                    </td>
                    <td>{order.id}</td>
                    <td className="reference">{order.display_reference}</td>
                    <td>{order.display_customer}</td>
                    <td>
                      {order.display_movie}
                      {order.order_type === 'bundle' && (
                        <span className="bundle-badge"> (Bundle)</span>
                      )}
                    </td>
                    <td>Rp {order.display_amount?.toLocaleString()}</td>
                    <td>
                      <span className={`status ${order.display_status}`}>
                        {order.display_status}
                      </span>
                    </td>
                    <td>
                      {order.display_proof ? (
                        <div className="proof-cell">
                          <span className="proof-name">{order.display_proof}</span>
                          <a 
                            href={`https://beckendflyio.vercel.app/uploads/payments/${order.display_proof}`}
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
                    <td>{new Date(order.display_date).toLocaleDateString()}</td>
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