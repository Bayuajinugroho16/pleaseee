import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      console.log('🔄 Fetching movies...');
      const response = await fetch('http://localhost:5000/api/movies');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 API Response:', data);
      
      // ✅ Handle different response structures
      if (data.success && Array.isArray(data.data)) {
        setMovies(data.data);
      } else if (Array.isArray(data)) {
        setMovies(data);
      } else {
        // Fallback data
        setMovies(getFallbackMovies());
      }
      
    } catch (error) {
      console.error('❌ Error fetching movies:', error);
      setError('Server not available - using demo data');
      setMovies(getFallbackMovies());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackMovies = () => [
    {
      id: 1,
      title: "AVATAR: THE WAY OF WATER",
      genre: "Adventure, Sci-Fi",
      duration: "3h 12m",
      price: 55000,
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

  if (loading) {
    return (
      <div className="home-container">
        <Navigation />
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading movies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Navigation />
      
      <div className="page-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1> UNEJ FILM FESTIVAL </h1>
          <p>Amankan Tiketmu Sekarang ! </p>
          {error && (
            <div className="warning-banner">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Now Showing Section */}
        <div className="movies-section">
          <div className="section-header">
            <h2>Book Your Ticket </h2>
          </div>
          
          {movies.length > 0 ? (
            <div className="movies-grid">
              {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="no-movies">
              <h3>No Movies Available</h3>
              <p>There are currently no movies showing. Please check back later.</p>
              <button onClick={fetchMovies} className="refresh-btn">
                Refresh Movies
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;