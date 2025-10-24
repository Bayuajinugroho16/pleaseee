import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import MovieCard from '../components/MovieCard';
import './MovieDetail.css';
import Home from '../pages/Home';

const MovieDetail = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get movie data from navigation state
  const movie = location.state?.movie;

  useEffect(() => {
    fetchNowShowingMovies();
  }, []);

  const fetchNowShowingMovies = async () => {
    try {
      // Simulate API call or use static data
      const movies = [
        {
          id: 1,
          title: "AVATAR: THE WAY OF WATER",
          genre: "Adventure, Sci-Fi",
          duration: "3h 12m",
          price: 50000,
          rating: "8.1",
          poster: "https://via.placeholder.com/300x400/007bff/ffffff?text=AVATAR",
          showtimes: ["10:00", "13:30", "17:00", "20:30"]
        },
        {
          id: 2,
          title: "BLACK PANTHER: WAKANDA FOREVER",
          genre: "Action, Adventure",
          duration: "2h 41m",
          price: 45000,
          rating: "7.8",
          poster: "https://via.placeholder.com/300x400/28a745/ffffff?text=PANTHER",
          showtimes: ["11:00", "14:30", "18:00", "21:30"]
        },
        {
          id: 3,
          title: "SPIDER-MAN: NO WAY HOME",
          genre: "Action, Adventure",
          duration: "2h 28m",
          price: 48000,
          rating: "8.5",
          poster: "https://via.placeholder.com/300x400/dc3545/ffffff?text=SPIDERMAN",
          showtimes: ["12:00", "15:30", "19:00"]
        },
        {
          id: 4,
          title: "THE BATMAN",
          genre: "Action, Crime",
          duration: "2h 56m",
          price: 47000,
          rating: "8.2",
          poster: "https://via.placeholder.com/300x400/6f42c1/ffffff?text=BATMAN",
          showtimes: ["13:00", "16:30", "20:00"]
        }
      ];
      
      setNowShowingMovies(movies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigate('/booking', { 
      state: { 
        movie, 
        showtime: movie.showtimes?.[0] || '18:00' 
      } 
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMovieClick = (selectedMovie) => {
    navigate(`/movie/${selectedMovie.id}`, { state: { movie: selectedMovie } });
  };

  if (!movie) {
    return (
      <div className="movie-detail-container">
        <Navigation />
        <div className="error-page">
          <h2>Movie Not Found</h2>
          <p>The movie you're looking for doesn't exist.</p>
          <button onClick={handleBack} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-detail-container">
      <Navigation />
      
      <div className="movie-detail-content">
        {/* Back Button */}
        <button onClick={handleBack} className="back-button">
          ← Back to Movies
        </button>

        {/* Movie Detail Section */}
        <div className="movie-detail-card">
          <div className="movie-detail-poster">
            <img 
              src={movie.poster} 
              alt={movie.title}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>

          <div className="movie-detail-info">
            <h1 className="detail-title">{movie.title}</h1>
            
            {/* Rating */}
            {movie.rating && (
              <div className="detail-rating">
                ⭐ {movie.rating}/10
              </div>
            )}

            {/* Movie Info */}
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Genre:</span>
                <span className="meta-value">{movie.genre}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration:</span>
                <span className="meta-value">{movie.duration}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Price:</span>
                <span className="meta-value price">Rp {movie.price?.toLocaleString()}</span>
              </div>
            </div>

            {/* Showtimes */}
            <div className="showtimes-section">
              <h3>Available Showtimes</h3>
              <div className="showtimes-grid">
                {movie.showtimes?.map((showtime, index) => (
                  <div key={index} className="showtime-chip">
                    {showtime}
                  </div>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="synopsis-section">
              <h3>Synopsis</h3>
              <p className="synopsis-text">
                {movie.synopsis || `Experience the epic adventure of ${movie.title}. This blockbuster film offers stunning visuals, compelling storytelling, and unforgettable characters. Don't miss the chance to see it on the big screen!`}
              </p>
            </div>

          </div>
        </div>

        {/* Now Showing Section - 4 Movies */}
        <section className="now-showing-section">
          <div className="section-header">
            <h2>🎬 Sedang Tayang</h2>
            <p>Film-film seru lainnya yang sedang tayang</p>
          </div>

          {loading ? (
            <div className="loading-movies">
              <div className="loading-spinner"></div>
              <p>Loading movies...</p>
            </div>
          ) : (
            <div className="now-showing-grid">
              {nowShowingMovies.map(showMovie => (
                <div 
                  key={showMovie.id} 
                  className="now-showing-card"
                  onClick={() => handleMovieClick(showMovie)}
                >
                  <div className="now-showing-poster">
                    <img 
                      src={showMovie.poster} 
                      alt={showMovie.title}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                    {showMovie.id === movie.id && (
                      <div className="current-movie-badge">Now Viewing</div>
                    )}
                  </div>
                  
                  <div className="now-showing-content">
                    <h4 className="now-showing-title">{showMovie.title}</h4>
                    <p className="now-showing-genre">{showMovie.genre}</p>
                    <div className="now-showing-meta">
                    </div>
                    <div className="now-showing-times">
                      {showMovie.showtimes?.slice(0, 2).map((time, idx) => (
                        <span key={idx} className="time-chip">{time}</span>
                      ))}
                      {showMovie.showtimes?.length >  (
                        <span className="more-times">+{showMovie.showtimes.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default MovieDetail;