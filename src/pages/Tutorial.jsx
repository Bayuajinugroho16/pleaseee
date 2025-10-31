import React from 'react';
import Navigation from '../components/Navigation';
import './Tutorial.css';

const Tutorial = () => {
  const tutorialLinks = [
    {
      id: 1,
      title: "Tutorial Pemesanan Tiker Layar Kompetisi",
      description: "Video panduan pesan tiket layar kompetisi",
      driveLink: "https://drive.google.com/drive/folders/1bLcX3TqdZ3TwexaQzSeVuaccYSpz3pcJ?usp=sharing",
      type: "video"
    },
    {
      id: 2,
      title: " Tutorial Beli Ticket ",
      description: "File dokumentasi struktur database dan query",
      driveLink: "https://drive.google.com/file/d/your-file-id-2/view",
      type: "document"
    },
  ];

  const handleLinkClick = (link) => {
    console.log('Opening:', link.title, link.driveLink);
    // Buka link di tab baru
    window.open(link.driveLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tutorial-container">
      <Navigation />
      
      <div className="tutorial-content">
        <div className="tutorial-header">
          <h1>📚 Tutorial & Resources</h1>
          <p>Kumpulan tutorial, dokumentasi, dan resources untuk project bioskop</p>
        </div>

        <div className="tutorial-grid">
          {tutorialLinks.map(link => (
            <div 
              key={link.id} 
              className="tutorial-card"
              onClick={() => handleLinkClick(link)}
            >
              <div className="card-icon">
                {link.type === 'video' && '📹'}
                {link.type === 'document' && '📖'}
                {link.type === 'design' && '🎨'}
                {link.type === 'api' && '🔧'}
                {link.type === 'guide' && '📱'}
                {link.type === 'deployment' && '🚀'}
              </div>
              <div className="card-content">
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <div className="card-footer">
                  <span className="link-type">{link.type}</span>
                  <span className="open-link">Buka →</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="tutorial-info">
          <h3>💡 Informasi</h3>
          <p>
            Semua resources disimpan di Google Drive. Klik pada card untuk membuka file yang diinginkan.
            Pastikan Anda memiliki akses ke file tersebut.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;