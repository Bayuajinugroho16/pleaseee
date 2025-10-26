import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let result;

      if (isLogin) {
        // ✅ LOGIN: Normal flow
        if (!formData.username.trim() || !formData.password.trim()) {
          setError("Username dan password harus diisi");
          setLoading(false);
          return;
        }

        console.log("🔐 Attempting login with username:", formData.username);
        result = await login(formData.username, formData.password);

        if (result.success) {
          console.log("✅ Login successful, user role:", result.user?.role);

          // Redirect berdasarkan role
          if (result.user?.role === "admin") {
            navigate("/admin/verify");
          } else {
            navigate("/home");
          }
        } else {
          setError(result.message || "Login failed");
        }
      } else {
        // ✅ REGISTER: Tanpa Auto Login
        if (!formData.username || !formData.password || !formData.phone) {
          setError("Username, password, dan nomor telepon harus diisi");
          setLoading(false);
          return;
        }

        if (!formData.phone.match(/^08[0-9]{8,11}$/)) {
          setError("Nomor telepon harus dimulai dengan 08 dan 10-13 digit");
          setLoading(false);
          return;
        }

        console.log("📝 Attempting register for:", formData.username);

        const registerData = {
          username: formData.username,
          password: formData.password,
          phone: formData.phone,
          email: `${formData.username}@no-email.com`,
        };

        result = await register(registerData);

        if (result.success) {
          console.log("✅ Register successful for:", formData.username);

          // ✅ HANYA TAMPILKAN SUKSES MESSAGE, TIDAK AUTO LOGIN
          setSuccessMessage(
            "🎉 Pendaftaran berhasil! Silakan login dengan akun Anda."
          );

          // Reset form data
          setFormData({
            username: "",
            password: "",
            phone: "",
          });

          // ✅ TIDAK ADA NAVIGATE KE HOME
          // ✅ HANYA SWITCH KE LOGIN SETELAH 3 DETIK
          setTimeout(() => {
            setIsLogin(true);
            setSuccessMessage("");
          }, 3000);
        } else {
          setError(result.message || "Registration failed");
        }
      }
    } catch (error) {
      setError("Terjadi error. Silakan coba lagi.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test server connection
  const testServerConnection = async () => {
    try {
      setError("Testing server connection...");
      const response = await fetch("https://beckendflyio.vercel.app/");
      if (response.ok) {
        const data = await response.json();
        setError(`✅ Server is running: ${data.message}`);
      } else {
        setError("❌ Server responded with error");
      }
    } catch (error) {
      setError(
        "❌ Cannot connect to server. Please make sure backend is running on port 5000."
      );
    }
  };

  // ✅ FUNCTION UNTUK MANUAL SWITCH KE LOGIN
  const switchToLogin = () => {
    setIsLogin(true);
    setSuccessMessage("");
    setError("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isLogin ? "Login" : "Register"} </h1>
        <p>{isLogin ? "Hallo Uneffelas" : "Buat akun baru"}</p>
        <p>
          {isLogin
            ? "Masuk ke akun anda"
            : "Isi data diri Anda untuk membuat akun"}
        </p>

        {successMessage && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <div className="success-text">
              <p>{successMessage}</p>
              <small>
                Silakan login dengan username dan password yang sudah
                didaftarkan
              </small>
            </div>
            <button onClick={switchToLogin} className="go-to-login-btn">
              Login Sekarang
            </button>
          </div>
        )}
        {/* ERROR MESSAGE */}
        {error && !successMessage && (
          <div
            className={`error-message ${
              error.includes("✅") ? "success" : "error"
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ✅ LOGIN: Hanya Username & Password */}
          {isLogin ? (
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan username Anda"
                  autoComplete="username"
                  disabled={loading || successMessage}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan password Anda"
                  minLength="6"
                  autoComplete="current-password"
                  disabled={loading || successMessage}
                />
              </div>
            </>
          ) : (
            /* ✅ REGISTER: Tanpa Email */
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Pilih username unik"
                  autoComplete="username"
                  disabled={loading || successMessage}
                />
                <small className="input-help">
                  Username akan digunakan untuk login
                </small>
              </div>

              <div className="form-group">
                <label>Nomor Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="08xxxxxxxxxx"
                  autoComplete="tel"
                  disabled={loading || successMessage}
                />
                <small className="input-help">Contoh: 081234567890</small>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimal 6 karakter"
                  minLength="6"
                  autoComplete="new-password"
                  disabled={loading || successMessage}
                />
                <small className="input-help">
                  Password minimal 6 karakter
                </small>
              </div>
            </>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || successMessage}
          >
            {loading ? "Loading..." : isLogin ? "Login" : "Daftar"}
          </button>
        </form>

        {/* Debug Section */}
        <div className="debug-section">
          <button
            type="button"
            onClick={testServerConnection}
            className="test-connection-btn"
            disabled={loading}
          >
            Test Server Connection
          </button>

          <div className="server-info">
            <small>
               <strong>Hubungi Nomor dibawah ini, Jika ada kendala</strong>
               <br /> 
              <strong>Contact Person 1:</strong> 085732897364 (Fayla) 
              <br />
              <strong>Contact Person 2:</strong> 0895421423739 (Ratna)
            </small>
          </div>
        </div>

        <div className="auth-switch">
          <p>
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <span
              className="switch-link"
              onClick={() => {
                if (!successMessage) {
                  setIsLogin(!isLogin);
                  setError("");
                  // Reset form ketika switch
                  setFormData({
                    username: "",
                    password: "",
                    phone: "",
                  });
                }
              }}
            >
              {isLogin ? "Daftar di sini" : "Login di sini"}
            </span>
          </p>
        </div>

        {/* ✅ INFO TANPA EMAIL */}
        {!isLogin && (
          <div className="register-info">
            <small>
              📝 <strong>Info:</strong> Pendaftaran tanpa email. Gunakan
              username dan nomor telepon Anda.
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
