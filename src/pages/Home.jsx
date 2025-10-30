import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Set false karena langsung pakai data lokal
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ LANGSUNG PAKAI DATA LOKAL TANPA FETCH API
    setMovies(getLocalMovies());
  }, []);

  // ✅ DATA LOKAL LANGSUNG - TANPA API
  const getLocalMovies = () => [
    {
      id: 1,
      title: "Layar Kompetisi 1",

      price: 15000,
      poster: "/film/layar1.png",
      showtimes: ["19:00"],
      detailLink: "/Moviedetail",
      hari: "Sabtu",
      tanggal: "06 November 2025",
      jam: "18:00 WIB"

    },
    {
      id: 2,
      title: "Layar Kompetisi 2",
      Hari : "Senin",
      price: 15000,
      poster: "/film/layar2.png",
      showtimes: ["11:00",],
      detailLink: "/Moviedetail2", 
      tanggal: "06 November 2025",
      jam: "20:30 WIB"
    },
    {
      id: 3,
      title: "Layar Kompetisi 3",
      price: 15000,
      poster: "/film/layar3.png",
      showtimes: ["12:00", "15:30", "19:00"],
       detailLink: "/Moviedetail3",
      tanggal: "07 November 2025",
      jam: "13:30 WIB"
    },
    {
      id: 4,
      title: "Layar Kompetisi 4",
      price: 15000,
      poster: "/film/layar4.png",
      showtimes: ["13:00", "16:30", "20:00"],
       detailLink: "/Moviedetail4",
       tanggal: "07 November 2025",
      jam: "16:00 WIB" 
    }
    
  ];

  return (
    <div className="home-container">
      <Navigation />
      
      <div className="page-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1> UNEJ FILM FESTIVAL </h1>
          <p>  Powered by Wardah  </p>
          <p>Amankan Tiketmu Sekarang !! </p>
        </div>

        {/* Now Showing Section */}
        <div className="movies-section">
          <div className="section-header">
            <h2>Book Your Ticket </h2>
          </div>
          
          {/* ✅ LANGSUNG RENDER MOVIES - PASTI ADA DATA */}
          <div className="movies-grid">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;