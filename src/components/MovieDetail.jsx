import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "./Navigation";
import MovieCard from "./MovieCard";
import "./MovieDetail.css";
import Home from "../pages/Home";

const Moviedetail2 = () => {
  // ✅ Nama komponen: Moviedetail2
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
          title: "Sopir Angkot Menembus Asa dan Masa",
          kategori: "Gati Jemberan",
          duration: "10m",
          Asal: "Nirmala Production",
          poster: "/film/1.png",
          detailLink: "/Moviedetail2",
          synopsis: `Modernisasi telah mengubah wajah transportasi di Jember. Angkot, yang dulu menjadi urat nadi mobilitas masyarakat, kini mulai ditinggalkan. Kehadiran kendaraan pribadi dan ojek online yang dianggap lebih praktis membuat eksistensi angkot semakin terdesak. 

Di tengah arus perubahan itu, hadir kisah Soekarno, seorang sopir angkot yang telah mengemudi sejak 1986. Ia menyaksikan langsung masa kejayaan angkot hingga kemerosotannya hari ini. Jika dulu penghasilan sehari bisa mencukupi kebutuhan seminggu, kini ia hanya bisa bersyukur ketika ada penumpang yang naik.

Film dokumenter ini tidak hanya menyoroti keteguhan seorang sopir untuk bertahan, tetapi juga merekam suara pengguna kendaraan pribadi dan pelanggan ojek online, yang menunjukkan alasan angkot kian tersisihkan. Dari berbagai perspektif inilah muncul refleksi: modernisasi membawa kemudahan, namun juga meninggalkan jejak kehilangan.

“Sopir Angkot: Menembus Asa & Masa” adalah potret tentang manusia, perubahan zaman, dan pertanyaan besar mampukah transportasi rakyat bertahan di era digital?`,
        },
        {
          id: 2,
          title: "Jagawana",
          kategori: "Pelajar",
          duration: "8m",
          Asal: "Skrinova",
          poster: "/film/2.jpg",
          detailLink: "/Moviedetail2",
          synopsis: `Di lereng subur Gunung Muria, komunitas Peka Muria hidup berdampingan dengan alam. Mereka adalah penjaga sejati, merawat kebun kopi dan hutan lebat dengan kearifan tradisi. Jejak satwa liar terekam kamera trap, sementara drone mengungkap keindahan hutan pranak yang memukau. 

Film dokumenter ini merajut suara alam dan kerja keras komunitas, menampilkan perjuangan, cinta mendalam pada bumi, dan harapan untuk melestarikan warisan leluhur di jantung Muria.`,
        },
        {
          id: 3,
          title: "African Roots: The Hearts of Little Blacksheep",
          kategori: "Dokumenter",
          duration: "17m",
          Asal: "Piring Kotor Production",
          poster: "/film/3.PNG",
          detailLink: "/Moviedetail2",
          synopsis: `Sebuah dokumenter yang mewawancarai empat anak muda keturunan Afrika–Indonesia dan mengeksplorasi dilema budaya yang mereka alami. Dokumenter ini melihat bagaimana mereka beradaptasi dengan budaya Indonesia, meskipun komunitas mereka memiliki budaya sendiri dan pengalaman diskriminasi selama mereka tumbuh besar.`,
        },
        {
          id: 4,
          title: "Titip Pesan",
          kategori: "Fiksi Umum",
          duration: "15m",
          Asal: "BYFILMS",
          poster: "/film/4.png",
          detailLink: "/Moviedetail2",
          synopsis: `Perjalanan Majep (28), seorang ojek online, melawan ketakutannya menyusuri jalanan asing dan hutan untuk mengantar pesanan customer wanita muda. Hingga ia sampai di sebuah makam tanpa nama milik janin hasil aborsi customer dan meninggalkan pesanan berisi kue ulang tahun dan surat penyesalan.`,
        },
      ];

      setNowShowingMovies(movies);

      // ✅ SET CURRENT MOVIE KE FILM PERTAMA (CURHATAN)
      if (!movieFromState) {
        setCurrentMovie(movies[0]); // Default ke film pertama (Curhatan)
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                e.target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
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
              <p className="synopsis-text">{currentMovie.synopsis}</p>
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
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";
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
                    <span className="now-showing-Asal">
                      {" "}
                      {showMovie.Asal?.toLocaleString()}
                    </span>
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
