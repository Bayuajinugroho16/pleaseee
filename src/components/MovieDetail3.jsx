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
        title: "KEPADAMU DOA YANG TAK TERJAWAB", 
        kategori: "Gati Jemberan",
        duration: "15m",
        Asal: "Orens Production & SMKN 1 Cermee Bondowoso",
        poster: "/film/3,1.jpg",
        detailLink: "/Moviedetail2",
        synopsis: `Ina (17), siswi SMA yang bercita-cita menjadi guru, atas nama cinta dipaksa oleh ibunya menjaga kehormatan dihadapan keluarga kyai yang terpandang. Ia mempertaruhkan mimpinya dan harus rela menuruti kerahiman sang ibu. 

Dalam lika-liku dan luka yang terus menyertai, Ina menyingkap tabir, sebagai bentuk perlawanan terhadap kebohongan yang membungkam api kebenaran. Sebuah kisah tentang pergulatan antara tradisi, harapan keluarga, dan suara hati seorang remaja yang berusaha menemukan jati dirinya di tengah tekanan sosial yang membelenggu.`
      },
      {
        id: 2,
        title: "LAILA", 
        kategori: "Dokumenter",
        duration: "15m",
        Asal: "KALIBRASI",
        poster: "/film/3,2.png",
        detailLink: "/Moviedetail2",
        synopsis: `Kisah penyandang disabilitas yang rentan terhadap lingkungan sosial dan hanya memiliki perlindungan secara sosial dari orangtuanya. Setelah orangtua meninggal, Laila merasa putus asa sehingga keluarga besarnya memasukkannya ke panti rehabilitasi sosial sebagai solusi permasalahannya.

Bangkit dari keterpurukan sepeninggal orangtuanya, Laila tidak pernah berkunjung sekalipun ke makam orangtuanya. Kekuatan itu ada setelah Laila merasa menjadi manusia yang bermanfaat dan mandiri terlepas inklusivitas pada tubuhnya. Sebuah perjalanan emosional tentang penerimaan diri dan makna kemandirian sejati.`
      },
      {
        id: 3,
        title: "PULASARA", 
        kategori: "Fiksi",
        duration: "10m",
        Asal: "Skandium Project",
        poster: "/film/3,3.jpg",
        detailLink: "/Moviedetail2",
        synopsis: `Seorang bapak meninggal dunia dan merasakan suasana ketika pemulasaraan jenazahnya sendiri. Ia hanya bisa menyaksikan anak-anaknya yang seharusnya berduka justru sibuk berdebat.

Dari sudut pandang arwah yang tak berdaya, film ini menyoroti ironi kehidupan keluarga modern di mana ritual kematian justru menjadi panggung untuk konflik warisan dan perselisihan. Sebuah refleksi mendalam tentang makna keluarga, warisan, dan apa yang benar-benar penting ketika seseorang meninggalkan dunia fana.`
      },
      {
        id: 4,
        title: "TEMBELEK", 
        kategori: "Pelajar",
        duration: "14m",
        Asal: "SMKN-2-BAWANG",
        poster: "/film/3,4.png",
        detailLink: "/Moviedetail2",
        synopsis: `Film ini menceritakan ayam milik Sarti yang sering kali menciptakan masalah di lingkungan tetangganya, terutama di sekitar rumah Parni. Parni yang selama ini hanya menyimpan keresahannya, terhasut oleh Eni.

Video tentang kotoran ayam Sarti pun ia kirimkan ke grup ibu-ibu RT. Konflik kecil ini berkembang menjadi drama komedi yang mengungkap dinamika hubungan tetangga di perumahan. Sebuah satire ringan tentang bagaimana masalah sepele bisa memicu konflik sosial yang tak terduga di tengah kehidupan masyarakat urban.`
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