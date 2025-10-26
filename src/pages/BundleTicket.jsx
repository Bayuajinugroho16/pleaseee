import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './BundleTicket.css';

const BundleTicket = () => {
  const navigate = useNavigate();

  const bundleItems = [
    {
      id: 1,
      name: "Paket Cutaway",
      description: "",
      originalPrice: 25000,
      bundlePrice: 20000,
      savings: 5000,
      image: "/film/Paket1.jpg",
      features: [
        "1 Tiket Kompetisi ",
        "2 Sticker Pack", 
        
      ],
      popular: false
    },
    {
      id: 2,
      name: "Paket Cameo",
      description: "",
      originalPrice: 27000,
      bundlePrice: 23000,
      savings: 4000,
      image: "/film/Paket2.jpg",
      features: [
        "1 tiket kompetisi ",
        "1 Keychain"
      ],
      popular: false
    },
    {
      id: 3,
      name: "Paket Opening Scene",
      description: "",
      originalPrice: 40000,
      bundlePrice: 35000,
      savings: 5000,
      image: "/film/Paket3.jpg",
      features: [
        "1 Tiket Kompetisi",
        "1 Keychain",
        " 1 Sticker Pack",
        " 1 Pin "
      ],
      popular: true
    },
    {
      id: 4,
      name: "Paket All Ticket Kompetisi",
      description: "",
      originalPrice: 60000,
      bundlePrice: 50000,
      savings: 10000,
      image: "https://via.placeholder.com/300x400/3498db/ffffff?text=PAKET+GROUP",
      features: [
        "1 tiket  kompetisi 1",
        "1 tiket  kompetisi 2",
        "1 tiket  kompetisi 3",
        "1 tiket  kompetisi 4",
       
      ],
      popular: false
    },
    {
      id: 5,
      name: "Paket Reel Team",
      description: "",
      originalPrice: 85000,
      bundlePrice: 79000,
      savings: 6000,
      image: "/film/Paket5.jpg",
      features: [
        "4 tiket kompetisi",
        "1 Sticker Pack,",
        "1 Keychain",
        "1 Pin "
      ],
      popular: true
    },
    {
      id: 6,
      name: "Paket Movie Break",
      description: "",
      originalPrice: 107000,
      bundlePrice: 100000,
      savings: 7000,
      image: "/film/Paket6.jpg",
      features: [
        "1 tiket kompetisi ",
        "1 Tumblr ",
        "2 sticker pack"
      ],
      popular: false
    },
    {
      id: 7,
      name: "Paket Main Cast",
      description: "",
      originalPrice: 150000,
      bundlePrice: 142000,
      savings: 8000,
      image: "/film/Paket7.jpg",
      features: [
        "3 tiket kompetisi",
        "1 Baju ",
        "1 Sticker Pack",
       
      ],
      popular: false
    },
    {
      id: 8,
      name: "Paket Shooting Day",
      description: "",
      originalPrice: 165000,
      bundlePrice: 155000,
      savings: 10000,
      image: "/film/Paket8.jpg",
      features: [
        "4 tiket kompetisi ",
        "1 Baju ",
        "1 Sticker Pack "
      ],
      popular: false
    },
    {
      id: 9,
      name: "The Grand Premiere",
      description: "",
      originalPrice: 285000,
      bundlePrice: 260000,
      savings: 25000,
      image: "/film/Paket9.jpg",
      features: [
        "1 tiket kompetisi",
        "All Merchandise",
      ],
      popular: false
    }
  ];

 const handleBundlePurchase = (bundle) => {
  navigate('/bundle-checkout', {
    state: {
      bundle
    }
  });
};

  const handleDetailClick = (bundle) => {
    navigate(`/bundle/${bundle.id}`, { state: { bundle } });
  };

  return (
    <div className="bundle-container">
      <Navigation />
      
      <div className="bundle-content">
        {/* Header Section */}
        <div className="bundle-header">
          <h1> BUNDLE TICKET SPECIAL</h1>
          <p>Dapatkan merchandise eksklusif dengan harga spesial!</p>
          <div className="bundle-badge">Hemat hingga 50%</div>
        </div>

        {/* Bundle Grid */}
        <div className="bundles-grid">
          {bundleItems.map(bundle => (
            <div key={bundle.id} className={`bundle-card ${bundle.popular ? 'popular' : ''}`}>
              {bundle.popular && <div className="popular-badge">🔥 POPULAR</div>}
              
              <div className="bundle-image-container">
                <img 
                  src={bundle.image} 
                  alt={bundle.name}
                  className="bundle-image"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkJ1bmRsZSBJbWFnZTwvdGV4dD4KPC9zdmc+';
                  }}
                />
                <div className="savings-badge">Hemat Rp {bundle.savings.toLocaleString()}</div>
              </div>
              
              <div className="bundle-content">
                <h3 className="bundle-title">{bundle.name}</h3>
                <p className="bundle-description">{bundle.description}</p>
                
                {/* Features List */}
                <ul className="bundle-features">
                  {bundle.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
                
                {/* Pricing */}
                <div className="bundle-pricing">
                  <div className="original-price">
                    Rp {bundle.originalPrice.toLocaleString()}
                  </div>
                  <div className="bundle-price">
                    Rp {bundle.bundlePrice.toLocaleString()}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="bundle-actions">
                  <button 
                    className="buy-now-btn"
                    onClick={() => handleBundlePurchase(bundle)}
                  >
                    BELI SEKARANG
                  </button>
                  
                  
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section
        <div className="bundle-info">
          <h3>✨ Mengapa Pilih Bundle Ticket?</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">💰</div>
              <h4>Harga Terjangkau</h4>
              <p>Dapatkan diskon khusus hingga 50% dari harga normal</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🎁</div>
              <h4>Merchandise Eksklusif</h4>
              <p>Item limited edition hanya tersedia untuk bundle</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">⚡</div>
              <h4>Proses Instan</h4>
              <p>Tiket dan merchandise langsung bisa diambil setelah pembayaran</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default BundleTicket;