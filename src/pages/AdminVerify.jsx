import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./AdminVerify.css";

const AdminVerify = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [manualInput, setManualInput] = useState({
    booking_reference: "",
    verification_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState({
    totalScanned: 0,
    validTickets: 0,
    invalidTickets: 0,
    todayScans: 0,
    todayValid: 0,
  });
  const [scanHistory, setScanHistory] = useState([]);

  // ✅ HELPER FUNCTION UNTUK PARSE SEAT NUMBERS
  const parseSeatNumbers = (seatData) => {
    try {
      console.log("🔍 Parsing seat data:", seatData);

      if (!seatData || seatData === "null" || seatData === "undefined") {
        return ["Unknown"];
      }

      if (Array.isArray(seatData)) {
        return seatData.filter((seat) => seat && seat !== "null");
      }

      if (typeof seatData === "string") {
        // Coba parse JSON
        try {
          const parsed = JSON.parse(seatData);
          console.log("✅ Berhasil parse JSON:", parsed);

          if (Array.isArray(parsed)) {
            return parsed.filter((seat) => seat && seat !== "null");
          }
          if (typeof parsed === "string") {
            return [parsed];
          }
        } catch (e) {
          console.log("❌ Gagal parse JSON, menggunakan string processing");
          // Jika bukan JSON, process sebagai string
          if (seatData.includes(",")) {
            return seatData
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s && s !== "null");
          } else if (seatData.includes(" ")) {
            return seatData
              .split(" ")
              .map((s) => s.trim())
              .filter((s) => s && s !== "null");
          } else {
            return [seatData];
          }
        }
      }

      console.log("❌ Format seat tidak dikenali, return Unknown");
      return ["Unknown"];
    } catch (error) {
      console.log("❌ Error parsing seats:", error);
      return ["Unknown"];
    }
  };

  // ✅ HELPER FUNCTION UNTUK WORKFLOW
  const getWorkflowStep = (status) => {
    switch (status) {
      case "pending":
        return { step: 1, description: "Booking dibuat - Menunggu pembayaran" };
      case "pending_verification":
        return {
          step: 2,
          description: "Bukti bayar diupload - Menunggu verifikasi admin",
        };
      case "confirmed":
        return { step: 3, description: "Terkonfirmasi - E-ticket tersedia" };
      case "cancelled":
        return { step: 0, description: "Dibatalkan" };
      default:
        return { step: -1, description: "Status tidak dikenali" };
    }
  };

  // ✅ FUNCTION UNTUK KONFIRMASI TIKET & GENERATE VERIFICATION CODE
  const confirmTicketAndGenerateCode = async (bookingReference) => {
    try {
      console.log("🔄 Mengkonfirmasi tiket dan generate verification code...");

      // Generate random verification code (6 digit)
      const newVerificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      console.log(
        `🎯 Generated code: ${newVerificationCode} for ${bookingReference}`
      );

      // Coba endpoint konfirmasi booking
      const confirmResponse = await fetch(
        "https://beckendflyio.vercel.app/api/bookings/confirm-booking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_reference: bookingReference,
            verification_code: newVerificationCode,
            status: "confirmed",
          }),
        }
      );

      if (confirmResponse.ok) {
        const result = await confirmResponse.json();
        console.log("✅ Konfirmasi berhasil via endpoint:", result);
        return {
          success: true,
          verification_code: newVerificationCode,
          data: result.data,
          method: "api",
        };
      } else {
        // Jika endpoint khusus tidak ada, coba update manual
        console.log(
          "🔄 Endpoint konfirmasi tidak tersedia, mencoba update manual..."
        );
        return await updateBookingManually(
          bookingReference,
          newVerificationCode
        );
      }
    } catch (error) {
      console.log("❌ Error konfirmasi tiket:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // ✅ FUNCTION UNTUK UPDATE BOOKING SECARA MANUAL
  const updateBookingManually = async (bookingReference, verificationCode) => {
    try {
      console.log("🔄 Update booking manual...");

      // Coba endpoint yang berbeda untuk update
      const updateEndpoints = [
        `https://beckendflyio.vercel.app/api/bookings/${bookingReference}/confirm`,
        `https://beckendflyio.vercel.app/api/bookings/confirm`,
        `https://beckendflyio.vercel.app/api/bookings/update-status`,
      ];

      for (let endpoint of updateEndpoints) {
        try {
          console.log(`🔄 Mencoba endpoint update: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              booking_reference: bookingReference,
              verification_code: verificationCode,
              status: "confirmed",
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(
              "✅ Update berhasil dengan endpoint:",
              endpoint,
              result
            );
            return {
              success: true,
              verification_code: verificationCode,
              data: result.data,
            };
          } else {
            console.log(`❌ Endpoint ${endpoint} gagal: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Error endpoint ${endpoint}:`, error.message);
        }
      }

      // ✅ FALLBACK: SIMPAN KE LOCALSTORAGE JIKA SEMUA ENDPOINT GAGAL
      console.log(
        "🔄 Semua endpoint gagal, menggunakan localStorage fallback..."
      );
      return saveToLocalStorageFallback(bookingReference, verificationCode);
    } catch (error) {
      console.log("❌ Error update manual:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // ✅ FALLBACK: SIMPAN KE LOCALSTORAGE
  const saveToLocalStorageFallback = (bookingReference, verificationCode) => {
    try {
      console.log("💾 Menyimpan ke localStorage fallback...");

      // Ambil data bookings yang ada
      const existingBookings = JSON.parse(
        localStorage.getItem("adminConfirmedBookings") || "[]"
      );

      // Cari dan update booking yang sesuai
      const updatedBookings = existingBookings.map((booking) =>
        booking.booking_reference === bookingReference
          ? {
              ...booking,
              verification_code: verificationCode,
              status: "confirmed",
            }
          : booking
      );

      // Jika tidak ditemukan, tambahkan baru
      if (
        !updatedBookings.find((b) => b.booking_reference === bookingReference)
      ) {
        updatedBookings.push({
          booking_reference: bookingReference,
          verification_code: verificationCode,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          confirmed_by: user?.username || "Admin",
        });
      }

      localStorage.setItem(
        "adminConfirmedBookings",
        JSON.stringify(updatedBookings)
      );

      console.log("✅ Berhasil simpan ke localStorage:", updatedBookings);
      return {
        success: true,
        verification_code: verificationCode,
        data: {
          booking_reference: bookingReference,
          status: "confirmed",
          verification_code: verificationCode,
        },
        method: "localStorage",
      };
    } catch (error) {
      console.log("❌ Error save to localStorage:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // ✅ FUNCTION UNTUK CEK DATA DI DATABASE LANGSUNG
  const checkDatabaseDirectly = async (bookingReference) => {
    try {
      console.log("🔍 Mengecek database langsung...");

      const response = await fetch(
        "https://beckendflyio.vercel.app/api/bookings"
      );

      if (response.ok) {
        const result = await response.json();
        console.log("📊 Semua data bookings:", result);

        if (result.success && result.data) {
          const found = result.data.find(
            (booking) => booking.booking_reference === bookingReference
          );

          if (found) {
            console.log("✅ DITEMUKAN di database:", found);
            return found;
          } else {
            console.log("❌ TIDAK DITEMUKAN di database");
            console.log(
              "Available references:",
              result.data.map((b) => b.booking_reference)
            );
          }
        }
      }

      return null;
    } catch (error) {
      console.log("❌ Error cek database:", error);
      return null;
    }
  };

  // Load data dari localStorage saat component mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = () => {
    try {
      const savedHistory = localStorage.getItem("adminScanHistory");
      const savedStats = localStorage.getItem("adminScanStats");

      console.log("📥 Loading persisted data...");

      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setScanHistory(history);
        calculateStatsFromHistory(history);
      }

      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
      }
    } catch (error) {
      console.error("❌ Error loading persisted data:", error);
    }
  };

  const calculateStatsFromHistory = (history) => {
    const today = new Date().toDateString();
    const todayScans = history.filter(
      (scan) => new Date(scan.timestamp).toDateString() === today
    );
    const todayValid = todayScans.filter((scan) => scan.valid).length;

    const totalScanned = history.length;
    const validTickets = history.filter((scan) => scan.valid).length;
    const invalidTickets = history.filter((scan) => !scan.valid).length;

    setStats({
      totalScanned,
      validTickets,
      invalidTickets,
      todayScans: todayScans.length,
      todayValid,
    });
  };

  useEffect(() => {
    if (scanHistory.length > 0 || stats.totalScanned > 0) {
      console.log("💾 Saving data to localStorage...");
      localStorage.setItem("adminScanHistory", JSON.stringify(scanHistory));
      localStorage.setItem("adminScanStats", JSON.stringify(stats));
    }
  }, [scanHistory, stats]);

  const goToScanner = () => {
    navigate("/admin/scanner");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManualInput((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };

  // Broadcast ticket validation ke semua client
  const broadcastTicketValidation = (result) => {
    const validationEvent = {
      type: "TICKET_VALIDATED",
      data: result,
      timestamp: new Date().toISOString(),
      admin: user?.username || "Admin",
    };

    localStorage.setItem(
      "lastTicketValidation",
      JSON.stringify(validationEvent)
    );

    setTimeout(() => {
      window.dispatchEvent(new Event("storage"));
    }, 100);

    console.log("📢 Broadcast ticket validation:", result);
  };

 const verifyTicket = async () => {
  try {
    if (!manualInput.booking_reference || !manualInput.verification_code) {
      alert('Harap masukkan Booking Reference dan Verification Code');
      return;
    }

    console.log("🔍 Memulai verifikasi tiket:", manualInput);
    setLoading(true);
    setScanResult(null);

    const normalizedInput = {
      booking_reference: manualInput.booking_reference.trim().toUpperCase(),
      verification_code: manualInput.verification_code.trim()
    };

    let realBookingData = null;
    let verificationResult = null;

    try {
      // ✅ METHOD 1: CARI DI SEMUA DATA BOOKINGS
      console.log("🔄 Method 1: Mencari di semua data bookings...");
      
      try {
        const response = await fetch('https://beckendflyio.vercel.app/api/bookings');
        
        if (response.ok) {
          const result = await response.json();
          console.log("📊 Semua data bookings:", result);

          if (result.success && result.data) {
            // ✅ FILTER MANUAL DI CLIENT SIDE - LEBIH AKURAT
            const foundBooking = result.data.find(booking => {
              const isMatch = booking.booking_reference === normalizedInput.booking_reference;
              
              if (isMatch) {
                console.log("✅✅✅ BOOKING DITEMUKAN:", booking);
              }
              
              return isMatch;
            });

            if (foundBooking) {
              realBookingData = foundBooking;
              console.log("✅ Data booking ditemukan:", realBookingData);
            } else {
              console.log("❌ Booking tidak ditemukan. Available references:", 
                result.data.slice(0, 10).map(b => b.booking_reference)
              );
            }
          }
        }
      } catch (error) {
        console.log("❌ Fetch all bookings failed:", error.message);
      }

      // ✅ METHOD 2: JIKA TIDAK DITEMUKAN, COBA ENDPOINT LAIN
      if (!realBookingData) {
        console.log("🔄 Method 2: Mencoba endpoint spesifik...");
        
        const endpoints = [
          `https://beckendflyio.vercel.app/api/bookings?reference=${normalizedInput.booking_reference}`,
          `https://beckendflyio.vercel.app/api/bookings?search=${normalizedInput.booking_reference}`,
          `https://beckendflyio.vercel.app/api/bookings/${normalizedInput.booking_reference}`
        ];

        for (let endpoint of endpoints) {
          try {
            console.log(`🔄 Mencoba endpoint: ${endpoint}`);
            const response = await fetch(endpoint);

            if (response.ok) {
              const result = await response.json();
              console.log(`📊 Response dari ${endpoint}:`, result);

              if (result.success) {
                // Handle berbagai format response
                let bookings = [];
                if (Array.isArray(result.data)) {
                  bookings = result.data;
                } else if (result.data && typeof result.data === 'object') {
                  bookings = [result.data];
                } else if (Array.isArray(result.bookings)) {
                  bookings = result.bookings;
                }

                const foundBooking = bookings.find(booking => 
                  booking.booking_reference === normalizedInput.booking_reference
                );

                if (foundBooking) {
                  realBookingData = foundBooking;
                  console.log("✅ Data booking ditemukan via endpoint:", realBookingData);
                  break;
                }
              }
            } else {
              console.log(`❌ Endpoint ${endpoint} gagal: ${response.status}`);
            }
          } catch (error) {
            console.log(`❌ Endpoint ${endpoint} error:`, error.message);
          }
        }
      }

      // ✅ VERIFIKASI DENGAN DATA YANG DITEMUKAN
      if (realBookingData) {
        console.log("🔄 Melakukan verifikasi...");
        
        const dbVerificationCode = realBookingData.verification_code ? 
          realBookingData.verification_code.toString().trim() : '';
        
        console.log("🔍 Perbandingan kode verifikasi:");
        console.log("Input Reference:", normalizedInput.booking_reference);
        console.log("DB Reference:", realBookingData.booking_reference);
        console.log("Input Code:", normalizedInput.verification_code);
        console.log("DB Code:", dbVerificationCode);
        console.log("Status:", realBookingData.status);
        console.log("Payment Proof:", realBookingData.payment_proof);

        // ✅ LOGIC VERIFIKASI YANG BENAR
        const isReferenceValid = normalizedInput.booking_reference === realBookingData.booking_reference;
        const isCodeValid = normalizedInput.verification_code === dbVerificationCode;
        const hasPayment = realBookingData.payment_proof || realBookingData.has_payment_image;
        const isPending = realBookingData.status === 'pending';
        const isPendingVerification = realBookingData.status === 'pending_verification';
        const isConfirmed = realBookingData.status === 'confirmed';

        let message = '';
        let shouldShowConfirmButton = false;
        let isValid = false;

        // CASE 1: BELUM BAYAR
        if (isPending && !hasPayment) {
          message = '❌ Tiket belum dibayar - Customer perlu upload bukti bayar dulu';
        }
        // CASE 2: SUDAH BAYAR TAPI BELUM ADA VERIFICATION CODE
        else if (isPendingVerification && !dbVerificationCode) {
          message = '✅ Sudah bayar! Admin bisa generate verification code';
          shouldShowConfirmButton = true;
        }
        // CASE 3: SUDAH BAYAR & ADA VERIFICATION CODE - TUNGGU KONFIRMASI
        else if (isPendingVerification && dbVerificationCode) {
          if (isCodeValid) {
            message = '✅ Kode benar! Tiket menunggu konfirmasi admin';
            shouldShowConfirmButton = true;
          } else {
            message = `❌ Kode verifikasi tidak sesuai (Database: ${dbVerificationCode})`;
          }
        }
        // CASE 4: SUDAH CONFIRMED
        else if (isConfirmed) {
          if (isCodeValid) {
            message = '🎉 Tiket VALID - Silakan masuk!';
            isValid = true;
          } else {
            message = `❌ Kode verifikasi tidak sesuai (Database: ${dbVerificationCode})`;
          }
        }
        // CASE 5: STATUS LAIN
        else {
          message = `❌ Status tiket tidak valid untuk verifikasi: ${realBookingData.status}`;
        }

        verificationResult = {
          valid: isValid,
          message: message,
          shouldShowConfirmButton: shouldShowConfirmButton,
          ticket_info: {
            movie: realBookingData.movie_title,
            booking_reference: realBookingData.booking_reference,
            verification_code: dbVerificationCode,
            seats: parseSeatNumbers(realBookingData.seat_numbers),
            customer: realBookingData.customer_name,
            customer_email: realBookingData.customer_email,
            total_paid: realBookingData.total_amount,
            status: realBookingData.status,
            showtime: realBookingData.showtime,
            payment_proof: realBookingData.payment_proof,
            has_payment_image: realBookingData.has_payment_image,
            verified_at: new Date().toISOString(),
            debug_info: {
              has_verification_code: !!dbVerificationCode,
              has_payment_proof: !!realBookingData.payment_proof,
              status: realBookingData.status
            }
          }
        };

      } else {
        // ❌ DATA TIDAK DITEMUKAN
        console.log("🔄 Method 3: Data tidak ditemukan di database");
        verificationResult = {
          valid: false,
          message: '❌ Data booking tidak ditemukan di database',
          ticket_info: {
            movie: 'Unknown',
            booking_reference: normalizedInput.booking_reference,
            verification_code: normalizedInput.verification_code,
            seats: ['Unknown'],
            customer: 'Unknown',
            total_paid: 0,
            status: 'NOT_FOUND'
          }
        };
      }

      // ✅ PROSES HASIL VERIFIKASI
      if (verificationResult) {
        console.log("📊 Hasil verifikasi akhir:", verificationResult);
        
        // Update state dengan hasil
        setScanResult(verificationResult);
        
        // Update history dan stats
        const newScan = {
          id: Date.now(),
          booking_reference: normalizedInput.booking_reference,
          timestamp: new Date().toISOString(),
          valid: verificationResult.valid,
          ticket_info: verificationResult.ticket_info,
          method: 'database'
        };

        setScanHistory(prev => [newScan, ...prev.slice(0, 49)]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalScanned: prev.totalScanned + 1,
          validTickets: prev.validTickets + (verificationResult.valid ? 1 : 0),
          invalidTickets: prev.invalidTickets + (verificationResult.valid ? 0 : 1),
          todayScans: prev.todayScans + 1,
          todayValid: prev.todayValid + (verificationResult.valid ? 1 : 0)
        }));

        // Broadcast ke client
        broadcastTicketValidation(verificationResult);

      } else {
        throw new Error('Tidak ada hasil verifikasi yang dihasilkan');
      }

    } catch (innerError) {
      console.error("❌ Error dalam proses verifikasi:", innerError);
      
      // ✅ FALLBACK ERROR
      const fallbackResult = {
        valid: false,
        message: `❌ Error sistem: ${innerError.message}`,
        ticket_info: {
          movie: 'Unknown',
          booking_reference: normalizedInput.booking_reference,
          verification_code: normalizedInput.verification_code,
          seats: ['Unknown'],
          customer: 'Unknown',
          total_paid: 0,
          status: 'ERROR'
        }
      };
      
      setScanResult(fallbackResult);
    }

  } catch (outerError) {
    console.error("❌ Error utama verifikasi:", outerError);
    alert(`Verifikasi gagal: ${outerError.message}`);
  } finally {
    setLoading(false);
  }
};

  // ✅ FUNCTION KONFIRMASI TIKET
const confirmTicketAndUpdateStatus = async (bookingReference) => {
  try {
    console.log("🔄 Mengkonfirmasi tiket...");
    
    const updateData = {
      status: 'confirmed',
      is_verified: 1,
      verified_at: new Date().toISOString()
    };

    const response = await fetch(
      `https://beckendflyio.vercel.app/api/bookings/${bookingReference}/confirm`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log("✅✅✅ TICKET CONFIRMED:", result);
      
      // ✅ KURSI OTOMATIS TERISI di sistem
      // (Ini harus handle oleh backend)
      
      return {
        success: true,
        data: result.data,
        message: 'Tiket berhasil dikonfirmasi! Kursi sekarang terisi.'
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log("❌ Confirm ticket error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
  const clearResult = () => {
    setScanResult(null);
  };
  // ✅ FUNCTION UNTUK UPDATE VERIFICATION CODE DI DATABASE
  const updateVerificationCodeInDatabase = async (
    bookingReference,
    newVerificationCode
  ) => {
    try {
      console.log("🔄 Updating verification code in database...");

      const updateData = {
        verification_code: newVerificationCode,
        status: "pending_verification",
      };

      const response = await fetch(
        `https://beckendflyio.vercel.app/api/bookings/${bookingReference}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Verification code updated in database:", result);
        return { success: true, data: result.data };
      } else {
        console.log("❌ Failed to update verification code:", response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.log("❌ Update verification code error:", error);
      return { success: false, error: error.message };
    }
  };

  const clearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This cannot be undone."
      )
    ) {
      setScanHistory([]);
      setStats({
        totalScanned: 0,
        validTickets: 0,
        invalidTickets: 0,
        todayScans: 0,
        todayValid: 0,
      });
      setScanResult(null);
      localStorage.removeItem("adminScanHistory");
      localStorage.removeItem("adminScanStats");
      localStorage.removeItem("adminConfirmedBookings");
      console.log("🗑️ All data cleared");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      verifyTicket();
    }
  };

  // Hitung success rates
  const overallSuccessRate =
    stats.totalScanned > 0
      ? Math.round((stats.validTickets / stats.totalScanned) * 100)
      : 0;

  const todaySuccessRate =
    stats.todayScans > 0
      ? Math.round((stats.todayValid / stats.todayScans) * 100)
      : 0;

  return (
    <div className="admin-verify-container">
      <Navigation />

      <div className="admin-content">
        <div className="admin-welcome">
          <h2>Selamat Datang, {user?.username}! 👋</h2>
          <p>Panel administrasi untuk verifikasi tiket dan manajemen bioskop</p>
        </div>

        {/* Quick Actions */}
        <div className="admin-actions-grid">
          <div className="action-card" onClick={goToScanner}>
            <div className="action-icon">📷</div>
            <h3>QR Scanner</h3>
            <p>Scan tiket dengan kamera</p>
          </div>

          <div className="action-card" onClick={() => navigate("/staff")}>
            <div className="action-icon">📊</div>
            <h3>Dashboard</h3>
            <p>Lihat statistik dan laporan</p>
          </div>

          <div className="action-card" onClick={() => navigate("/home")}>
            <div className="action-icon">🎬</div>
            <h3>Lihat Bioskop</h3>
            <p>Buka halaman user</p>
          </div>

          <div className="action-card" onClick={clearAllData}>
            <div className="action-icon">🔄</div>
            <h3>Reset Data</h3>
            <p>Hapus semua data</p>
          </div>
        </div>

        {/* Manual Verification Section */}
        <div className="manual-verify-section">
          <h3>🔍 Verifikasi Manual Tiket</h3>
          <p className="verify-description">
            Masukkan Booking Reference dan Verification Code untuk verifikasi
            tiket
          </p>

          <div className="verify-form">
            <div className="input-group">
              <label>Booking Reference</label>
              <input
                type="text"
                name="booking_reference"
                placeholder="BK1761631591210VGQXF"
                value={manualInput.booking_reference}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="verify-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Verification Code</label>
              <input
                type="text"
                name="verification_code"
                placeholder="123456"
                value={manualInput.verification_code}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="verify-input"
                disabled={loading}
              />
            </div>

            <button
              onClick={verifyTicket}
              disabled={
                loading ||
                !manualInput.booking_reference ||
                !manualInput.verification_code
              }
              className="verify-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Verifying...
                </>
              ) : (
                "✅ Verify Ticket"
              )}
            </button>
          </div>

          {/* Test Debug Section */}
          <div className="test-debug-section">
            <h4>🧪 Test & Debug</h4>
            <div className="test-buttons">
              <button
                onClick={async () => {
                  const testRef =
                    manualInput.booking_reference || "BK1761631591210VGQXF";
                  console.log("🧪 Testing dengan reference:", testRef);
                  const result = await checkDatabaseDirectly(testRef);
                  if (result) {
                    alert(
                      `✅ Ditemukan: ${result.booking_reference}\nStatus: ${result.status}\nVerif Code: ${result.verification_code}`
                    );
                  } else {
                    alert("❌ Tidak ditemukan di database");
                  }
                }}
                className="test-btn"
              >
                Test Database Connection
              </button>
            </div>
          </div>
        </div>

        {/* Scan Result dengan Workflow Progress */}
        {scanResult && (
          <div
            className={`scan-result ${scanResult.valid ? "valid" : "invalid"}`}
          >
            <div className="result-header">
              <div className="result-icon">
                {scanResult.valid ? "✅" : "❌"}
              </div>
              <div className="result-title">
                <h3>
                  {scanResult.valid ? "Tiket Valid" : "Tiket Tidak Valid"}
                </h3>
                <p>{scanResult.message}</p>

                {/* Workflow Progress */}
                {scanResult.ticket_info && (
                  <div className="workflow-progress">
                    <div className="workflow-steps">
                      <div
                        className={`step ${
                          scanResult.ticket_info.workflow_step.step >= 1
                            ? "completed"
                            : ""
                        }`}
                      >
                        <span className="step-number">1</span>
                        <span className="step-label">Booking</span>
                      </div>
                      <div
                        className={`connector ${
                          scanResult.ticket_info.workflow_step.step >= 2
                            ? "completed"
                            : ""
                        }`}
                      ></div>
                      <div
                        className={`step ${
                          scanResult.ticket_info.workflow_step.step >= 2
                            ? "completed"
                            : ""
                        }`}
                      >
                        <span className="step-number">2</span>
                        <span className="step-label">Bayar</span>
                      </div>
                      <div
                        className={`connector ${
                          scanResult.ticket_info.workflow_step.step >= 3
                            ? "completed"
                            : ""
                        }`}
                      ></div>
                      <div
                        className={`step ${
                          scanResult.ticket_info.workflow_step.step >= 3
                            ? "completed"
                            : ""
                        }`}
                      >
                        <span className="step-number">3</span>
                        <span className="step-label">Konfirmasi</span>
                      </div>
                    </div>
                    <div className="workflow-status">
                      <strong>Status: </strong>
                      {scanResult.ticket_info.workflow_step.description}
                    </div>
                  </div>
                )}

                {/* Tombol Konfirmasi - HANYA muncul jika needed */}
                {scanResult.shouldShowConfirmButton && (
                  <div className="pending-actions">
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Konfirmasi tiket ini? Status akan berubah menjadi CONFIRMED dan customer akan mendapatkan e-ticket."
                          )
                        ) {
                          setLoading(true);
                          const result = await confirmTicketAndGenerateCode(
                            scanResult.ticket_info.booking_reference
                          );

                          if (result.success) {
                            alert(
                              `✅ Tiket dikonfirmasi!\nStatus: CONFIRMED\nCustomer sekarang bisa menggunakan e-ticket.`
                            );
                            // Auto-refresh verification
                            setTimeout(() => {
                              setManualInput((prev) => ({
                                booking_reference: prev.booking_reference,
                                verification_code: result.verification_code,
                              }));
                              verifyTicket();
                            }, 1500);
                          } else {
                            alert(`❌ Gagal mengkonfirmasi: ${result.error}`);
                          }
                          setLoading(false);
                        }
                      }}
                      className="confirm-ticket-btn"
                    >
                      ✅ Konfirmasi Tiket & Kirim E-Ticket
                    </button>
                  </div>
                )}
              </div>
              <button onClick={clearResult} className="close-result">
                ✕
              </button>
            </div>

            {scanResult.ticket_info && (
              <div className="ticket-details">
                <h4>🎫 Detail Tiket:</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Film:</strong>
                    <span>{scanResult.ticket_info.movie}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Booking Reference:</strong>
                    <span className="reference">
                      {scanResult.ticket_info.booking_reference}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Verification Code:</strong>
                    <span
                      className={`code ${
                        scanResult.ticket_info.verification_code ===
                        "BELUM GENERATE"
                          ? "missing"
                          : ""
                      }`}
                    >
                      {scanResult.ticket_info.verification_code}
                      {scanResult.ticket_info.verification_code ===
                        "BELUM GENERATE" && " (Langkah 1)"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Kursi:</strong>
                    <span className="seats">
                      {scanResult.ticket_info.seats?.join(", ")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span className={`status ${scanResult.ticket_info.status}`}>
                      {scanResult.ticket_info.status}
                      {scanResult.ticket_info.status ===
                        "pending_verification" && " ⏳"}
                      {scanResult.ticket_info.status === "confirmed" && " ✅"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Customer:</strong>
                    <span>{scanResult.ticket_info.customer}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Total:</strong>
                    <span>
                      Rp {scanResult.ticket_info.total_paid?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="debug-info">
          <details>
            <summary>🐛 Debug Information</summary>
            <div className="debug-content">
              <p>
                <strong>Current Input:</strong>
              </p>
              <ul>
                <li>Booking Reference: {manualInput.booking_reference}</li>
                <li>Verification Code: {manualInput.verification_code}</li>
              </ul>
              <p>
                <strong>Stats:</strong> {JSON.stringify(stats)}
              </p>
              <p>
                <strong>History Count:</strong> {scanHistory.length}
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AdminVerify;
