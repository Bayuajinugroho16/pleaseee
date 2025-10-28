import React, { useState, useEffect, useCallback } from 'react';
import './SeatSelector.css';

const SeatSelector = ({ onSeatsChange, showtimeId, movieTitle, refreshTrigger }) => {
  const effectiveShowtimeId = showtimeId || 1;
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layout baru: 12 rows, 15 seats per row (7 kiri + gang + 8 kanan)
  const rows = ['M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  const seatsLeftSection = 7;  // Kursi kiri
  const seatsRightSection = 8; // Kursi kanan
  const totalSeatsPerRow = seatsLeftSection + seatsRightSection;

  const fetchOccupiedSeats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯🔄 FETCHING OCCUPIED SEATS - FRONTEND');
      console.log('Params:', { showtime: effectiveShowtimeId, movie: movieTitle });
      
      const encodedMovieTitle = movieTitle ? encodeURIComponent(movieTitle.trim()) : '';
      const url = `${import.meta.env.VITE_API_URL}api/bookings/occupied-seats?showtime_id=${effectiveShowtimeId}&movie_title=${encodedMovieTitle}&_=${Date.now()}`;
      console.log('📡 URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📊🔄 API RESPONSE RECEIVED:', data);
      
      if (data.success) {
        const filteredSeats = (data.data || []).filter(seat => 
          seat !== null && seat !== undefined && seat !== ''
        );
        
        console.log('✅🔄 OCCUPIED SEATS UPDATED IN FRONTEND:', filteredSeats);
        console.log('🔢 COUNT:', filteredSeats.length);
        
        setOccupiedSeats(filteredSeats);
        
        // ✅ LOG UNTUK VERIFIKASI
        console.log('🎯 VERIFICATION - F8 in occupied seats?', filteredSeats.includes('F8'));
        console.log('🎯 VERIFICATION - A1 in occupied seats?', filteredSeats.includes('A1'));
        console.log('🎯 VERIFICATION - B2 in occupied seats?', filteredSeats.includes('B2'));
        
      } else {
        throw new Error(data.message || 'Failed to load occupied seats');
      }
    } catch (error) {
      console.error('❌🔄 Error fetching occupied seats:', error);
      setError('Gagal memuat data kursi: ' + error.message);
      setOccupiedSeats([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveShowtimeId, movieTitle]);

  // ✅ EFFECT UTAMA - LOAD DATA
  useEffect(() => {
    console.log('🔄🔴 SEATSELECTOR MOUNTED/REFRESHED');
    fetchOccupiedSeats();
  }, [fetchOccupiedSeats]);

  // ✅ EFFECT UNTUK MANUAL REFRESH
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄🔴 MANUAL REFRESH TRIGGERED');
      fetchOccupiedSeats();
    }
  }, [refreshTrigger, fetchOccupiedSeats]);

  useEffect(() => {
    // ✅ BENAR - PAKAI ENVIRONMENT VARIABLE
const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?showtime=${showtimeId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SEAT_VERIFIED') {
        // Refetch occupied seats
        fetchOccupiedSeats();
      }
    };

    return () => {
      ws.close();
    };
  }, [showtimeId]);

  const handleRetry = () => {
    console.log('🔄🔄 MANUAL RETRY CLICKED');
    fetchOccupiedSeats();
  };
  

  const handleSeatClick = (seatId) => {
    console.log('🪑 Seat clicked:', seatId);
    console.log('📋 Current occupied seats:', occupiedSeats);
    console.log('❓ Is seat occupied?', occupiedSeats.includes(seatId));
    
    if (occupiedSeats.includes(seatId)) {
      alert(`❌ Kursi ${seatId} sudah terisi! Silakan pilih kursi lain.`);
      return;
    }

    const newSelectedSeats = selectedSeats.includes(seatId)
      ? selectedSeats.filter(seat => seat !== seatId)
      : [...selectedSeats, seatId];

    setSelectedSeats(newSelectedSeats);
    onSeatsChange(newSelectedSeats);
  };

  const getSeatClass = (seatId) => {
    const isOccupied = occupiedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    
    console.log(`🎯 Seat ${seatId}: occupied=${isOccupied}, selected=${isSelected}`);
    
    if (isOccupied) {
      return 'seat occupied';
    }
    if (isSelected) {
      return 'seat selected';
    }
    return 'seat available';
  };

  if (error) {
    return (
      <div className="error-seats">
        <div className="error-icon">⚠️</div>
        <h3>Error Memuat Kursi</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={handleRetry} className="retry-button">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-seats">
        <div className="spinner"></div>
        <p>Memuat ketersediaan kursi...</p>
        <small>Film: {movieTitle}</small>
      </div>
    );
  }

  return (
    <div className="seat-selector">
      <div className="seat-selector-header">
        <h3>Pilih Kursi - {movieTitle}</h3>
        <div className="movie-filter-info">
          <p><strong>Kursi Terisi:</strong> {occupiedSeats.length} kursi</p>
          <button onClick={handleRetry} className="retry-button-small">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="cinema-screen"> LAYAR BIOSKOP </div>
      
      <div className="seat-map">
        {rows.map(row => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            
            {/* Left Section - 7 seats */}
            {Array.from({ length: seatsLeftSection }, (_, index) => {
              const seatNumber = index + 1;
              const seatId = `${row}${seatNumber}`;
              const isOccupied = occupiedSeats.includes(seatId);
              
              return (
                <div
                  key={seatId}
                  className={getSeatClass(seatId)}
                  onClick={() => !isOccupied && handleSeatClick(seatId)}
                  style={{ 
                    cursor: isOccupied ? 'not-allowed' : 'pointer'
                  }}
                >
                  {seatNumber}
                  {isOccupied && <div className="occupied-indicator">✗</div>}
                </div>
              );
            })}
            
            {/* Aisle - Gang Tengah */}
            <div className="aisle">
              <div className="aisle-space"></div>
            </div>
            
            {/* Right Section - 8 seats */}
            {Array.from({ length: seatsRightSection }, (_, index) => {
              const seatNumber = index + seatsLeftSection + 1; // Mulai dari 8
              const seatId = `${row}${seatNumber}`;
              const isOccupied = occupiedSeats.includes(seatId);
              
              return (
                <div
                  key={seatId}
                  className={getSeatClass(seatId)}
                  onClick={() => !isOccupied && handleSeatClick(seatId)}
                  style={{ 
                    cursor: isOccupied ? 'not-allowed' : 'pointer'
                  }}
                >
                  {seatNumber}
                  {isOccupied && <div className="occupied-indicator">✗</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Seat Information */}
      <div className="seat-info">
        <div className="selected-seats">
          <h4>Kursi Terpilih: {selectedSeats.length}</h4>
          <div className="seats-list">
            {selectedSeats.map(seat => (
              <span key={seat} className="seat-badge">{seat}</span>
            ))}
          </div>
        </div>
        
        {/* <div className="debug-info">
          <small>
            🔍 Film: "{movieTitle}" • 
            Terisi: {occupiedSeats.length} kursi •
            Terpilih: {selectedSeats.length} kursi
          </small>
          <br />
          <small>
            🎯 Occupied: {occupiedSeats.join(', ') || 'None'}
          </small>
        </div> */}
      </div>

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-color available-color"></div>
          <span>Tersedia</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected-color"></div>
          <span>Terpilih</span>
        </div>
        <div className="legend-item">
          <div className="legend-color occupied-color"></div>
          <span>Terisi</span>
        </div>
        <div className="legend-item">
          <div className="legend-color aisle-color"></div>
          <span>Gang</span>
        </div>
      </div>
    </div>
  );
};

export default SeatSelector;