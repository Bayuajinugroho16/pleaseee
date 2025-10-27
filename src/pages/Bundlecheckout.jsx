import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ IMPORT AUTH CONTEXT
import Navigation from '../components/Navigation';
import './Bundlecheckout.css';

const BundleCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bundle } = location.state || {};

  // ✅ GUNAKAN AUTH CONTEXT UNTUK MENDAPATKAN DATA USER
  const { user, isAuthenticated } = useAuth();

  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    quantity: 1
  });

  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // ✅ EFFECT UNTUK AUTO-FILL DATA DARI USER YANG LOGIN
  useEffect(() => {
    console.log('🔍 Checking authentication...');
    console.log('User from AuthContext:', user);
    console.log('Is Authenticated:', isAuthenticated);

    if (!isAuthenticated || !user) {
      console.log('❌ User not authenticated, redirecting to login...');
      alert('⚠️ Anda harus login terlebih dahulu untuk melakukan pembelian');
      navigate('/login');
      return;
    }

    // ✅ AUTO-FILL DATA CUSTOMER DARI USER YANG LOGIN
    console.log('✅ User authenticated, auto-filling data...');
    setCustomerData(prev => ({
      ...prev,
      name: user.username || user.name || '', // ✅ GUNAKAN USERNAME DARI LOGIN
      phone: user.phone || '',
      email: user.email || ''
    }));

  }, [user, isAuthenticated, navigate]);

  // Debug info
  useEffect(() => {
    console.log('🔍 BundleCheckout Debug:');
    console.log('Bundle:', bundle);
    console.log('User from Context:', user);
    console.log('Customer Data:', customerData);
  }, [bundle, user, customerData]);

  if (!bundle) {
    return (
      <div className="bundle-checkout-container">
        <Navigation />
        <div className="error-message">
          <h2>Bundle tidak ditemukan</h2>
          <p>Silakan pilih bundle terlebih dahulu</p>
          <button onClick={() => navigate('/bundle-ticket')} className="back-btn">
            Kembali ke Bundle Ticket
          </button>
        </div>
      </div>
    );
  }

  // ✅ TAMPILAN LOADING JIKA BELUM ADA DATA USER
  if (!user || !isAuthenticated) {
    return (
      <div className="bundle-checkout-container">
        <Navigation />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memverifikasi authentication...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ HANYA ALLOW PHONE DAN EMAIL UNTUK DIUBAH, NAME TIDAK BISA DIUBAH
    if (name !== 'name') {
      setCustomerData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Generate unique reference untuk bundle order
  const generateBundleReference = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `BUNDLE-${timestamp}-${random}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Hanya file JPG, PNG, atau PDF yang diizinkan');
      return;
    }

    // Validasi file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileInfo = {
        file: file,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString()
      };
      
      setPaymentProof(fileInfo);
      console.log('✅ File ready for upload:', file.name);
      
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('❌ File processing error:', error);
      alert('Gagal memproses file. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const saveBundleOrderToDatabase = async (orderData) => {
    try {
      console.log('💾 Saving bundle order with payment proof...');
      
      const requestData = {
        order_reference: orderData.order_reference,
        bundle_id: orderData.bundleId,
        bundle_name: orderData.bundleName,
        bundle_description: orderData.bundleDescription,
        bundle_price: orderData.bundlePrice,
        original_price: orderData.originalPrice,
        savings: orderData.savings,
        quantity: orderData.quantity,
        total_price: orderData.totalPrice,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail,
        payment_proof: orderData.paymentProof,
        user_id: user?.id || user?._id, // ✅ GUNAKAN USER ID DARI CONTEXT
        status: 'confirmed'
      };

      console.log('📤 Sending to endpoint: /api/bookings/create-bundle-order');
      console.log('📦 Order data:', requestData);
      
      const response = await fetch('https://beckendflyio.vercel.app/api/bookings/create-bundle-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Bundle order saved successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error saving bundle order:', error);
      throw error;
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentProof) {
      alert('Silakan upload bukti pembayaran terlebih dahulu');
      return;
    }

    // Validasi data customer
    if (!customerData.name || !customerData.phone) {
      alert('Nomor handphone wajib diisi');
      return;
    }

    setIsProcessing(true);

    try {
      const orderReference = generateBundleReference();
      const totalPrice = bundle.bundlePrice * customerData.quantity;

      console.log('🚀 Starting bundle payment process...');
      console.log('📝 Order Reference:', orderReference);
      console.log('👤 Customer Name (auto-filled):', customerData.name);
      console.log('🔐 Logged in User:', user.username);

      // ✅ STEP 1: GENERATE FILENAME UNTUK DISIMPAN DI DATABASE
      let paymentProofFileName = null;
      
      if (paymentProof.file) {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        const fileExtension = paymentProof.name.split('.').pop();
        paymentProofFileName = `payment-${timestamp}-${random}.${fileExtension}`;
        console.log('📁 Generated payment proof filename:', paymentProofFileName);
      } else {
        paymentProofFileName = paymentProof.name;
      }

      // ✅ STEP 2: SIMPAN ORDER KE DATABASE DENGAN PAYMENT PROOF
      const orderData = {
        order_reference: orderReference,
        bundleId: bundle.id,
        bundleName: bundle.name,
        bundleDescription: bundle.description,
        bundlePrice: bundle.bundlePrice,
        originalPrice: bundle.originalPrice,
        savings: bundle.savings,
        quantity: customerData.quantity,
        totalPrice: totalPrice,
        customerName: customerData.name, // ✅ NAMA AUTO DARI USER LOGIN
        customerPhone: customerData.phone,
        customerEmail: customerData.email || '',
        paymentProof: paymentProofFileName,
        status: 'confirmed'
      };

      console.log('💾 Saving bundle order with data:', orderData);

      // Simpan ke database
      const saveResult = await saveBundleOrderToDatabase(orderData);
      
      if (saveResult.success) {
        console.log('🎉 Bundle order saved successfully!');
        
        // ✅ STEP 3: UPLOAD FILE PAYMENT PROOF (OPTIONAL)
        if (paymentProof.file) {
          try {
            const formData = new FormData();
            formData.append('payment_proof', paymentProof.file);
            formData.append('order_reference', orderReference);
            
            console.log('📤 Attempting to upload payment proof...');
            const uploadResponse = await fetch('https://beckendflyio.vercel.app/api/bookings/bundle-order/upload-payment', {
              method: 'POST',
              body: formData,
            });
            
            console.log('📥 Upload response status:', uploadResponse.status);
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              console.log('✅ Payment proof uploaded successfully:', uploadResult.fileName);
            } else {
              console.warn('⚠️ Payment proof upload failed, but order was saved');
            }
          } catch (uploadError) {
            console.warn('⚠️ Payment proof upload error, but order was saved:', uploadError.message);
          }
        }

        setOrderData(saveResult.data);
        setOrderStatus('confirmed');
        
      } else {
        throw new Error(saveResult.message || 'Gagal menyimpan order');
      }

    } catch (error) {
      console.error('❌ Bundle payment processing error:', error);
      alert('Terjadi kesalahan saat memproses pembayaran: ' + error.message);
      setOrderStatus('failed');
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPaymentProof(null);
  };

  const handleNewOrder = () => {
    // ✅ RESET TAPI NAMA TETAP DARI USER LOGIN
    setCustomerData(prev => ({
      ...prev,
      phone: user?.phone || '',
      email: user?.email || '',
      quantity: 1
    }));
    setPaymentProof(null);
    setOrderStatus(null);
    setOrderData(null);
  };

  const totalPrice = bundle.bundlePrice * customerData.quantity;

  return (
    <div className="bundle-checkout-container">
      <Navigation />
      
      {/* ✅ MODAL KONFIRMASI */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <div className="modal-icon">✅</div>
              <h3>Upload Berhasil!</h3>
              <p className="modal-subtitle">Bukti pembayaran telah diupload</p>
            </div>
            
            <div className="modal-content">
              <p>Apakah Anda ingin melanjutkan konfirmasi pembayaran?</p>
              
              <div className="customer-info-confirm">
                <h4>Data Customer:</h4>
                <p><strong>Nama:</strong> {customerData.name} <span className="auto-filled-badge">(Auto)</span></p>
                <p><strong>Phone:</strong> {customerData.phone}</p>
                <p><strong>Email:</strong> {customerData.email || '-'}</p>
              </div>
              
              <div className="file-info">
                <strong>File:</strong> 
                <span>{paymentProof?.name}</span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleCancelConfirmation}
                className="cancel-btn"
                disabled={isProcessing}
              >
                Batalkan
              </button>
              <button 
                onClick={handleConfirmPayment}
                className="confirm-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Memproses...
                  </>
                ) : (
                  'Ya, Konfirmasi Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="checkout-content">
        <div className="checkout-header">
          <h1>🎫 Checkout Bundle Ticket</h1>
          <p>Lengkapi data diri dan upload bukti pembayaran</p>
          
          {/* ✅ INFO USER YANG LOGIN */}
          {user && (
            <div className="user-login-info">
              <p>
                <strong>Anda login sebagai:</strong> {user.username} 
                {user.email && ` | ${user.email}`}
              </p>
              <p className="name-auto-info">
                ✅ <strong>Nama telah diisi otomatis sesuai akun login</strong>
              </p>
            </div>
          )}
        </div>

        {/* ✅ TAMPILAN SUKSES */}
        {orderStatus === 'confirmed' && orderData && (
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <h2>Pembayaran Berhasil!</h2>
            <div className="success-details">
              <p><strong>Order Reference:</strong> {orderData.order_reference}</p>
              <p><strong>Status:</strong> <span className="status-confirmed">Confirmed</span></p>
              <p><strong>Bundle:</strong> {orderData.bundle_name}</p>
              <p><strong>Total:</strong> Rp {orderData.total_price?.toLocaleString()}</p>
              <p><strong>Customer:</strong> {orderData.customer_name}</p>
            </div>
            <div className="success-actions">
              <button onClick={() => navigate('/my-tickets')} className="view-tickets-btn">
                Lihat Tiket Saya
              </button>
              <button onClick={handleNewOrder} className="new-order-btn">
                Buat Order Baru
              </button>
            </div>
          </div>
        )}

        {/* ✅ TAMPILAN FORM */}
        {(orderStatus === null || orderStatus === 'failed') && (
          <div className="checkout-layout">
            {/* Order Summary */}
            <div className="order-summary">
              <h3>Ringkasan Pesanan</h3>
              <div className="bundle-detail">
                <img 
                  src={bundle.image} 
                  alt={bundle.name}
                  className="bundle-image"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkJ1bmRsZSBJbWFnZTwvdGV4dD4KPC9zdmc+';
                  }}
                />
                <div className="bundle-info">
                  <h4>{bundle.name}</h4>
                  <p>{bundle.description}</p>
                  <div className="price-detail">
                    <span className="original-price">
                      Rp {bundle.originalPrice.toLocaleString()}
                    </span>
                    <span className="bundle-price">
                      Rp {bundle.bundlePrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="quantity-selector">
                <label>Jumlah Paket:</label>
                <div className="quantity-controls">
                  <button
                    type="button"
                    onClick={() => setCustomerData(prev => ({
                      ...prev,
                      quantity: Math.max(1, prev.quantity - 1)
                    }))}
                    disabled={customerData.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{customerData.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setCustomerData(prev => ({
                      ...prev,
                      quantity: prev.quantity + 1
                    }))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="order-total">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>Rp {totalPrice.toLocaleString()}</span>
                </div>
                <div className="total-line savings">
                  <span>Anda Hemat:</span>
                  <span>Rp {(bundle.savings * customerData.quantity).toLocaleString()}</span>
                </div>
                <div className="total-line grand-total">
                  <span>Total Pembayaran:</span>
                  <span>Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* QRIS GoPay Section */}
<div className="qris-section">
  <h4>💰 Scan QRIS GoPay</h4>
  <p className="qris-description">
    Scan QR code below using GoPay app
  </p>
  
  {!qrImageError ? (
    <img 
      src="https://beckendflyio.vercel.app/public/images/gopay1-qr.jpg"  // ✅ URL BARU DARI IMGBB
      alt="QRIS GoPay" 
      className="qris-image"
      onError={() => {
        console.log('❌ QR image failed to load');
        setQrImageError(true);
      }}
      onLoad={() => console.log('✅ QR image loaded successfully')}
    />
  ) : (
    <div className="qris-fallback">
      <div className="fallback-icon">❌</div>
      <p className="fallback-text">
        QR Code Image Not Found<br/>
        <span className="fallback-subtext">Check backend public folder</span>
      </p>
    </div>
  )}

  <p className="payment-amount">
    Amount: Rp {pendingBooking.total_amount?.toLocaleString()}
  </p>
</div>  
                <p className="payment-amount">
                  Amount: Rp {totalPrice.toLocaleString()}
                </p>
              </div>

              {/* Payment Instructions */}
              {/* <div className="payment-instructions">
                <h4>💳 Instruksi Pembayaran</h4>
                <div className="bank-details">
                  <p><strong>Bank BCA</strong></p>
                  <p>No. Rekening: <strong>1234 5678 9012</strong></p>
                  <p>Atas Nama: <strong>UNEJ CINEMA</strong></p>
                </div>
                <p className="instruction-note">
                  Transfer sesuai total pembayaran dan upload bukti transfer di form sebelah
                </p>
              </div> */}
            {/* </div> */}

            {/* Customer Form & Payment Upload */}
            <div className="customer-form">
              <h3>Data Customer & Pembayaran</h3>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="name">Nama Lengkap *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={customerData.name}
                    onChange={handleInputChange}
                    required
                    disabled // ✅ INPUT NAMA DISABLED (TIDAK BISA DIUBAH)
                    className="disabled-input"
                    placeholder="Nama diisi otomatis dari akun login"
                  />
                  <div className="field-info">
                    ✅ Nama diambil otomatis dari username login: <strong>{user.username}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Nomor Handphone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={customerData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Alamat</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={customerData.email}
                    onChange={handleInputChange}
                    placeholder="Masukkan Alamat Lengkap "
                  />
                </div>

                {/* Upload Payment Proof */}
                <div className="upload-section">
                  <h4>📎 Upload Bukti Pembayaran *</h4>
                  <p className="upload-description">
                    Upload screenshot bukti transfer pembayaran Anda
                  </p>
                  
                  <div className="file-input-container">
                    <input
                      type="file"
                      id="payment-proof"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading || paymentProof}
                      className="file-input"
                    />
                    <label
                      htmlFor="payment-proof"
                      className={`file-input-label ${uploading || paymentProof ? "disabled" : ""}`}
                    >
                      <span className="icon">📁</span>
                      {uploading ? "Mengupload..." : paymentProof ? "Uploaded ✓" : "Pilih File"}
                    </label>
                    <span className="file-input-info">
                      Format: JPG, PNG, PDF (max 5MB)
                    </span>
                  </div>

                  {uploading && (
                    <div className="uploading-indicator">
                      <div className="uploading-spinner"></div>
                      <span>Sedang mengupload...</span>
                    </div>
                  )}

                  {paymentProof && !uploading && !showConfirmation && (
                    <div className="upload-success">
                      <div className="success-icon">✅</div>
                      <div className="file-info">
                        <strong>File terupload:</strong> {paymentProof.name}
                        <br />
                        <small>
                          Tipe: {paymentProof.type} | 
                          Size: {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                        </small>
                      </div>
                      <button 
                        onClick={() => setShowConfirmation(true)}
                        className="proceed-btn"
                      >
                        Lanjutkan Konfirmasi
                      </button>
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="payment-info">
                  <p>⚠️ <strong>Important:</strong></p>
                  <ul>
                    <li>Complete payment within 30 minutes</li>
                    <li>Upload proof of payment after transferring</li>
                    <li>Bundle akan aktif setelah verifikasi pembayaran</li>
                    <li>Save Your e-ticket and Reedem it on the day of show</li>
                    <li>Pemesanan setelah 31 Oktober 2025 akan tergolong sebagai pre-order</li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate('/bundle-ticket')}
                    className="back-btn"
                  >
                    Kembali
                  </button>
                  
                  {/* Tombol manual confirm */}
                  {paymentProof && !showConfirmation && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(true)}
                      className="pay-btn"
                      disabled={!customerData.phone} // ✅ HANYA VALIDASI PHONE SAJA
                    >
                      Konfirmasi Pembayaran
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleCheckout;