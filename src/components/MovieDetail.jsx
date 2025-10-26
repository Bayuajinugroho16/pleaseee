import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import MovieCard from "../components/MovieCard";
import "./MovieDetail.css";
import Home from "../pages/Home";

const MovieDetail = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get movie data from navigation state or find by ID
  const movieFromState = location.state?.movie;
  const [currentMovie, setCurrentMovie] = useState(movieFromState);

  useEffect(() => {
    fetchNowShowingMovies();
  }, []);

  const fetchNowShowingMovies = async () => {
    try {
      // Simulate API call or use static data
      const movies = [
        {
          id: 1,
          title: "Sopir Angkot Menebus Asa dan Masa",
          genre: "Dokumenter, Drama", 
          duration: "1h 45m",
          price: 50000,
          rating: "8.1",
          poster: "/film/1.png",
          showtimes: ["10:00", "13:30", "17:00", "20:30"],
          synopsis: `Modernisasi telah mengubah wajah transportasi di Jember. Angkot, yang dulu menjadi urat nadi mobilitas masyarakat, kini mulai ditinggalkan. Kehadiran kendaraan pribadi dan ojek online yang dianggap lebih praktis membuat eksistensi angkot semakin terdesak.

Di tengah arus perubahan itu, hadir kisah Soekarno, seorang sopir angkot yang telah mengemudi sejak 1986. Ia menyaksikan langsung masa kejayaan angkot hingga kemerosotannya hari ini. Jika dulu penghasilan sehari bisa mencukupi kebutuhan seminggu, kini ia hanya bisa bersyukur ketika ada penumpang yang naik.

Film dokumenter ini tidak hanya menyoroti keteguhan seorang sopir untuk bertahan, tetapi juga merekam suara pengguna kendaraan pribadi dan pelanggan ojek online, yang menunjukkan alasan angkot kian tersisihkan. Dari berbagai perspektif inilah muncul refleksi: modernisasi membawa kemudahan, namun juga meninggalkan jejak kehilangan.

"Sopir Angkot: Menembus Asa & Masa" adalah potret tentang manusia, perubahan zaman, dan pertanyaan besar mampukah transportasi rakyat bertahan di era digital?`
        },
        {
          id: 2,
          title: "Jagawana", 
          genre: "Dokumenter, Lingkungan",
          duration: "1h 30m",
          price: 45000,
          rating: "8.3",
          poster: "/film/2.jpg",
          showtimes: ["11:00", "14:30", "18:00", "21:30"],
          synopsis: `Di lereng subur Gunung Muria, komunitas Peka Muria hidup berdampingan dengan alam. Mereka adalah penjaga sejati, merawat kebun kopi dan hutan lebat dengan kearifan tradisi. 

Jejak satwa liar terekam kamera trap, sementara drone mengungkap keindahan hutan pranak yang memukau. Film dokumenter ini merajut suara alam dan kerja keras komunitas, menampilkan perjuangan, cinta mendalam pada bumi, dan harapan untuk melestarikan warisan leluhur di jantung Muria.

Sebuah film yang mengajak kita merenungkan hubungan manusia dengan alam dan pentingnya menjaga keseimbangan ekosistem untuk generasi mendatang.`
        },
        {
          id: 3,
          title: "African-Indonesian Journey",
          genre: "Dokumenter, Sosial Budaya", 
          duration: "1h 20m",
          price: 48000,
          rating: "8.0",
          poster: "/film/3.PNG",
          showtimes: ["12:00", "15:30", "19:00"],
          synopsis: `Mengikuti perjalanan 4 pemuda keturunan Afrika-Indonesia yang mengeksplorasi dilema budaya mereka. Film ini mempelajari bagaimana mereka beradaptasi dengan budaya Indonesia, meskipun komunitas mereka memiliki budaya sendiri dan pengalaman diskriminasi selama tumbuh besar.

Melalui wawancara mendalam dan cuplikan kehidupan sehari-hari, film ini mengungkap perjuangan identitas, pencarian jati diri, dan upaya membangun jembatan antara dua budaya yang berbeda. Sebuah potret sensitif tentang inklusi, toleransi, dan makna menjadi bagian dari masyarakat multikultural.`
        },
        {
          id: 4,
          title: "Titip Pesan",
          genre: "Drama, Thriller", 
          duration: "1h 35m",
          price: 47000,
          rating: "8.4",
          poster: "/film/4.png",
          showtimes: ["13:00", "16:30", "20:00", "22:30"],
          synopsis: `Perjalanan Majep (28), seorang ojek online, melawan ketakutannya menyusuri jalanan asing dan hutan untuk mengantar pesanan customer wanita muda.

Awalnya hanya pesanan makanan biasa, namun berkembang menjadi misi misterius yang membawanya masuk ke dalam dunia gelap di balik layanan ojek online. Setiap tikungan jalan membawa ketegangan baru, setiap pesanan menyimpan rahasia yang tak terduga.

Di tengah malam yang sunyi, Majep harus menghadapi bukan hanya ketakutannya terhadap kegelapan, tetapi juga kebenaran mengerikan tentang identitas customer dan isi pesanan yang diantarnya. Sebuah film yang mengangkat sisi lain ekonomi digital dan harga yang harus dibayar untuk sesuap nasi.`
        },
      ];

      setNowShowingMovies(movies);
      
      // Jika tidak ada movie dari state, cari berdasarkan ID atau ambil pertama
      if (!movieFromState) {
        const movieId = parseInt(id);
        const foundMovie = movies.find(m => m.id === movieId) || movies[0];
        setCurrentMovie(foundMovie);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!currentMovie) return;
    
    navigate("/booking", {
      state: {
        movie: currentMovie,
        showtime: currentMovie.showtimes?.[0] || "18:00",
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMovieClick = (selectedMovie) => {
    setCurrentMovie(selectedMovie);
    // Scroll ke atas saat ganti movie
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tampilkan loading jika masih loading
  if (loading) {
    return (
      <div className="movie-detail-container">
        <Navigation />
        <div className="loading-movies">
          <div className="loading-spinner"></div>
          <p>Loading movie details...</p>
        </div>
      </div>
    );
  }

  // Tampilkan error jika tidak ada movie
  if (!currentMovie) {
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
              src={currentMovie.poster}
              alt={currentMovie.title}
              onError={(e) => {
                e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
              }}
            />
          </div>

          <div className="movie-detail-info">
            <h1 className="detail-title">{currentMovie.title}</h1>

            {/* Rating */}
            {currentMovie.rating && (
              <div className="detail-rating">⭐ {currentMovie.rating}/10</div>
            )}

            {/* Movie Info */}
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Genre:</span>
                <span className="meta-value">{currentMovie.genre}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration:</span>
                <span className="meta-value">{currentMovie.duration}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Price:</span>
                <span className="meta-value price">
                  Rp {currentMovie.price?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Showtimes */}
            <div className="showtimes-section">
              <h3>Available Showtimes</h3>
              <div className="showtimes-grid">
                {currentMovie.showtimes?.map((showtime, index) => (
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
                {currentMovie.synopsis}
              </p>
            </div>

            {/* Book Now Button */}
            <div className="detail-actions">
              <button className="book-now-large-btn" onClick={handleBookNow}>
                🎬 Book Now - Rp {currentMovie.price?.toLocaleString()}
              </button>
            </div>
          </div>
        </div>

        {/* Now Showing Section - 4 Movies */}
        <section className="now-showing-section">
          <div className="section-header">
            <h2>🎬 Sedang Tayang</h2>
            <p>Film-film seru lainnya yang sedang tayang</p>
          </div>

          <div className="now-showing-grid">
            {nowShowingMovies.map((showMovie) => (
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
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
                    }}
                  />
                  {showMovie.id === currentMovie.id && (
                    <div className="current-movie-badge">Now Viewing</div>
                  )}
                </div>

                <div className="now-showing-content">
                  <h4 className="now-showing-title">{showMovie.title}</h4>
                  <p className="now-showing-genre">{showMovie.genre}</p>
                  <div className="now-showing-meta">
                    <span className="now-showing-rating">⭐ {showMovie.rating}</span>
                    <span className="now-showing-price">Rp {showMovie.price?.toLocaleString()}</span>
                  </div>
                  <div className="now-showing-times">
                    {showMovie.showtimes?.slice(0, 2).map((time, idx) => (
                      <span key={idx} className="time-chip">
                        {time}
                      </span>
                    ))}
                    {showMovie.showtimes?.length > 2 && (
                      <span className="more-times">
                        +{showMovie.showtimes.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MovieDetail;