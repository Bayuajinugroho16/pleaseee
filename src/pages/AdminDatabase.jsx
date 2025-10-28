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

  // ✅ Check Admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Fetch all bookings + bundle orders
  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Admin token not found");

      const [bookingsRes, bundleRes] = await Promise.all([
        fetch("https://beckendflyio.vercel.app/api/admin/all-bookings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("https://beckendflyio.vercel.app/api/bookings/bundle-orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!bookingsRes.ok) {
        const err = await bookingsRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch regular bookings");
      }

      if (!bundleRes.ok) {
        const err = await bundleRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch bundle orders");
      }

      const bookingsData = await bookingsRes.json();
      const bundleData = await bundleRes.json();

      console.log("📨 Fetched regular bookings:", bookingsData.data);
      console.log("📦 Fetched bundle orders:", bundleData.data);

      setBookings(bookingsData.data || []);
      setBundleOrders(bundleData.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ View Payment Proof
  const viewPaymentProof = async (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
    setPaymentImage(null);
    setImageLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://beckendflyio.vercel.app/api/admin/payment-proof/${booking.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();

      if (result.success) setPaymentImage(result.data.image_url);
      else setPaymentImage("not_found");
    } catch (err) {
      console.error(err);
      setPaymentImage("error");
    } finally {
      setImageLoading(false);
    }
  };

  // ✅ Update Booking Status
  const updateBookingStatus = async (bookingReference, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
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
      const result = await res.json();
      if (result.success) {
        console.log("✅ Status updated:", bookingReference, newStatus);
        fetchAllData(); // refresh data setelah update
      } else alert("❌ Failed: " + result.message);
    } catch (err) {
      console.error(err);
      alert("❌ Error updating status");
    }
  };

  // ✅ Handle Confirm / Reject
  const handleConfirmReject = async (newStatus) => {
    if (!selectedBooking) return;
    const confirmed = window.confirm(
      `Set status "${newStatus}" for ${selectedBooking.customer_name}?`
    );
    if (!confirmed) return;

    await updateBookingStatus(selectedBooking.booking_reference, newStatus);
    setShowPaymentModal(false);
  };

  // Merge regular + bundle orders
  const getAllOrders = () => {
    const regular = bookings.map((b) => ({
      ...b,
      order_type: "regular",
      display_customer: b.customer_name,
      display_movie: b.movie_title,
      display_amount: b.total_amount,
      display_status: b.status,
      has_payment_image: b.has_payment_image || b.payment_base64,
      display_date: b.booking_date,
    }));

    const bundle = bundleOrders.map((b) => ({
      ...b,
      order_type: "bundle",
      display_customer: b.customer_name,
      display_movie: b.movie_title || b.bundle_name,
      display_amount: b.total_amount || b.total_price,
      display_status: b.status,
      has_payment_image: b.has_payment_image,
      display_date: b.booking_date || b.order_date,
    }));

    return [...regular, ...bundle].sort(
      (a, b) => new Date(b.display_date) - new Date(a.display_date)
    );
  };

  const allOrders = getAllOrders();

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <Navigation />
        <h1>🚫 Access Denied</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <Navigation />
        <div className="loading">
          <div className="spinner"></div> Loading database data...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Navigation />

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h3>💰 Payment Proof - {selectedBooking?.customer_name}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
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

              {imageLoading ? (
                <div className="spinner"></div>
              ) : paymentImage === "not_found" ? (
                <p>No payment proof found</p>
              ) : paymentImage === "error" ? (
                <p>Error loading image</p>
              ) : (
                <div>
                  <img
                    src={paymentImage}
                    alt="Payment Proof"
                    className="payment-image"
                  />
                  <button onClick={() => window.open(paymentImage, "_blank")}>
                    🔍 Open Full Size
                  </button>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowPaymentModal(false)}>Close</button>
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
        <h1>🗃️ Database Viewer</h1>
        <p>Logged in as: {user?.username}</p>

        <button onClick={fetchAllData} className="refresh-btn">
          🔄 Refresh Data
        </button>

        <div className="bookings-table">
          <h2>📋 All Orders</h2>
          {error && <p className="error">{error}</p>}
          {allOrders.length === 0 ? (
            <p>No orders</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>ID</th>
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
                {allOrders.map((o, i) => (
                  <tr key={`${o.order_type}-${o.id || i}`}>
                    <td>
                      {o.order_type === "bundle" ? "🎁 Bundle" : "🎬 Movie"}
                    </td>
                    <td>{o.id}</td>
                    <td>{o.display_customer}</td>
                    <td>{o.display_movie}</td>
                    <td>Rp {o.display_amount?.toLocaleString()}</td>
                    <td>{o.display_status}</td>
                    <td>
                      {o.has_payment_image ? (
                        <button onClick={() => viewPaymentProof(o)}>
                          👁️ View Proof
                        </button>
                      ) : (
                        <span>❌ No proof</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={o.display_status}
                        onChange={(e) =>
                          updateBookingStatus(o.booking_reference, e.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      {new Date(o.display_date).toLocaleDateString("id-ID")}
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
