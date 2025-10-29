import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./AdminDatabase.css"; // pakai style sama

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://beckendflyio.vercel.app/api/bookings/my-bookings?username=${user.username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch tickets");

        const result = await res.json();
        const regular = result.data?.bookings || [];
        const bundle = result.data?.bundleOrders || [];

        const allTickets = [
          ...regular.map((b) => ({
            ...b,
            order_type: "regular",
            display_movie: b.movie_title,
            display_amount: b.total_amount,
            has_payment_image: !!b.payment_url,
            payment_url: b.payment_url || null,
            display_date: b.booking_date,
          })),
          ...bundle.map((b) => ({
            ...b,
            order_type: "bundle",
            display_movie: b.bundle_name,
            display_amount: b.total_amount || b.quantity,
            has_payment_image: !!b.payment_proof,
            payment_url: b.payment_proof || null,
            display_date: b.booking_date || b.order_date,
          })),
        ].sort((a, b) => new Date(b.display_date) - new Date(a.display_date));

        setTickets(allTickets);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  const viewPaymentProof = (ticket) => {
    if (!ticket.has_payment_image) {
      alert("❌ No payment proof available");
      return;
    }
    setSelectedTicket(ticket);
    setShowPaymentModal(true);
  };

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading tickets...
      </div>
    );

  return (
    <div className="admin-container">
      <Navigation />
      <div className="admin-content">
        <h1>My Tickets</h1>
        {error && <div className="error-banner">{error}</div>}

        {tickets.length === 0 ? (
          <div className="no-data">
            <div className="no-tickets-icon">🎭</div>
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="bookings-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>ID</th>
                  <th>Movie/Bundle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Proof</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span
                        className={`order-type ${
                          t.order_type === "bundle" ? "bundle" : "regular"
                        }`}
                      >
                        {t.order_type === "bundle" ? "🎁 Bundle" : "🎬 Movie"}
                      </span>
                    </td>
                    <td>{t.id}</td>
                    <td>{t.display_movie}</td>
                    <td>Rp {t.display_amount?.toLocaleString()}</td>
                    <td>
                      <span className={`status ${t.status}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="proof-cell">
                      {t.has_payment_image ? (
                        <button
                          className="view-proof-btn"
                          onClick={() => viewPaymentProof(t)}
                        >
                          👁️ View Proof
                        </button>
                      ) : (
                        <span className="no-proof">❌ No proof</span>
                      )}
                    </td>
                    <td>
                      {t.display_date
                        ? new Date(t.display_date).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTicket && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Payment Proof - {selectedTicket.display_movie}</h3>
              <button
                className="close-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              {selectedTicket.payment_url ? (
                <img
                  src={selectedTicket.payment_url}
                  alt="Payment Proof"
                  className="payment-image"
                />
              ) : (
                <div className="no-payment-proof">
                  ❌ No payment proof available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
