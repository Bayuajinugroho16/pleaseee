// src/pages/BundleCheckout.jsx
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
    address: "",
    quantity: 1,
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
    "https://beckendflyio.vercel.app";
  const totalPrice = bundle?.bundlePrice * customerData.quantity;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      alert("⚠️ Anda harus login terlebih dahulu untuk melakukan pembelian");
      navigate("/login");
      return;
    }

    setCustomerData((prev) => ({
      ...prev,
      name: user.username || user.name || "Customer",
      phone: user.phone || "",
      address: "", // biarkan kosong, nanti user isi manual
    }));
  }, [user, isAuthenticated, navigate]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const generateBundleReference = () =>
    `BUNDLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      return alert("Hanya file JPG, PNG, atau PDF yang diizinkan");
    }
    if (file.size > 5 * 1024 * 1024) {
      return alert("Ukuran file maksimal 5MB");
    }

    setPaymentProof(file);
  };

  const handleConfirmPayment = async () => {
    if (!paymentProof) return alert("Upload bukti pembayaran terlebih dahulu");
    if (!customerData.phone) return alert("Nomor HP wajib diisi");

    setIsProcessing(true);

    // Gunakan order_reference yang sudah ada di orderData atau generate baru
    const orderReference =
      orderData?.order_reference || generateBundleReference();
    const totalPrice = bundle.bundlePrice * customerData.quantity;

    try {
      // 1️⃣ CREATE ORDER (kalau belum ada)
      let currentOrderReference = orderReference;
      if (!orderData) {
        const resOrder = await fetch(
          `${API_BASE_URL}/api/bundle/create-order`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
              customer_address: customerData.address || "",
              status: "pending",
            }),
          }
        );

        if (!resOrder.ok) throw new Error("Gagal membuat order");
        const orderResult = await resOrder.json();
        if (!orderResult.success) throw new Error(orderResult.message);

        currentOrderReference = orderResult.data.order_reference;
        setOrderData({ ...orderResult.data });
      }

      // 2️⃣ UPLOAD FILE KE SUPABASE
      setUploading(true);
      const ext = paymentProof.name.split(".").pop();
      const filePath = `bundle-payments/${currentOrderReference}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("bukti_pembayaran")
        .upload(filePath, paymentProof, { upsert: true });
      if (uploadError) throw uploadError;

      // 3️⃣ GET PUBLIC URL
      const { data: publicUrlData } = supabase.storage
        .from("bukti_pembayaran")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      // 4️⃣ UPDATE PAYMENT PROOF DI BACKEND
      const resUpdate = await fetch(
        `${API_BASE_URL}/api/bundle/update-payment-proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_reference: currentOrderReference,
            payment_proof_url: publicUrl, // field ini tetap dikirim sesuai backend
          }),
        }
      );

      if (!resUpdate.ok) throw new Error("Gagal update payment proof");
      const updateResult = await resUpdate.json();
      if (!updateResult.success) throw new Error(updateResult.message);

      // 5️⃣ Set state untuk UI
      setOrderData((prev) => ({ ...prev, payment_proof: publicUrl }));
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
              <strong>Total:</strong> Rp {totalPrice?.toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="status-waiting">Menunggu Verifikasi Admin</span>
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
          {/* 🧾 Ringkasan Pesanan */}
          <div className="order-summary">
            <h3>Ringkasan Pesanan</h3>
            <div className="bundle-detail">
              <img
                src={bundle.image}
                alt={bundle.name}
                className="bundle-image"
                onError={(e) => {
                  e.target.src = "/images/placeholder.png";
                }}
              />
              <div className="bundle-info">
                <h4>{bundle.name}</h4>
                <div className="price-detail">
                  <span className="original-price">
                    Rp {bundle.originalPrice?.toLocaleString()}
                  </span>
                  <span className="bundle-price">
                    Rp {bundle.bundlePrice?.toLocaleString()}
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
                <span>Rp {totalPrice?.toLocaleString()}</span>
              </div>
              <div className="total-line savings">
                <span>Anda Hemat:</span>
                <span>
                  Rp{" "}
                  {(bundle.savings * customerData.quantity)?.toLocaleString()}
                </span>
              </div>
              <div className="total-line grand-total">
                <span>Total Pembayaran:</span>
                <span>Rp {totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            <div className="qris-section">
              <h4> QRIS </h4>
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
              <p className="payment-amount">
                Amount: Rp {totalPrice?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 🧍‍♂️ Form Customer */}
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
                <label htmlFor="address">Alamat</label>
                <input
                  type="address"
                  id="address"
                  name="address"
                  value={customerData.address}
                  onChange={handleInputChange}
                  placeholder="Jl. Sumbersari No. J1-09, Jember"
                />
              </div>

              <div className="upload-section">
                <h4>📎 Upload Bukti Pembayaran *</h4>
                <input
                  type="file"
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
  );
};

export default BundleCheckout;
