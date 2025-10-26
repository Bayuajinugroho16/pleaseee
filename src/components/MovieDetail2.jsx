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
        title: "Curhatan Revi Siterusah", 
        kategori: "Fiksi Umum",
        duration: " 19m ",
        Asal: "Innerlight Creations",
        poster: "/film/2,1.png",
        showtimes: ["11:00"],
        detailLink: "/Moviedetail2",
        synopsis: `Di negeri yang persyaratan kerjanya tak masuk akal, Revi (20) seorang mahasiswa sungkan yang terdesak oleh kebutuhan hidup menerima pekerjaan sebagai editor. 

Namun perjalanannya tidak semudah yang dibayangkan. Revi harus berhadapan dengan permintaan ambigu dan tuntutan yang tidak masuk akal dari kliennya. Di tengah tekanan ekonomi dan tuntutan akademis, ia harus menemukan cara untuk bertahan sambil menjaga integritas dan kesehatan mentalnya.

Film ini mengangkat realitas keras dunia kerja freelance yang dihadapi generasi muda, menggambarkan perjuangan antara kebutuhan hidup dan prinsip diri dalam sistem yang seringkali tidak adil. Sebuah potret menyentuh tentang ketahanan manusia di tengah sistem yang rumit.`
      },
      {
        id: 2,
        title: "Left Hook from Yogyakarta", 
        kategori: " Dokumenter ",
        duration: " 15m ",
        Asal: "Universitas Muhammadiyah Yogyakarta",
        poster: "/film/2,2.png",
        showtimes: ["11:00"],
        detailLink: "/Moviedetail2",
        synopsis: `Yogyakarta yang dikenal sebagai kota pelajar hingga saat ini masih kesulitan dalam menanggulangi kekerasan dan kejahatan jalanan yang kerap dilakukan oleh para pemudanya. Di tengah permasalahan sosial yang tak kunjung usai ini, tumbuh komunitas kecil bernama Fight Club YK yang memiliki sub komunitas bernama Fight Club YK Camp.

Komunitas ini tumbuh menjadi lebih dari sekadar klub bela diri. Didirikan oleh sekelompok anak muda yang resah dengan kejahatan dan kekerasan jalanan, mereka menggunakan ring tinju sebagai medium untuk meredam masalah sosial ini. Sebuah dokumenter tentang transformasi energi negatif menjadi kekuatan positif melalui olahraga.`
      },
      {
        id: 3,
        title: "Serada", 
        kategori: "Pelajar",
        duration: " 7m ",
        Asal: "SMKN 1 Karanggayam Kebumen",
        poster: "/film/2,3.png",
        showtimes: ["11:00"],
        detailLink: "/Moviedetail2",
        synopsis: `Logandu, merupakan salah satu Desa di Kec. Karanggayam Kab. Kebumen Prov. Jawa Tengah. Di berbagai daerah terdapat adat istiadat yang bisa disebut sabanan yang berasal dari kata serada, salah satunya di desa Logandu.

Di desa Logandu, adat serada biasanya melakukan bersih-bersih makam untuk menyambut bulan suci Ramadhan dan wujud penghormatan terhadap leluhur sekaligus perwujudan bakti anak cucu kepada orang tua. Setelah bersih-bersih makam, warga desa Logandu dibagi menjadi dua tempat untuk melakukan kendurenan di rumah pak kepala desa dan pak kepala dusun.

Namun sebagian warga tertentu ada yang melakukan sendiri di rumahnya. Biasanya warga Logandu menyebutnya kendurenan untuk unggah-unggahan atau diangkatnya ruh leluhur. Setelah 22 hari berpuasa dilakukan kenduren lagi yang disebut kenduren likuran (udun udunan). Hal ini tentunya wujud dari kekompakan para warga untuk melakukan gotong-royong.`
      },
      {
        id: 4,
        title: "Tanah & Ikat", 
        kategori: "Gati Jemberan",
        duration: " 10m ",
        Asal: "Pintu Project X Jawara Film",
        poster: "/film/2,4.jpg",
        showtimes: ["11:00"],
        detailLink: "/Moviedetail2",
        synopsis: `Seorang pria dari luar kota datang ke desa untuk melamar kekasihnya. Lamaran itu diterima dengan syarat ia harus tinggal di rumah adat yang telah disediakan sebagai bagian dari tradisi pernikahan. 

Awalnya, pria itu merasa ragu karena rumah kayu itu tampak asing dan tak meyakinkan baginya. Ia sempat mengusulkan untuk tinggal sementara lalu pindah ke kota, namun ditolak oleh pasangannya yang ingin tetap di desa. 

Saat memeriksa rumah lebih lanjut, pria itu menemukan banyak keunggulan tersembunyi dari struktur kokoh, pencahayaan alami, hingga kehangatan desain ruang tanpa sekat. Ia akhirnya menerima syarat tersebut, mengisi rumah dengan perabotan, dan menikah. 

Bertahun-tahun kemudian, ia terlihat duduk di teras sebagai seorang kakek, tersenyum melihat cucu-cucunya bermain, mengenang keputusannya yang dulu. Sebuah kisah tentang cinta, tradisi, dan makna sebenarnya dari sebuah rumah.`
      }
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
            <h2>🎬 Showing</h2>
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