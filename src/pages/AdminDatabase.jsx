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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin && !loading) navigate("/home");
  }, [isAdmin, loading, navigate]);

  // Fetch bookings and bundles
  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Admin token not found");

      // Tambah cache-busting dan no-store
      const res = await fetch(
        `https://beckendflyio.vercel.app/api/admin/all-bookings?_=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!res.ok) throw new Error("Failed to fetch bookings");

      const result = await res.json();

      // Pastikan data ada dan array
      setBookings(
        Array.isArray(result.data?.bookings) ? result.data.bookings : []
      );
      setBundleOrders(
        Array.isArray(result.data?.bundleOrders) ? result.data.bundleOrders : []
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAllOrders = () => {
    const regular = bookings.map((b) => ({
      ...b,
      order_type: "regular",
      reference: b.booking_reference,
      display_customer: b.customer_name,
      display_movie: b.movie_title,
      display_amount: Number(b.total_amount) || 0,
      display_status: b.status,
      has_payment_image: !!(b.payment_url || b.payment_proof),
      payment_url: b.payment_url || b.payment_proof || null,
      display_date: b.booking_date ? new Date(b.booking_date) : new Date(0),
    }));

    const bundle = bundleOrders.map((b) => ({
      ...b,
      order_type: "bundle",
      reference: b.order_reference,
      display_customer: b.customer_name,
      display_address: b.customer_address,
      display_movie: b.bundle_name,
      display_amount: Number(b.total_price) || 0, // total price langsung dari server
      display_status: b.status,
      has_payment_image: !!b.payment_proof,
      payment_url: b.payment_proof || null,
      display_date: b.booking_date
        ? new Date(b.booking_date)
        : b.order_date
        ? new Date(b.order_date)
        : new Date(0),
    }));

    // gabungkan dan urutkan dari terbaru
    return [...regular, ...bundle].sort(
      (a, b) => b.display_date - a.display_date
    );
  };

  const allOrders = getAllOrders();

  const viewPaymentProof = (order) => {
    if (!order.has_payment_image) {
      alert("❌ No payment proof available");
      return;
    }
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const updateOrderStatus = async (order, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        order.order_type === "bundle"
          ? `https://beckendflyio.vercel.app/api/admin/bundle-orders/${order.reference}/status`
          : `https://beckendflyio.vercel.app/api/admin/bookings/${order.reference}/status`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update status");

      fetchAllData(); // refresh data
    } catch (err) {
      console.error(err);
      alert("❌ Error updating status: " + err.message);
    }
  };

  const handleConfirmReject = async (newStatus) => {
    if (!selectedOrder) return;
    const confirmed = window.confirm(
      `Set status "${newStatus}" for ${selectedOrder.display_customer}?`
    );
    if (!confirmed) return;

    await updateOrderStatus(selectedOrder, newStatus);
    setShowPaymentModal(false);
  };

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
            <th>Email/Address</th>
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
              <td>
                {o.order_type === "bundle"
                  ? o.display_address || "-"
                  : o.display_email || "-"}
              </td>
              <td>{o.display_movie}</td>
              <td>Rp {o.display_amount?.toLocaleString()}</td>
              <td>{o.display_status}</td>
              <td>
                {o.has_payment_image ? (
                  <button onClick={() => viewPaymentProof(o)}>
                    👁️ View Proof
                  </button>
                ) : (
                  "❌ No proof"
                )}
              </td>
              <td>
                <select
                  value={o.display_status}
                  onChange={(e) => updateOrderStatus(o, e.target.value)}
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
      {showPaymentModal && selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Bukti Pembayaran - {selectedOrder.display_customer}</h3>

            {/* tampilkan gambar hanya jika ada payment_url */}
            {selectedOrder.payment_url ? (
              <img
                src={selectedOrder.payment_url}
                alt="Payment Proof"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            ) : (
              <p>❌ Tidak ada bukti pembayaran</p>
            )}

            <div className="modal-actions">
              <button onClick={() => handleConfirmReject("confirmed")}>
                ✅ Confirm
              </button>
              <button onClick={() => handleConfirmReject("rejected")}>
                ❌ Reject
              </button>
              <button onClick={() => setShowPaymentModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabase;
