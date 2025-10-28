import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./Bundlecheckout.css";
import { supabase } from "../lib/supabaseClient";


const BundleCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bundle } = location.state || {};

  const { user, isAuthenticated } = useAuth();

  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    quantity: 1,
  });

  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // ✅ PERBAIKAN: Effect untuk auto-fill data user
  useEffect(() => {
    console.log("🔍 Checking authentication...");
    console.log("User from AuthContext:", user);
    console.log("Is Authenticated:", isAuthenticated);

    if (!isAuthenticated || !user) {
      console.log("❌ User not authenticated, redirecting to login...");
      alert("⚠️ Anda harus login terlebih dahulu untuk melakukan pembelian");
      navigate("/login");
      return;
    }

    // ✅ PERBAIKAN: Auto-fill data dengan validasi yang lebih baik
    setCustomerData((prev) => ({
      ...prev,
      name:
        user.username || user.name || user.email?.split("@")[0] || "Customer",
      phone: user.phone || "",
      email: user.email || "",
    }));
  }, [user, isAuthenticated, navigate]);

  // Debug info
  useEffect(() => {
    console.log("🔍 BundleCheckout Debug:");
    console.log("Bundle:", bundle);
    console.log("User from Context:", user);
    console.log("Customer Data:", customerData);
  }, [bundle, user, customerData]);

  if (!bundle) {
    return (
      <div className="bundle-checkout-container">
        <Navigation />
        <div className="error-message">
          <h2>Bundle tidak ditemukan</h2>
          <p>Silakan pilih bundle terlebih dahulu</p>
          <button
            onClick={() => navigate("/bundle-ticket")}
            className="back-btn"
          >
            Kembali ke Bundle Ticket
          </button>
        </div>
      </div>
    );
  }

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

    if (name !== "name") {
      setCustomerData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ✅ PERBAIKAN: Generate reference yang lebih robust
  const generateBundleReference = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `BUNDLE-${timestamp}-${random}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Hanya file JPG, PNG, atau PDF yang diizinkan");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);

    try {
      const fileInfo = {
        file: file,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
      };

      setPaymentProof(fileInfo);
      console.log("✅ File ready for upload:", file.name);
    } catch (error) {
      console.error("❌ File processing error:", error);
      alert("Gagal memproses file. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const saveBundleOrderToDatabase = async (orderData) => {
    try {
      console.log("💾 Saving bundle order to Supabase...");

      const { data, error } = await supabase
        .from("bundle_orders")
        .insert([
          {
            order_reference: orderData.order_reference,
            bundle_id: orderData.bundleId,
            bundle_name: orderData.bundleName,
            bundle_description: orderData.bundleDescription || "",
            bundle_price: orderData.bundlePrice,
            original_price: orderData.originalPrice,
            savings: orderData.savings,
            quantity: orderData.quantity,
            total_price: orderData.totalPrice,
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone,
            customer_email: orderData.customerEmail,
            user_id: user?.id || user?._id || "unknown",
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) throw error;
      console.log("✅ Order saved to Supabase:", data);
      return { success: true, data };
    } catch (error) {
      console.error("❌ Supabase insert error:", error);
      return { success: false, message: error.message };
    }
  };

  const uploadPaymentProof = async (file, orderReference) => {
  try {
    const ext = file.name.split(".").pop();
    const filePath = `bundle-payments/${orderReference}.${ext}`;

    const { data, error } = await supabase.storage
      .from("payment_proofs")
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("payment_proofs")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl, filePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

  const handleUploadPaymentProof = async () => {
    if (!paymentProof) {
      alert("Silakan pilih file bukti pembayaran");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("paymentProof", paymentProof.file);
      formData.append("order_reference", orderData.order_reference);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bundle/upload-payment`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setOrderStatus("waiting_verification");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("❌ Error upload bukti pembayaran:", error);
      alert("Upload gagal: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

 const handleConfirmPayment = async () => {
  if (!paymentProof) {
    alert("Silakan upload bukti pembayaran terlebih dahulu.");
    return;
  }

  if (!customerData.phone) {
    alert("Nomor handphone wajib diisi.");
    return;
  }

  setIsProcessing(true);

  try {
    // 1️⃣ Buat order reference
    const orderReference = generateBundleReference();

    // 2️⃣ Simpan ke database Supabase
    const orderPayload = {
      order_reference: orderReference,
      bundle_id: bundle.id,
      bundle_name: bundle.name,
      bundle_description: bundle.description || "",
      bundle_price: bundle.bundlePrice,
      original_price: bundle.originalPrice,
      savings: bundle.savings,
      quantity: customerData.quantity,
      total_price: totalPrice,
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_email: customerData.email,
      user_id: user?.id || user?._id || "unknown",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const { data: savedOrder, error: saveError } = await supabase
      .from("bundle_orders")
      .insert([orderPayload])
      .select("*")
      .single();

    if (saveError) throw saveError;

    setOrderData(savedOrder);

    // 3️⃣ Upload bukti pembayaran ke Supabase Storage
    const ext = paymentProof.name.split(".").pop();
    const filePath = `bundle-payments/${orderReference}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment_proofs")
      .upload(filePath, paymentProof.file, { upsert: true });

    if (uploadError) throw uploadError;

    // 4️⃣ Ambil public URL
    const { data: publicUrlData } = supabase.storage
      .from("payment_proofs")
      .getPublicUrl(filePath);

    // 5️⃣ Update order dengan URL bukti pembayaran
    await supabase
      .from("bundle_orders")
      .update({ payment_proof: publicUrlData.publicUrl })
      .eq("id", savedOrder.id);

    setOrderStatus("waiting_verification");

    alert(
      "✅ Bukti pembayaran berhasil diunggah. Silakan hubungi admin untuk verifikasi."
    );
  } catch (error) {
    console.error("❌ Error saat konfirmasi pembayaran:", error);
    alert("Gagal mengirim data pembayaran: " + error.message);
    setOrderStatus("failed");
  } finally {
    setIsProcessing(false);
    setShowConfirmation(false);
  }
};

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleNewOrder = () => {
    setCustomerData((prev) => ({
      ...prev,
      phone: user?.phone || "",
      email: user?.email || "",
      quantity: 1,
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
              <h3>Konfirmasi Pembayaran</h3>
              <p className="modal-subtitle">Pastikan data sudah benar</p>
            </div>

            <div className="modal-content">
              <div className="order-summary-confirm">
                <h4>Detail Order:</h4>
                <p>
                  <strong>Bundle:</strong> {bundle.name}
                </p>
                <p>
                  <strong>Quantity:</strong> {customerData.quantity}
                </p>
                <p>
                  <strong>Total:</strong> Rp {totalPrice.toLocaleString()}
                </p>
              </div>

              <div className="customer-info-confirm">
                <h4>Data Customer:</h4>
                <p>
                  <strong>Nama:</strong> {customerData.name}
                </p>
                <p>
                  <strong>Phone:</strong> {customerData.phone}
                </p>
                <p>
                  <strong>Email:</strong> {customerData.email || "-"}
                </p>
              </div>

              {paymentProof && (
                <div className="file-info">
                  <strong>Bukti Pembayaran:</strong>
                  <span>{paymentProof.name}</span>
                </div>
              )}
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
                  "Konfirmasi Pembayaran"
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

          {user && (
            <div className="user-login-info">
              <p>
                <strong>Anda login sebagai:</strong> {user.username}
                {user.email && ` | ${user.email}`}
              </p>
            </div>
          )}
        </div>

        {/* ✅ TAMPILAN SUKSES */}
        {orderStatus === "waiting_verification" && orderData && (
          <div className="success-message">
            <div className="success-icon">🕒</div>
            <h2>Pembayaran Terkirim!</h2>
            <p className="info-text">
              Silakan <strong>hubungi admin</strong> untuk verifikasi bukti
              pembayaran dalam waktu maksimal <strong>10 menit</strong>.
            </p>
            <div className="success-details">
              <p>
                <strong>Order Reference:</strong> {orderData.order_reference}
              </p>
              <p>
                <strong>Bundle:</strong> {orderData.bundle_name}
              </p>
              <p>
                <strong>Total:</strong> Rp{" "}
                {orderData.total_price?.toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="status-waiting">
                  Menunggu Verifikasi Admin
                </span>
              </p>
            </div>
            <div className="success-actions">
              <button
                onClick={() => navigate("/my-tickets")}
                className="view-tickets-btn"
              >
                Lihat Status Pesanan
              </button>
              <button onClick={handleNewOrder} className="new-order-btn">
                Beli Bundle Lain
              </button>
            </div>
          </div>
        )}
        <div className="contact-admin">
          <p>💬 Butuh bantuan verifikasi? Hubungi admin di WhatsApp:</p>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-link"
          >
            +62 812-3456-7890 (Admin Cinema)
          </a>
        </div>
        {/* ✅ TAMPILAN GAGAL */}
        {orderStatus === "failed" && (
          <div className="error-message">
            <div className="error-icon">❌</div>
            <h2>Pembayaran Gagal</h2>
            <p>Silakan coba lagi atau hubungi customer service</p>
            <button onClick={handleNewOrder} className="retry-btn">
              Coba Lagi
            </button>
          </div>
        )}

        {/* ✅ TAMPILAN FORM UTAMA */}
        {(orderStatus === null || orderStatus === "failed") && (
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
                    e.target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkJ1bmRsZSBJbWFnZTwvdGV4dD4KPC9zdmc+";
                  }}
                />
                <div className="bundle-info">
                  <h4>{bundle.name}</h4>
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
                    onClick={() =>
                      setCustomerData((prev) => ({
                        ...prev,
                        quantity: Math.max(1, prev.quantity - 1),
                      }))
                    }
                    disabled={customerData.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{customerData.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomerData((prev) => ({
                        ...prev,
                        quantity: prev.quantity + 1,
                      }))
                    }
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
                  <span>
                    Rp{" "}
                    {(bundle.savings * customerData.quantity).toLocaleString()}
                  </span>
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
                    src= "/images/gopay1-qr.jpg"
                    alt="QRIS GoPay"
                    className="qris-image"
                    onError={() => {
                      console.log("❌ QR image failed to load");
                      setQrImageError(true);
                    }}
                    onLoad={() =>
                      console.log("✅ QR image loaded successfully")
                    }
                  />
                ) : (
                  <div className="qris-fallback">
                    <div className="fallback-icon">💰</div>
                    <p className="fallback-text">
                      Transfer ke:
                      <br />
                      <strong>BCA: 1234 5678 9012</strong>
                      <br />
                      <strong>a.n UNEJ CINEMA</strong>
                    </p>
                  </div>
                )}

                <p className="payment-amount">
                  Amount: Rp {totalPrice.toLocaleString()}
                </p>
              </div>
            </div>

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
                    disabled
                    className="disabled-input"
                    placeholder="Nama diisi otomatis dari akun login"
                  />
                  <div className="field-info">
                    ✅ Nama diambil dari akun login
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
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={customerData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>

                {/* Upload Payment Proof */}
                <div className="upload-section">
                  <h4>📎 Upload Bukti Pembayaran *</h4>

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
                      className={`file-input-label ${
                        uploading || paymentProof ? "disabled" : ""
                      }`}
                    >
                      <span className="icon">📁</span>
                      {uploading
                        ? "Mengupload..."
                        : paymentProof
                        ? "File Terupload ✓"
                        : "Pilih File"}
                    </label>
                  </div>

                  {paymentProof && !uploading && (
                    <div className="upload-success">
                      <div className="success-icon">✅</div>
                      <div className="file-info">
                        <strong>File:</strong> {paymentProof.name}
                      </div>
                      <button
                        onClick={() => setShowConfirmation(true)}
                        className="proceed-btn"
                        disabled={!customerData.phone}
                      >
                        Konfirmasi Pembayaran
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/bundle-ticket")}
                    className="back-btn"
                  >
                    Kembali
                  </button>
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
