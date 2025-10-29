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

  try {
    const response = await fetch(
      `https://beckendflyio.vercel.app/api/bookings/my-tickets?username=${user.username}`
    );
    const result = await response.json();
    if (result.success) {
      setTickets(result.data); // gabungkan booking + bundle dari backend
    } else {
      setError(result.message || "Failed to fetch tickets");
    }
  } catch (err) {
    console.error(err);
    setError("Failed to fetch tickets");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleViewProof = (ticket) => {
    if (ticket.payment_proof) {
      window.open(ticket.payment_proof, "_blank");
    } else {
      alert("No payment proof available for this ticket.");
    }
  };

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
          <p>Your movie bookings and e-tickets</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {tickets.length === 0 ? (
          <div className="no-tickets">
            <div className="no-tickets-icon">🎭</div>
            <h3>No Tickets Found</h3>
            <p>You haven't booked any movies yet.</p>
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
                  <h3>
                    {ticket.movie_title}{" "}
                    {ticket.type === "bundle" && (
                      <span className="bundle-badge">Bundle</span>
                    )}
                  </h3>
                  <span className={`status ${ticket.status}`}>
                    {ticket.status === "pending_verification"
                      ? "Menunggu Verifikasi"
                      : ticket.status === "confirmed"
                      ? "Terkonfirmasi"
                      : ticket.status}
                  </span>
                </div>

                <div className="ticket-details">
                  <div className="detail-row">
                    <span className="label">Booking Ref:</span>
                    <span className="value reference">
                      {ticket.booking_reference}
                    </span>
                  </div>
                  {ticket.seat_numbers && ticket.seat_numbers.length > 0 && (
                    <div className="detail-row">
                      <span className="label">Seats:</span>
                      <span className="value">
                        {ticket.seat_numbers.join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">
                      Rp {Number(ticket.total_amount).toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">
                      {ticket.booking_date
                        ? new Date(ticket.booking_date).toLocaleDateString(
                            "id-ID"
                          )
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="ticket-actions">
                  <button
                    onClick={() => handleViewProof(ticket)}
                    className="view-proof-btn"
                  >
                    {ticket.payment_proof ? "View Proof" : "No proof"}
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