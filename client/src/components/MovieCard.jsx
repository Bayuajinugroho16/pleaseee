import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  const handleMovieClick = () => {
    // Navigate ke movie detail page
    navigate(`/movie/${movie.id}`, { state: { movie } });
  };

  const handleBookNow = (e) => {
    e.stopPropagation(); // Prevent navigating to detail page
    navigate('/Booking', { 
      state: { 
        movie, 
        showtime: movie.showtimes?.[0] || '18:00' 
      } 
    });
  };

  return (
    <div className="movie-card" onClick={handleMovieClick}>
      <img 
        src={movie.poster} 
        alt={movie.title}
        className="movie-poster"
        onError={(e) => {
  e.target.src = '/images/placeholder-movie.jpg';
  // atau
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
}}
      />
      
      <div className="movie-content">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-info">{movie.genre} • {movie.duration}</p>
        <p className="movie-price">Rp {movie.price?.toLocaleString()}</p>
        
        {/* Rating seperti TIX ID */}
        {movie.rating && (
          <div className="movie-rating">
            ⭐ {movie.rating}
          </div>
        )}
        
        {/* Quick Book Button */}
        <div className="movie-actions">
          <button 
            className="book-now-btn"
            onClick={handleBookNow}
          >
            BOOK NOW
          </button>
          
          <button 
            className="detail-btn"
            onClick={handleMovieClick}
          >
            VIEW DETAILS
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;