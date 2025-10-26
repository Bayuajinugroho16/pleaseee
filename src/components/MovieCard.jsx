import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./MovieCard.css";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  const handleBookNow = (e) => {
    e.stopPropagation();
    navigate("/Booking", {
      state: {
        movie,
        showtime: movie.showtimes?.[0] || "18:00",
      },
    });
  };

  const handleBundlePackage = (e) => {
    e.stopPropagation();
    navigate("/Bundle", {
      state: {
        movie,
        bundleOptions: movie.bundles || [
          {
            name: "Combo Family",
            description: "2 tiket + 2 popcorn + 2 minuman",
            price: 150000,
            savings: 25000,
          },
          {
            name: "Combo Couple",
            description: "2 tiket + 1 popcorn besar + 2 minuman",
            price: 120000,
            savings: 15000,
          },
        ],
      },
    });
  };

  return (
    <div className="movie-card">
      <img
        src={movie.poster}
        alt={movie.title}
        className="movie-poster"
        onError={(e) => {
          e.target.src =
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
        }}
      />

      <div className="movie-content">
        <h3 className="movie-title">{movie.title}</h3>
        {/* ✅ TAMPILAN HARI, TANGGAL, JAM SEPERTI DI GAMBAR */}
        <div className="movie-schedule-home">
          <span className="schedule-text">
            {movie.tanggal} | {movie.jam}
          </span>
        </div>
        <p className="movie-price">Rp {movie.price?.toLocaleString()}</p>

        {movie.rating && <div className="movie-rating">⭐ {movie.rating}</div>}

        <div className="movie-actions">
          <button className="book-now-btn" onClick={handleBookNow}>
            BOOK NOW
          </button>


          {/* ✅ GUNAKAN LINK UNTUK VIEW DETAILS */}
          <Link to={movie.detailLink} className="detail-btn">
            VIEW DETAILS
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
