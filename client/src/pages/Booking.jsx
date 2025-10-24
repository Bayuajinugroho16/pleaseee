import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SeatSelector from '../components/SeatSelector';
import Navigation from '../components/Navigation';
import './Booking.css';

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [seatRefreshTrigger, setSeatRefreshTrigger] = useState(0);

  const { movie, showtime } = location.state || {};

  // ✅ Function untuk menghitung total harga
  const calculateTotalPrice = () => {
    const pricePerSeat = movie?.price || 50000;
    return selectedSeats.length * pricePerSeat;
  };

  // ✅ Function untuk menentukan showtime_id berdasarkan showtime string
  const findShowtimeId = (showtime) => {
    const showtimeMap = {
      '10:00': 1,
      '13:00': 2, 
      '16:00': 3,
      '19:00': 4,
      '21:00': 5,
      '18:00': 1,
      '20:30': 2,
      '21:00': 3
    };
    
    const showtimeId = showtimeMap[showtime] || 1;
    console.log(`🎯 Mapping showtime: "${showtime}" → showtime_id: ${showtimeId}`);
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
            <button 
              onClick={() => navigate('/home')}
              className="back-home-btn"
            >
              Back to Home
            </button>
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
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ FUNCTION UNTUK REFRESH DATA KURSI
  const refreshSeatData = async () => {
    try {
      console.log('🔄 Manually refreshing seat data...');
      const showtimeId = findShowtimeId(showtime);
      const response = await fetch(
        `http://localhost:5000/api/bookings/occupied-seats?showtime_id=${showtimeId}&movie_title=${encodeURIComponent(movie.title)}&refresh=${Date.now()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Refreshed occupied seats:', data.data);
        // Trigger SeatSelector untuk refresh
        setSeatRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ Error refreshing seat data:', error);
    }
  };

  const handleBooking = async () => {
    try {
      // ✅ STEP 1: REFRESH DATA KURSI SEBELUM VALIDASI
      console.log('🔄 Step 1: Refreshing seat data before validation...');
      await refreshSeatData();

      // ✅ STEP 2: VALIDASI DATA
      const errors = [];
      
      if (!customerInfo.name?.trim()) errors.push('Nama lengkap');
      if (!customerInfo.email?.trim()) errors.push('Email');
      if (!customerInfo.phone?.trim()) errors.push('Nomor HP');
      if (!movie?.title) errors.push('Film');
      if (!showtime) errors.push('Jam tayang');
      if (selectedSeats.length === 0) errors.push('Kursi');
      
      if (errors.length > 0) {
        alert(`❌ Data berikut masih kosong:\n${errors.join('\n')}`);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        alert('❌ Format email tidak valid');
        return;
      }

      // ✅ STEP 3: VALIDASI MANUAL - CEK KURSI YANG DIPILIH
      console.log('🎯 Validating selected seats:', selectedSeats);
      
      // Cek langsung ke API apakah kursi masih available
      const showtimeId = findShowtimeId(showtime);
      const checkResponse = await fetch(
        `http://localhost:5000/api/bookings/occupied-seats?showtime_id=${showtimeId}&movie_title=${encodeURIComponent(movie.title)}`
      );
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        const currentOccupiedSeats = checkData.data || [];
        
        console.log('📋 Current occupied seats from API:', currentOccupiedSeats);
        console.log('✅ Selected seats to check:', selectedSeats);
        
        // Cek jika ada kursi yang sudah terisi
        const alreadyBooked = selectedSeats.filter(seat => currentOccupiedSeats.includes(seat));
        
        if (alreadyBooked.length > 0) {
          alert(`❌ Kursi ${alreadyBooked.join(', ')} sudah dipesan oleh orang lain. Silakan pilih kursi lain.`);
          
          // Refresh SeatSelector untuk update tampilan
          setSeatRefreshTrigger(prev => prev + 1);
          return;
        }
      }

      // ✅ STEP 4: PREPARE DATA UNTUK BOOKING - PERBAIKAN DI SINI
      const bookingData = {
        showtime_id: findShowtimeId(showtime),
        seat_numbers: selectedSeats,
        customer_name: customerInfo.name.trim(),
        customer_email: customerInfo.email.trim(),
        customer_phone: customerInfo.phone.trim(),
        movie_title: movie.title,
        total_amount: calculateTotalPrice() // ✅ DIUBAH: total_price → total_amount
      };

      console.log('📦 Sending booking data to backend:', bookingData);

      setLoading(true);
      
      // ✅ STEP 5: KIRIM BOOKING REQUEST
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Booking created (PENDING):', result.data);
        
        // ✅ REDIRECT KE HALAMAN PEMBAYARAN
        navigate('/payment', { 
          state: { 
            pendingBooking: {
              ...result.data,
              showtime: showtime,
              movie_title: movie.title
            }
          } 
        });
      } else {
        throw new Error(result.message || 'Booking failed');
      }
      
    } catch (error) {
      console.error('❌ Booking error:', error);
      
      if (error.message.includes('already booked')) {
        alert('❌ Beberapa kursi sudah dipesan. Silakan pilih kursi lain.');
        // Refresh data kursi
        refreshSeatData();
      } else if (error.message.includes('HTTP 400')) {
        alert('❌ Data tidak valid. Silakan periksa kembali.');
      } else if (error.message.includes('HTTP 500')) {
        alert('❌ Server error. Silakan coba lagi.');
      } else {
        alert(`❌ Booking gagal: ${error.message}`);
      }
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
          
          {/* Refresh Button */}
          <div className="refresh-section">
            <button 
              onClick={refreshSeatData}
              className="refresh-seats-btn"
            >
              🔄 Refresh Seat Availability
            </button>
            <small>Klik jika kursi tidak ter-update dengan benar</small>
          </div>

          {/* Movie Info */}
          <div className="movie-info-card">
            <h2>{movie.title}</h2>
            <div className="movie-details">
              <p><strong>Genre:</strong> {movie.genre}</p>
              <p><strong>Duration:</strong> {movie.duration}</p>
              <p><strong>Showtime:</strong> {showtime}</p>
              <p><strong>Price per seat:</strong> Rp {(movie.price || 50000).toLocaleString()}</p>
            </div>
          </div>

          <div className="booking-grid">
            {/* Seat Selection */}
            <div className="seat-selection-section">
              <h3>Select Seats</h3>
              <SeatSelector 
                onSeatsChange={handleSeatsChange}
                showtimeId={findShowtimeId(showtime)}
                movieTitle={movie.title}
                refreshTrigger={seatRefreshTrigger} // ✅ PASS REFRESH TRIGGER
              />
            </div>

            {/* Customer Information */}
            <div className="customer-section">
              <h3>Your Information</h3>
              <div className="customer-form">
                <h3>Data Pemesan</h3>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name *"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  className={`form-input ${!customerInfo.name ? 'input-error' : ''}`}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={customerInfo.email}
                  onChange={handleInputChange}
                  className={`form-input ${!customerInfo.email ? 'input-error' : ''}`}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  value={customerInfo.phone}
                  onChange={handleInputChange}
                  className={`form-input ${!customerInfo.phone ? 'input-error' : ''}`}
                  required
                />
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
                    <span className="seats-list">{selectedSeats.join(', ') || '-'}</span>
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
                  disabled={loading || selectedSeats.length === 0 || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
                  className="confirm-booking-btn"
                >
                  {loading ? 'Processing...' : `Continue to Payment`}
                </button>

                <div className="debug-info">
                  <small>
                    🔍 Debug: showtime "{showtime}" → ID: {findShowtimeId(showtime)} • 
                    Movie: "{movie.title}"
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;