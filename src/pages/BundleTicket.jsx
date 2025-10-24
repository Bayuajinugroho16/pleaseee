import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './BundleTicket.css';

const BundleTicket = () => {
  const navigate = useNavigate();

  const bundleItems = [
    {
      id: 1,
      name: "Paket Basic",
      description: "1 Tiket Kompetisi + 1 Gantungan Kunci + 1 Stiker Pack + 1 Pin",
      originalPrice: 50000,
      bundlePrice: 35000,
      savings: 15000,
      image: "https://via.placeholder.com/300x400/6f42c1/ffffff?text=PAKET+BASIC",
      features: [
        "1 tiket kompetisi film",
        "1 gantungan kunci eksklusif", 
        "1 pack stiker desain unik",
        "1 pin koleksi festival"
      ],
      popular: false
    },
    {
      id: 2,
      name: "Paket Simple",
      description: "1 Tiket Kompetisi + 1 Gantungan Kunci",
      originalPrice: 40000,
      bundlePrice: 25000,
      savings: 15000,
      image: "https://via.placeholder.com/300x400/00b894/ffffff?text=PAKET+SIMPLE",
      features: [
        "1 tiket kompetisi film",
        "1 gantungan kunci eksklusif"
      ],
      popular: false
    },
    {
      id: 3,
      name: "Paket Ultimate All Merch",
      description: "1 Tiket Kompetisi + All Merchandise",
      originalPrice: 300000,
      bundlePrice: 250000,
      savings: 50000,
      image: "https://via.placeholder.com/300x400/ff6b6b/ffffff?text=PAKET+ULTIMATE",
      features: [
        "1 tiket kompetisi premium",
        "Semua merchandise available",
        "Item limited edition lengkap"
      ],
      popular: true
    },
    {
      id: 4,
      name: "Paket Group 4 Tiket",
      description: "4 Tiket Kompetisi",
      originalPrice: 80000,
      bundlePrice: 50000,
      savings: 30000,
      image: "https://via.placeholder.com/300x400/3498db/ffffff?text=PAKET+GROUP",
      features: [
        "4 tiket kompetisi film",
        "Hemat untuk kelompok",
        "Harga spesial group"
      ],
      popular: false
    },
    {
      id: 5,
      name: "Paket Family",
      description: "4 Tiket Kompetisi + 1 Baju + 1 Sticker Pack",
      originalPrice: 200000,
      bundlePrice: 150000,
      savings: 50000,
      image: "https://via.placeholder.com/300x400/e74c3c/ffffff?text=PAKET+FAMILY",
      features: [
        "4 tiket kompetisi",
        "1 baju eksklusif festival",
        "1 pack stiker lengkap"
      ],
      popular: true
    },
    {
      id: 6,
      name: "Paket Combo Special",
      description: "2 Tiket Kompetisi + 1 Tiket Kompetisi + 1 Baju + 1 Sticker Pack",
      originalPrice: 150000,
      bundlePrice: 125000,
      savings: 25000,
      image: "https://via.placeholder.com/300x400/9b59b6/ffffff?text=PAKET+COMBO",
      features: [
        "3 tiket kompetisi (2+1)",
        "1 baju eksklusif",
        "1 pack stiker desain unik"
      ],
      popular: false
    },
    {
      id: 7,
      name: "Paket Merch Deluxe",
      description: "4 Tiket Kompetisi + 1 Sticker Pack + 1 Gantungan Kunci + 1 Pin",
      originalPrice: 100000,
      bundlePrice: 75000,
      savings: 25000,
      image: "https://via.placeholder.com/300x400/f39c12/ffffff?text=PAKET+DELUXE",
      features: [
        "4 tiket kompetisi",
        "1 pack stiker",
        "1 gantungan kunci",
        "1 pin eksklusif"
      ],
      popular: false
    },
    {
      id: 8,
      name: "Paket Premium",
      description: "1 Tiket Kompetisi + 1 Tumbler + 1 Gantungan Kunci",
      originalPrice: 120000,
      bundlePrice: 100000,
      savings: 20000,
      image: "https://via.placeholder.com/300x400/1abc9c/ffffff?text=PAKET+PREMIUM",
      features: [
        "1 tiket kompetisi premium",
        "1 tumbler eksklusif",
        "1 gantungan kunci"
      ],
      popular: false
    },
    {
      id: 9,
      name: "Paket Sticker Lover",
      description: "1 Tiket Kompetisi + 2 Sticker Pack",
      originalPrice: 30000,
      bundlePrice: 20000,
      savings: 10000,
      image: "https://via.placeholder.com/300x400/34495e/ffffff?text=PAKET+STICKER",
      features: [
        "1 tiket kompetisi",
        "2 pack stiker berbeda",
        "Koleksi stiker lengkap"
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
                  
                  <button 
                    className="detail-bundle-btn"
                    onClick={() => handleDetailClick(bundle)}
                  >
                    LIHAT DETAIL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
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
        </div>
      </div>
    </div>
  );
};

export default BundleTicket;