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
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const totalPrice = bundle?.bundlePrice * customerData.quantity;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      alert("⚠️ Anda harus login terlebih dahulu untuk melakukan pembelian");
      navigate("/login");
      return;
    }

    setCustomerData((prev) => ({
      ...prev,
      name: user.username || user.name || user.email?.split("@")[0] || "Customer",
      phone: user.phone || "",
      email: user.email || "",
    }));
  }, [user, isAuthenticated, navigate]);

  if (!bundle) {
    return (
      <div className="bundle-checkout-container">
        <Navigation />
        <div className="error-message">
          <h2>Bundle tidak ditemukan</h2>
          <p>Silakan pilih bundle terlebih dahulu</p>
          <button onClick={() => navigate("/bundle-ticket")} className="back-btn">
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
      setCustomerData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const generateBundleReference = () => `BUNDLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    alert("Hanya file JPG, PNG, atau PDF yang diizinkan");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file maksimal 5MB");
    return;
  }

  setPaymentProof(file);
};
  const handleConfirmPayment = async () => {
  if (!paymentProof) return alert("Upload bukti pembayaran terlebih dahulu");
  if (!customerData.phone) return alert("Nomor HP wajib diisi");

  setIsProcessing(true);
  const orderReference = generateBundleReference();

  try {
    // 1️⃣ CREATE ORDER DI MYSQL
    const resOrder = await fetch(`${import.meta.env.VITE_API_URL}/api/bundle/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_reference: orderReference,
        bundle_id: bundle.id,
        bundle_name: bundle.name,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email,
        quantity: customerData.quantity,
        total_price: totalPrice,
        status: "pending",
      }),
    });
    const orderResult = await resOrder.json();
    if (!orderResult.success) throw new Error(orderResult.message);

    // 2️⃣ UPLOAD FILE KE SUPABASE (bucket bukti_pembayaran)
    setUploading(true);
    const ext = paymentProof.name.split(".").pop();
    const filePath = `bundle-payments/${orderReference}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("bukti_pembayaran")
      .upload(filePath, paymentProof, { upsert: true });
    if (uploadError) throw uploadError;

    // 3️⃣ DAPATKAN PUBLIC URL
    const { data: publicUrlData } = supabase.storage
      .from("bukti_pembayaran")
      .getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;

    // 4️⃣ UPDATE ORDER DI MYSQL DENGAN URL FILE
    const resUpdate = await fetch(`${import.meta.env.VITE_API_URL}/api/bundle/update-payment-proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_reference: orderReference, payment_proof_url: publicUrl }),
    });
    const updateResult = await resUpdate.json();
    if (!updateResult.success) throw new Error(updateResult.message);

    setOrderData({ ...orderResult.data, payment_proof_url: publicUrl });
    setOrderStatus("waiting_verification");
    alert("✅ Bukti pembayaran berhasil diunggah. Tunggu verifikasi admin.");
  } catch (err) {
    console.error("❌ Error saat konfirmasi pembayaran:", err);
    setOrderStatus("failed");
    alert("Gagal konfirmasi pembayaran: " + err.message);
  } finally {
    setIsProcessing(false);
    setUploading(false);
  }
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

  return (
    <div className="bundle-checkout-container">
      <Navigation />

      {orderStatus === "waiting_verification" && orderData && (
        <div className="success-message">
          <div className="success-icon">🕒</div>
          <h2>Pembayaran Terkirim!</h2>
          <p>
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
              <strong>Total:</strong> Rp {orderData.total_price?.toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="status-waiting">Menunggu Verifikasi Admin</span>
            </p>
          </div>
          <div className="success-actions">
            <button onClick={() => navigate("/my-tickets")} className="view-tickets-btn">
              Lihat Status Pesanan
            </button>
            <button onClick={handleNewOrder} className="new-order-btn">
              Beli Bundle Lain
            </button>
          </div>
        </div>
      )}

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

      {(orderStatus === null || orderStatus === "failed") && (
        <div className="checkout-layout">
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
                <span>Rp {(bundle.savings * customerData.quantity).toLocaleString()}</span>
              </div>
              <div className="total-line grand-total">
                <span>Total Pembayaran:</span>
                <span>Rp {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="qris-section">
              <h4>💰 Scan QRIS GoPay</h4>
              {!qrImageError ? (
                <img
                  src="/images/gopay1-qr.jpg"
                  alt="QRIS GoPay"
                  className="qris-image"
                  onError={() => setQrImageError(true)}
                />
              ) : (
                <div className="qris-fallback">
                  <div className="fallback-icon">💰</div>
                  <p>
                    Transfer ke:
                    <br />
                    <strong>BCA: 1234 5678 9012</strong>
                    <br />
                    <strong>a.n UNEJ CINEMA</strong>
                  </p>
                </div>
              )}
              <p className="payment-amount">Amount: Rp {totalPrice.toLocaleString()}</p>
            </div>
          </div>

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
                />
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

              <div className="upload-section">
                <h4>📎 Upload Bukti Pembayaran *</h4>
                <input
                  type="file"
                  id="payment-proof"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading || paymentProof}
                />
                {paymentProof && (
                  <button
                    onClick={handleConfirmPayment}
                    className="proceed-btn"
                    disabled={isProcessing || !customerData.phone}
                  >
                    {isProcessing ? "Memproses..." : "Konfirmasi Pembayaran"}
                  </button>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => navigate("/bundle-ticket")} className="back-btn">
                  Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleCheckout;
