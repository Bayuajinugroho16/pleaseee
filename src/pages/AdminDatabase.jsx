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

  // ✅ Redirect if not admin
  useEffect(() => {
    if (!isAdmin && !loading) navigate("/home");
  }, [isAdmin, loading, navigate]);

  // ✅ Fetch bookings
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

      if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");
      if (!bundleRes.ok) throw new Error("Failed to fetch bundle orders");

      const bookingsData = await bookingsRes.json();
      const bundleData = await bundleRes.json();

      setBookings(bookingsData.data || []);
      setBundleOrders(bundleData.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ View payment proof
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

  // ✅ Update booking status
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
      if (result.success) fetchAllData();
      else alert("❌ Failed: " + result.message);
    } catch (err) {
      console.error(err);
      alert("❌ Error updating status");
    }
  };

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

  if (loading) return <div className="admin-container">Loading...</div>;

  return (
    <div className="admin-container">
      <Navigation />
      <h1>🗃️ Database Viewer</h1>
      <p>Logged in as: {user?.username}</p>
      <button onClick={fetchAllData}>🔄 Refresh Data</button>
      {error && <p style={{ color: "red" }}>{error}</p>}

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
              <td>{o.order_type === "bundle" ? "🎁 Bundle" : "🎬 Movie"}</td>
              <td>{o.id}</td>
              <td>{o.display_customer}</td>
              <td>{o.display_movie}</td>
              <td>Rp {o.display_amount?.toLocaleString()}</td>
              <td>{o.display_status}</td>
              <td>
                {o.has_payment_image ? (
                  <button onClick={() => viewPaymentProof(o)}>👁️ View Proof</button>
                ) : (
                  "❌ No proof"
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
              <td>{new Date(o.display_date).toLocaleDateString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal">
          <div className="modal-content">
            <h3>Payment Proof - {selectedBooking.display_customer}</h3>
            {imageLoading && <p>Loading image...</p>}
            {!imageLoading && paymentImage === "not_found" && <p>❌ No payment proof found</p>}
            {!imageLoading && paymentImage === "error" && <p>❌ Error loading image</p>}
            {!imageLoading && paymentImage && paymentImage !== "not_found" && paymentImage !== "error" && (
              <img src={paymentImage} alt="Payment Proof" className="payment-img" />
            )}
            <div className="modal-actions">
              <button onClick={() => handleConfirmReject("confirmed")}>✅ Confirm</button>
              <button onClick={() => handleConfirmReject("rejected")}>❌ Reject</button>
              <button onClick={() => setShowPaymentModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabase;
