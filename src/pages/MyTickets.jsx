import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./MyTickets.css";

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
  if (!user?.username) return;
  setLoading(true);
  try {
    const res = await fetch(`https://beckendflyio.vercel.app/api/bookings/my-tickets?username=${user.username}`);
    const data = await res.json();
    if (data.success) setTickets([...data.data.bookings, ...data.data.bundleOrders]);
    else setError(data.message || 'Failed to fetch tickets');
  } catch (err) {
    console.error(err);
    setError('Fetch error');
  }
  setLoading(false);
};

  useEffect(() => {
    fetchTickets();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="my-tickets-container">
      <Navigation />
      <div className="page-content">
        <div className="tickets-header">
          <h1>My Tickets</h1>
          <p>Your movie bookings and bundle orders</p>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {tickets.length === 0 ? (
          <div className="no-tickets">
            <div className="no-tickets-icon">🎭</div>
            <h3>No Tickets Found</h3>
            <p>You haven't booked any movies or bundles yet.</p>
            <button
              onClick={() => (window.location.href = "/home")}
              className="book-now-btn"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h3>{ticket.movie_title || ticket.bundle_name}</h3>
                  <span className={`status-badge ${ticket.status}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="ticket-details">
                  {ticket.seat_numbers && (
                    <div className="detail-row">
                      <span className="label">Seats:</span>
                      <span className="value">
                        {Array.isArray(ticket.seat_numbers)
                          ? ticket.seat_numbers.join(", ")
                          : ticket.seat_numbers}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">
                      Rp {ticket.total_amount?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Booking Date:</span>
                    <span className="value">
                      {ticket.booking_date
                        ? new Date(ticket.booking_date).toLocaleDateString("id-ID")
                        : "Unknown date"}
                    </span>
                  </div>
                </div>

                {ticket.payment_proof && (
                  <div className="payment-proof-section">
                    <h4>Payment Proof:</h4>
                    <img
                      src={ticket.payment_proof}
                      alt="Payment Proof"
                      className="payment-proof-image"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}

                <div className="ticket-actions">
                  <button
                    onClick={() => alert(`Ticket: ${ticket.movie_title || ticket.bundle_name}`)}
                    className="view-ticket-btn"
                  >
                    View Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
