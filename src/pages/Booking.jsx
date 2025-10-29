import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ IMPORT AUTH CONTEXT
import SeatSelector from "../components/SeatSelector";
import Navigation from "../components/Navigation";
import "./Booking.css";

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // ✅ GUNAKAN AUTH CONTEXT

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [seatRefreshTrigger, setSeatRefreshTrigger] = useState(0);

  const { movie, showtime } = location.state || {};

  // ✅ EFFECT UNTUK AUTO-FILL DATA DARI USER LOGIN
  useEffect(() => {
    console.log("🔍 Checking authentication for booking...");
    console.log("User from AuthContext:", user);
    console.log("Is Authenticated:", isAuthenticated);

    if (!isAuthenticated || !user) {
      console.log("❌ User not authenticated, redirecting to login...");
      alert("⚠️ Anda harus login terlebih dahulu untuk melakukan booking");
      navigate("/login");
      return;
    }

    // ✅ AUTO-FILL DATA CUSTOMER DARI USER YANG LOGIN
    console.log("✅ User authenticated, auto-filling customer data...");
    setCustomerInfo({
      name: user.username || user.name || "", // ✅ GUNAKAN USERNAME DARI LOGIN
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user, isAuthenticated, navigate]);

  // ✅ Function untuk menghitung total harga
  const calculateTotalPrice = () => {
    const pricePerSeat = movie?.price || 50000;
    return selectedSeats.length * pricePerSeat;
  };

  // ✅ Function untuk menentukan showtime_id berdasarkan showtime string
  const findShowtimeId = (showtime) => {
    const showtimeMap = {
      "10:00": 1,
      "13:00": 2,
      "16:00": 3,
      "19:00": 4,
      "21:30": 5,
      "18:00": 1,
      "20:30": 2,
      "21:00": 3,
    };

    const showtimeId = showtimeMap[showtime] || 1;
    console.log(
      `🎯 Mapping showtime: "${showtime}" → showtime_id: ${showtimeId}`
    );
    return showtimeId;
  };

  if (!movie) {
    return (
      <div className="booking-container">
        <Navigation />
        <div className="page-content">
          <div className="no-movie-selected">
            <h2>No movie selected</h2>
            <p>Please select a movie first to proceed with booking</p>
            <button onClick={() => navigate("/home")} className="back-home-btn">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ TAMPILAN LOADING JIKA BELUM ADA DATA USER
  if (!user || !isAuthenticated) {
    return (
      <div className="booking-container">
        <Navigation />
        <div className="page-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Memverifikasi authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSeatsChange = (seats) => {
    setSelectedSeats(seats);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // ✅ HANYA ALLOW EMAIL DAN PHONE UNTUK DIUBAH, NAME TIDAK BISA DIUBAH
    if (name !== "name") {
      setCustomerInfo((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ✅ FUNCTION UNTUK REFRESH DATA KURSI
  const refreshSeatData = async () => {
    try {
      console.log("🔄 Manually refreshing seat data...");
      const showtimeId = findShowtimeId(showtime);
      const response = await fetch(
        `https://backendflyio.vercel.app/api/bookings/occupied-seats?showtime_id=${showtimeId}&movie_title=${encodeURIComponent(
          movie.title
        )}&refresh=${Date.now()}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Refreshed occupied seats:", data.data);
        // Trigger SeatSelector untuk refresh
        setSeatRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("❌ Error refreshing seat data:", error);
    }
  };

  // HANDLE BOOKING
  const handleBooking = async () => {
    try {
      setLoading(true);

      // Refresh kursi sebelum validasi
      await refreshSeatData();

      // VALIDASI CUSTOMER & SEAT
      const errors = [];
      if (!customerInfo.name?.trim()) errors.push("Nama lengkap");
      if (!customerInfo.email?.trim()) errors.push("Email");
      if (!customerInfo.phone?.trim()) errors.push("Nomor HP");
      if (!movie?.title) errors.push("Film");
      if (!showtime) errors.push("Jam tayang");
      if (selectedSeats.length === 0) errors.push("Kursi");

      if (errors.length > 0) {
        alert(`❌ Data berikut masih kosong:\n${errors.join("\n")}`);
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        alert("❌ Format email tidak valid");
        setLoading(false);
        return;
      }

      // CEK KURSI SUDAH DIBOOKING
      const showtimeId = findShowtimeId(showtime);
      const alreadyBooked = selectedSeats.filter((seat) =>
        occupiedSeats.includes(seat.trim())
      );

      if (alreadyBooked.length > 0) {
        alert(
          `❌ Kursi ${alreadyBooked.join(
            ", "
          )} sudah dipesan. Silakan pilih kursi lain.`
        );
        setSeatRefreshTrigger((prev) => prev + 1);
        setLoading(false);
        return;
      }

      // POST BOOKING KE SERVER
      const bookingPayload = {
        showtime_id: showtimeId,
        customer_name: customerInfo.name.trim(),
        customer_email: customerInfo.email.trim(),
        customer_phone: customerInfo.phone.trim(),
        seat_numbers: selectedSeats,
        total_amount: calculateTotalPrice(),
        movie_title: movie.title,
      };

      const response = await fetch(
        "https://beckendflyio.vercel.app/api/bookings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert("❌ Gagal membuat booking: " + errorData.message);
        setLoading(false);
        return;
      }

      const bookingResult = await response.json();
      navigate("/payment", { state: { pendingBooking: bookingResult.data } });
    } catch (error) {
      console.error("❌ Booking error:", error);
      alert(`❌ Gagal mempersiapkan booking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = calculateTotalPrice();

  return (
    <div className="booking-container">
      <Navigation />

      <div className="page-content">
        <div className="booking-content">
          <h1 className="booking-title">Book Your Tickets</h1>

          {/* User Info */}
          <div className="user-login-info">
            <p>
              <strong>Anda login sebagai:</strong> {user.username}
            </p>
            <p className="name-auto-info">
              ✅ <strong>Nama telah diisi otomatis sesuai akun login</strong>
            </p>
          </div>

          {/* Refresh Button
          <div className="refresh-section">
            <button 
              onClick={refreshSeatData}
              className="refresh-seats-btn"
            >
              🔄 Refresh Seat Availability
            </button>
            <small>Klik jika kursi tidak ter-update dengan benar</small>
          </div> */}

          {/* Movie Info
          <div className="movie-info-card">
            <h2>{movie.title}</h2>
            <div className="movie-details">
              <p><strong>Genre:</strong> {movie.genre}</p>
              <p><strong>Duration:</strong> {movie.duration}</p>
              <p><strong>Showtime:</strong> {showtime}</p>
              <p><strong>Price per seat:</strong> Rp {(movie.price || 50000).toLocaleString()}</p>
            </div>
          </div> */}

          <div className="booking-grid">
            {/* Seat Selection */}
            <div className="seat-selection-section">
              <h3>Select Seats</h3>
              <SeatSelector
                onSeatsChange={handleSeatsChange}
                showtimeId={findShowtimeId(showtime)}
                movieTitle={movie.title}
                refreshTrigger={seatRefreshTrigger}
              />
            </div>

            {/* Customer Information */}
            <div className="customer-section">
              <h3>Your Information</h3>
              <div className="customer-form">
                <h3>Data Pemesan</h3>

                {/* ✅ NAMA AUTO-FILL DAN DISABLED */}
                <div className="form-group">
                  <label htmlFor="name">Nama Lengkap *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleInputChange}
                    disabled // ✅ TIDAK BISA DIUBAH
                    className="form-input disabled-input"
                    placeholder="Nama diisi otomatis dari akun login"
                    required
                  />
                  <div className="field-info">
                    ✅ Nama diambil otomatis dari username login:{" "}
                    <strong>{user.username}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Email Address *"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Nomor Telepon *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Phone Number *"
                    required
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-summary">
                <h4>Order Summary</h4>
                <div className="summary-details">
                  <div className="summary-row">
                    <span>Movie:</span>
                    <span>{movie.title}</span>
                  </div>
                  <div className="summary-row">
                    <span>Showtime:</span>
                    <span>{showtime}</span>
                  </div>
                  <div className="summary-row">
                    <span>Selected Seats:</span>
                    <span className="seats-list">
                      {selectedSeats.join(", ") || "-"}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Number of Seats:</span>
                    <span>{selectedSeats.length}</span>
                  </div>
                  <div className="summary-row total-price">
                    <span>Total Price:</span>
                    <span>Rp {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={
                    loading ||
                    selectedSeats.length === 0 ||
                    !customerInfo.email ||
                    !customerInfo.phone
                  }
                  className="confirm-booking-btn"
                >
                  {loading ? "Processing..." : `Continue to Payment`}
                </button>

                {/* <div className="debug-info">
                  <small>
                    🔍 Debug: User: {user.username} • 
                    showtime "{showtime}" → ID: {findShowtimeId(showtime)} • 
                    Movie: "{movie.title}"
                  </small>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
