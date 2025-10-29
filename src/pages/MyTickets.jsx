import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./MyTickets.css";

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ EMERGENCY: Get tickets from localStorage
  const getEmergencyTickets = () => {
    try {
      // Cari dari emergency payments
      const emergencyPayments = JSON.parse(
        localStorage.getItem("emergency_payments") || "[]"
      );
      const userTickets = emergencyPayments.filter(
        (payment) =>
          // Jika ada username di payment data, atau ambil semua
          !payment.username || payment.username === user?.username
      );

      console.log("🆘 EMERGENCY TICKETS:", userTickets);
      return userTickets.map((payment) => ({
        id: `emergency_${payment.booking_reference}`,
        booking_reference: payment.booking_reference,
        movie_title: payment.movie_title || "Movie (Emergency)",
        seat_numbers: payment.seat_numbers || ["A1"],
        total_amount: payment.total_amount || 0,
        status: "confirmed",
        payment_proof: payment.payment_proof || payment.payment_url,
        payment_filename: payment.payment_filename,
        booking_date: payment.saved_at || payment.booking_date,
        is_emergency: true,
      }));
    } catch (error) {
      console.error("❌ Emergency tickets error:", error);
      return [];
    }
  };

  // ✅ EMERGENCY: Create mock ticket from recent booking
  const createMockTicketFromBooking = () => {
    try {
      const recentBooking = JSON.parse(
        localStorage.getItem("recent_booking") || "null"
      );
      if (recentBooking) {
        return [
          {
            id: `mock_${recentBooking.booking_reference}`,
            booking_reference: recentBooking.booking_reference,
            movie_title: recentBooking.movie_title || "Recent Movie",
            seat_numbers: recentBooking.seat_numbers || ["A1"],
            total_amount: recentBooking.total_amount || 0,
            status: "confirmed",
            booking_date: recentBooking.saved_at || new Date().toISOString(),
            is_mock: true,
          },
        ];
      }
    } catch (error) {
      console.error("❌ Mock ticket error:", error);
    }
    return [];
  };

  // ✅ FIXED: Fetch tickets dengan error handling yang better
  const fetchTickets = async () => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    try {
      console.log(`🎫 Fetching tickets for username: ${user.username}`);

      let serverTickets = [];

      // ✅ COBA DARI SERVER DULU
      try {
        const response = await fetch(
          `https://beckendflyio.vercel.app/api/bookings/my-bookings?username=${user.username}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log("✅ Server tickets:", result.data);
            serverTickets = result.data;
          }
        }
      } catch (serverError) {
        console.log(
          "⚠️ Server fetch failed, using emergency data:",
          serverError.message
        );
      }

      // ✅ JIKA SERVER ERROR ATAU TIDAK ADA DATA, GUNAKAN EMERGENCY DATA
      const emergencyTickets = getEmergencyTickets();
      const mockTickets = createMockTicketFromBooking();

      const allTickets = [
        ...serverTickets,
        ...emergencyTickets,
        ...mockTickets,
      ];

      console.log(
        "📊 All tickets for user:",
        user.username,
        "Total:",
        allTickets.length
      );
      console.log("🔍 USER TICKETS BREAKDOWN:", allTickets);

      setTickets(allTickets);
    } catch (error) {
      console.error("❌ Fetch tickets error:", error);
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  // ✅ FIXED: Remove problematic event listener yang menyebabkan "Illegal constructor"
  // Hapus useEffect untuk storage event listener jika tidak diperlukan

  // ✅ Handle View Ticket
  const handleViewTicket = (ticket) => {
    console.log("🎫 Viewing ticket:", ticket);

    // Navigate ke ticket detail page atau show modal
    if (ticket.is_emergency || ticket.is_mock) {
      // Untuk emergency tickets, tampilkan alert dengan info
      alert(
        `Emergency Ticket\nBooking Ref: ${ticket.booking_reference}\nMovie: ${ticket.movie_title}\nPlease contact admin for full ticket details.`
      );
    } else {
      // Untuk regular tickets, navigate ke ticket page
      // navigate(`/ticket/${ticket.booking_reference}`);
      alert(
        `Ticket: ${ticket.movie_title}\nSeats: ${ticket.seat_numbers?.join(
          ", "
        )}`
      );
    }
  };

  // ✅ Handle Recovery
  const handleRecovery = (ticket) => {
    try {
      // Simpan data untuk recovery
      localStorage.setItem("recovery_ticket", JSON.stringify(ticket));

      // Buat text untuk copy
      const recoveryText = `
TICKET RECOVERY DATA
Booking Reference: ${ticket.booking_reference}
Movie: ${ticket.movie_title}
Seats: ${ticket.seat_numbers?.join(", ")}
Amount: Rp ${ticket.total_amount?.toLocaleString()}
Status: ${ticket.status}
Contact admin with this information.
      `.trim();

      // Copy ke clipboard
      navigator.clipboard
        .writeText(recoveryText)
        .then(() => {
          alert(
            "✅ Ticket data copied to clipboard! Contact admin with this information."
          );
        })
        .catch(() => {
          alert(
            "✅ Ticket data saved for recovery. Contact admin with booking reference: " +
              ticket.booking_reference
          );
        });
    } catch (error) {
      console.error("❌ Recovery error:", error);
      alert("Recovery failed: " + error.message);
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

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* ✅ EMERGENCY WARNING */}
        {tickets.some((ticket) => ticket.is_emergency || ticket.is_mock) &&
          tickets.length > 0 && (
            <div className="emergency-warning-banner">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <strong>Emergency Mode Active</strong>
                <p>
                  Some tickets are loaded from local storage. Server connection
                  issues detected.
                </p>
              </div>
            </div>
          )}

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
                  <h3>{ticket.movie_title}</h3>
                  <span
                    className={`status-badge ${ticket.status} ${
                      ticket.is_emergency ? "emergency" : ""
                    } ${ticket.is_mock ? "mock" : ""}`}
                  >
                    {ticket.status === "pending_verification"
                      ? "Menunggu Verifikasi"
                      : ticket.status === "confirmed"
                      ? "Terkonfirmasi"
                      : ticket.status}
                    {(ticket.is_emergency || ticket.is_mock) && " ⚠️"}
                  </span>
                </div>

                <div className="ticket-details">
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`value status ${ticket.status}`}>
                      {ticket.status === "pending_verification"
                        ? "Menunggu Verifikasi Admin"
                        : ticket.status === "confirmed"
                        ? "✅ Terkonfirmasi"
                        : ticket.status === "pending"
                        ? "⏳ Menunggu Pembayaran"
                        : ticket.status}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Booking Ref:</span>
                    <span className="value reference">
                      {ticket.booking_reference}
                    </span>
                  </div>

                  {/* ✅ TAMBAHKAN VERIFICATION CODE DI SINI */}
                  {ticket.verification_code && (
                    <div className="detail-row verification-code-row">
                      <span className="label">Verification Code:</span>
                      <span className="value verification-code">
                        {ticket.verification_code}
                      </span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Seats:</span>
                    <span className="value seats">
                      {Array.isArray(ticket.seat_numbers)
                        ? ticket.seat_numbers.join(", ")
                        : ticket.seat_numbers || "Not specified"}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value amount">
                      Rp {ticket.total_amount?.toLocaleString() || "0"}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Booking Date:</span>
                    <span className="value">
                      {ticket.booking_date
                        ? new Date(ticket.booking_date).toLocaleDateString(
                            "id-ID"
                          )
                        : "Unknown date"}
                    </span>
                  </div>
                </div>

                {/* ✅ TAMPILKAN PAYMENT PROOF JIKA ADA */}
                {ticket.payment_proof && (
                  <div className="payment-proof-section">
                    <h4>Payment Proof:</h4>
                    <img
                      src={ticket.payment_proof}
                      alt="Payment Proof"
                      className="payment-proof-image"
                      onError={(e) => {
                        console.log("❌ Payment proof image failed to load");
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="ticket-actions">
                  <button
                    onClick={() => handleViewTicket(ticket)}
                    className="view-ticket-btn"
                  >
                    View Ticket
                  </button>

                  {(ticket.is_emergency || ticket.is_mock) && (
                    <button
                      onClick={() => handleRecovery(ticket)}
                      className="recovery-btn"
                    >
                      Save for Recovery
                    </button>
                  )}
                </div>

                {/* ✅ TAMPILKAN EMERGENCY NOTE */}
                {(ticket.is_emergency || ticket.is_mock) && (
                  <div className="emergency-note">
                    <small>
                      ⚠️ This ticket was saved locally due to server issues
                    </small>
                  </div>
                )}

                {/* ✅ TAMPILKAN INSTRUKSI UNTUK ADMIN VERIFICATION */}
                {ticket.status === "pending_verification" && (
                  <div className="verification-instruction">
                    <small>
                      🎫 <strong>Untuk Admin:</strong> Gunakan kode verifikasi
                      di atas untuk validasi tiket
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ✅ EMERGENCY INSTRUCTIONS */}
        <div className="emergency-info">
          <h4>⚠️ Server Connection Issues</h4>
          <p>If your tickets are not showing correctly:</p>
          <ul>
            <li>Recent bookings are saved locally in your browser</li>
            <li>Use "Save for Recovery" to backup ticket data</li>
            <li>Contact support with your booking reference if needed</li>
            <li>Try refreshing the page to reconnect to server</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
