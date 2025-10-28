import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./AdminDatabase.css";

const AdminDatabase = () => {
  const [bookings, setBookings] = useState([]);
  const [bundleOrders, setBundleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentImage, setPaymentImage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // ✅ CEK APAKAH USER ADALAH ADMIN
  useEffect(() => {
    if (!isAdmin) {
      console.log("❌ Access denied: User is not admin");
      navigate("/home");
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
      const token = localStorage.getItem("token");

      // ✅ FETCH REGULAR BOOKINGS DAN BUNDLE ORDERS SECARA PARALEL
      const [bookingsResponse, bundleOrdersResponse] = await Promise.all([
        fetch("https://beckendflyio.vercel.app/api/admin/all-bookings", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("https://beckendflyio.vercel.app/api/bookings/bundle-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      // Handle regular bookings response
      if (!bookingsResponse.ok) {
        throw new Error("Failed to fetch regular bookings");
      }
      const bookingsResult = await bookingsResponse.json();

      // Handle bundle orders response (bisa 404 jika endpoint belum ada)
      let bundleOrdersResult = { success: true, data: [] };
      if (bundleOrdersResponse.ok) {
        bundleOrdersResult = await bundleOrdersResponse.json();
      } else {
        console.log("⚠️ Bundle orders endpoint not available yet");
      }

      console.log("📊 Regular bookings:", bookingsResult.data?.length || 0);
      console.log("📦 Bundle orders:", bundleOrdersResult.data?.length || 0);

      if (bookingsResult.success) {
        setBookings(bookingsResult.data || []);
      } else {
        setError(bookingsResult.message);
      }

      if (bundleOrdersResult.success) {
        setBundleOrders(bundleOrdersResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ VIEW PAYMENT PROOF - BASE64 IMAGES
  const viewPaymentProof = async (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
    setPaymentImage(null);
    setImageLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://beckendflyio.vercel.app/api/admin/payment-proof/${booking.booking_reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setPaymentImage(result.data.image_data);
        console.log("✅ Payment proof loaded for:", booking.booking_reference);
      } else {
        console.log("❌ No payment proof:", result.message);
        setPaymentImage("not_found");
      }
    } catch (error) {
      console.error("Error viewing payment proof:", error);
      setPaymentImage("error");
    } finally {
      setImageLoading(false);
    }
  };

  // ✅ UPDATE BOOKING STATUS
  const updateBookingStatus = async (bookingReference, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://beckendflyio.vercel.app/api/admin/bookings/${bookingReference}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("✅ Status updated successfully");
        fetchAllData(); // Refresh data
      } else {
        alert("❌ Failed to update status: " + result.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("❌ Error updating status");
    }
  };

  // ✅ Tambahkan fungsi handler di component
const handleConfirmReject = async (newStatus) => {
  if (!selectedBooking) return;
  const confirmAction = window.confirm(
    `Are you sure you want to set status to "${newStatus}" for booking ${selectedBooking.booking_reference}?`
  );
  if (!confirmAction) return;

  try {
    await updateBookingStatus(selectedBooking.booking_reference, newStatus);
    setShowPaymentModal(false);
  } catch (error) {
    console.error('Error updating status:', error);
    alert('❌ Failed to update status');
  }
};

  // ✅ GABUNGKAN DATA REGULAR BOOKINGS DAN BUNDLE ORDERS
  const getAllOrders = () => {
    const regularBookings = bookings.map((booking) => ({
      ...booking,
      order_type: "regular",
      display_movie: booking.movie_title,
      display_reference: booking.booking_reference,
      display_customer: booking.customer_name,
      display_amount: booking.total_amount,
      display_status: booking.status,
      has_payment_image: booking.has_payment_image || booking.payment_base64,
      display_date: booking.booking_date,
    }));

    const bundleOrdersFormatted = bundleOrders.map((order) => ({
      ...order,
      order_type: "bundle",
      display_movie: order.movie_title || order.bundle_name,
      display_reference: order.order_reference,
      display_customer: order.customer_name,
      display_amount: order.total_amount || order.total_price,
      display_status: order.status,
      has_payment_image: order.has_payment_image,
      display_date: order.order_date || order.booking_date,
    }));

    return [...regularBookings, ...bundleOrdersFormatted].sort(
      (a, b) => new Date(b.display_date) - new Date(a.display_date)
    );
  };

  const allOrders = getAllOrders();

  // ✅ JIKA BUKAN ADMIN, TAMPILKAN ACCESS DENIED
  if (!isAdmin) {
    return (
      <div className="admin-container">
        <Navigation />
        <div className="access-denied">
          <h1>🚫 Access Denied</h1>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => navigate("/home")} className="back-btn">
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

      {/* ✅ PAYMENT PROOF MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h3>💰 Payment Proof - {selectedBooking?.booking_reference}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="booking-info">
                <p>
                  <strong>Customer:</strong> {selectedBooking?.customer_name}
                </p>
                <p>
                  <strong>Movie:</strong> {selectedBooking?.movie_title}
                </p>
                <p>
                  <strong>Amount:</strong> Rp{" "}
                  {selectedBooking?.total_amount?.toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {selectedBooking?.status}
                </p>
              </div>

              {imageLoading ? (
                <div className="image-loading">
                  <div className="spinner"></div>
                  <p>Loading payment proof...</p>
                </div>
              ) : paymentImage === "not_found" ? (
                <div className="no-payment-proof">
                  <div className="no-proof-icon">❌</div>
                  <h4>No Payment Proof Found</h4>
                </div>
              ) : paymentImage === "error" ? (
                <div className="error-payment">
                  <div className="error-icon">⚠️</div>
                  <h4>Error Loading Image</h4>
                </div>
              ) : paymentImage ? (
                <div className="payment-image-container">
                  <img
                    src={paymentImage}
                    alt="Payment Proof"
                    className="payment-image"
                    onError={() => setPaymentImage("error")}
                  />
                  <div className="image-actions">
                    <button
                      onClick={() => window.open(paymentImage, "_blank")}
                      className="open-full-btn"
                    >
                      🔍 Open Full Size
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ✅ Tombol Confirm & Reject */}
            <div className="modal-actions">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="close-modal-btn"
              >
                Close
              </button>

              {paymentImage &&
                paymentImage !== "error" &&
                paymentImage !== "not_found" && (
                  <>
                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirmReject("confirmed")}
                    >
                      ✅ Confirm
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleConfirmReject("rejected")}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">
        <div className="admin-header">
          <h1>🗃️ Database Viewer</h1>
          <div className="user-info">
            <span>
              Logged in as: <strong>{user?.username}</strong> ({user?.role})
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <button onClick={fetchAllData} className="refresh-btn">
            🔄 Refresh All Data
          </button>
          <button
            onClick={() =>
              alert(
                `Total orders with payment proof: ${
                  allOrders.filter((order) => order.has_payment_image).length
                }`
              )
            }
            className="payment-btn"
          >
            💰 Check Payment Proofs (
            {allOrders.filter((order) => order.has_payment_image).length})
          </button>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

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
            <p>{allOrders.filter((order) => order.has_payment_image).length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p>
              {
                allOrders.filter(
                  (order) => order.display_status === "confirmed"
                ).length
              }
            </p>
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
                  <th>Actions</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map((order, index) => (
                  <tr key={`${order.order_type}-${order.id || index}`}>
                    <td>
                      <span className={`order-type ${order.order_type}`}>
                        {order.order_type === "bundle"
                          ? "🎁 Bundle"
                          : "🎬 Movie"}
                      </span>
                    </td>
                    <td>{order.id}</td>
                    <td className="reference">{order.display_reference}</td>
                    <td>{order.display_customer}</td>
                    <td>
                      {order.display_movie}
                      {order.order_type === "bundle" && (
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
                      {order.has_payment_image ? (
                        <button
                          onClick={() => viewPaymentProof(order)}
                          className="view-proof-btn"
                        >
                          👁️ View Proof
                        </button>
                      ) : (
                        <span className="no-proof">❌ No proof</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={order.display_status}
                        onChange={(e) =>
                          updateBookingStatus(
                            order.display_reference,
                            e.target.value
                          )
                        }
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      {new Date(order.display_date).toLocaleDateString("id-ID")}
                    </td>
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
