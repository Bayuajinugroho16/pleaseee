import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "./Navigation";
import MovieCard from "./MovieCard";
import "./MovieDetail.css";
import Home from "../pages/Home";

const Moviedetail2 = () => { // ✅ Nama komponen: Moviedetail2
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
    // ✅ DATA 4 FILM KHUSUS UNTUK LAYAR 2
    const movies = [
      {
        id: 1,
        title: "CIAK,CIAK,CIAK!", 
        kategori: "Fiksi",
        duration: "10m",
        Asal: "IDS College Production",
        poster: "/film/4,1.png",
        detailLink: "/Moviedetail2",
        synopsis: `Being the only child in a Chinese-Indonesian family where eating together is a must, Feli was raised with an outpouring of love by her father.

However, as she grew older, differences in perspective began to clash. She eventually went through many phases at the dining table in her journey to fully understand her father.

Sebuah film yang menyentuh tentang hubungan ayah dan anak dalam keluarga Tionghoa-Indonesia, di mana meja makan menjadi saksi bisak perjalanan emosional mereka. Melalui ritual makan bersama, Feli belajar memahami kompleksitas cinta, tradisi, dan makna keluarga.`
      },
      {
        id: 2,
        title: "KUNTUL SEMANGKUNG", 
        kategori: "Pelajar",
        duration: "12m",
        Asal: "Senthir Production",
        poster: "/film/4,2.jpeg",
        detailLink: "/Moviedetail2",
        synopsis: `Kuntulan Semangkung adalah kesenian yang masih dipertahankan oleh masyarakat dusun Semangkung, Desa Mlaya, Kecamatan Punggelan Banjarnegara. Kesenian ini merupakan warisan dari nenek moyang mereka yang mengandung makna filosofis.

"Nama kuntulan itu sebenernya adalah pribahasa sesepuh dahulu bahwa kuntulan terdiri dari kata kun dan tul / kuntul kun itu tekun tul itu betul/benar"

Dokumenter ini mengungkap keindahan dan makna mendalam di balik kesenian tradisional yang hampir terlupakan, serta perjuangan masyarakat setempat dalam melestarikan warisan budaya leluhur di tengah arus modernisasi.`
      },
      {
        id: 3,
        title: "RAPED PARADISE", 
        kategori: "dokumenter ",
        duration: "15m",
        Asal: "Unofilms",
        poster: "/film/4,3.png",
        detailLink: "/Moviedetail2",
        synopsis: `Film dokumenter Raped Paradise merupakan sebuah refleksi kritis tentang wajah Bali yang kian berubah di tengah arus globalisasi pariwisata. Pulau yang dahulu dikenal sebagai "pulau surga" dengan panorama alam yang memukau serta warisan budaya dan spiritual yang luhur, kini perlahan mengalami degradasi nilai akibat komersialisasi wisata, terutama hiburan malam yang marak di kawasan Bali Selatan.

Fenomena ini tidak hanya mengubah citra Bali di mata dunia, tetapi juga melahirkan ketimpangan budaya dan sosial yang nyata antara wilayah Bali Selatan dan Bali Utara. Sebuah kritik sosial yang tajam tentang dampak pariwisata massal terhadap identitas budaya lokal.`
      },

      {
        id: 4,
        title: "THE MAJESTIC OF KENTONGAN JEMBER", 
        kategori: "Gati Jemberan",
        duration: "18m",
        Asal: "Aesthetiga Pictures",
        poster: "/film/4,4.png",
        detailLink: "/Moviedetail2",
        synopsis: `Bukan Patrol, melainkan Kentongan Jember. Patrol merupakan aktivitas yang dilakukan untuk menjaga keamanan atau ketertiban di suatu wilayah, biasa dikenal dengan istilah Patroli. Sementara itu, Kentongan adalah alat musik tradisional yang digunakan dalam kegiatan patroli tersebut.

Kentongan yang berasal dari Jember memiliki banyak keunikan dan ciri khas yang tidak ditemukan di daerah lain. Sebelum dikenal sebagai alat musik seperti sekarang, Kentongan Jember awalnya digunakan sebagai alat untuk memanggil burung dara dan sebagai pengingat sahur selama bulan Ramadhan.

Seiring berjalannya waktu, Kentongan Jember telah bertransformasi menjadi alat musik yang sering ditampilkan dalam berbagai acara, bahkan sering kali menjadi ajang kompetisi. Sebuah dokumenter tentang evolusi budaya dan kreativitas lokal yang patut dilestarikan.`
      }
    ];

    setNowShowingMovies(movies);
    
    // ✅ SET CURRENT MOVIE KE FILM PERTAMA
    if (!movieFromState) {
      setCurrentMovie(movies[0]); // Default ke film pertama
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
        showtime: currentMovie.showtimes?.[0] || "11:00",
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMovieClick = (selectedMovie) => {
    setCurrentMovie(selectedMovie);
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

        {/* Movie Detail Section - KHUSUS LAYAR 2 */}
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

            {/* Movie Info */}
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Kategori:</span>
                <span className="meta-value">{currentMovie.kategori}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration:</span>
                <span className="meta-value">{currentMovie.duration}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Asal:</span>
                <span className="meta-value Asal">
                   {currentMovie.Asal?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Showtimes
            <div className="showtimes-section">
              <h3>Available Showtimes</h3>
              <div className="showtimes-grid">
                {currentMovie.showtimes?.map((showtime, index) => (
                  <div key={index} className="showtime-chip">
                    {showtime}
                  </div>
                ))}
              </div>
            </div> */}

            {/* Synopsis */}
            <div className="synopsis-section">
              <h3>Synopsis</h3>
              <p className="synopsis-text">
                {currentMovie.synopsis}
              </p>
            </div>

            {/* Book Now Button
            <div className="detail-actions">
              <button className="book-now-large-btn" onClick={handleBookNow}>
                🎬 Book Now - Rp {currentMovie.Asal?.toLocaleString()}
              </button>
            </div> */}
          </div>
        </div>

        {/* Now Showing Section - OPSIONAL: bisa dihapus jika tidak perlu */}
        <section className="now-showing-section">
          <div className="section-header">
            <h2>🎬 Showing </h2>
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
                  <p className="now-showing-kategori">{showMovie.kategori}</p>
                  <div className="now-showing-meta">
                    <span className="now-showing-Asal"> {showMovie.Asal?.toLocaleString()}</span>
                  </div>
                  {/* <div className="now-showing-times">
                    {showMovie.showtimes?.slice(0, 2).map((time, idx) => (
                      <span key={idx} className="time-chip">
                        {time}
                      </span>
                    ))}
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Moviedetail2; // ✅ FIX: Export dengan nama yang sama