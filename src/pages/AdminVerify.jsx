import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import "./AdminVerify.css";

const AdminVerify = () => {
  const { user, token, isAdmin, getAuthHeaders, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bookings");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState({});

  const databaseTables = [
    { 
      key: "bookings", 
      name: "Bookings", 
      icon: "🎫", 
      endpoint: "/api/bookings", 
      auth: false 
    },
    { 
      key: "users", 
      name: "Users", 
      icon: "👥", 
      endpoint: "/api/users", 
      auth: true,
      adminOnly: true
    },
    { 
      key: "theaters", 
      name: "Theaters", 
      icon: "🎭", 
      endpoint: "/api/theaters", 
      auth: false 
    },
    { 
      key: "movies", 
      name: "Movies", 
      icon: "🎬", 
      endpoint: "/api/movies", 
      auth: false 
    },
    { 
      key: "showtimes", 
      name: "Showtimes", 
      icon: "🕒", 
      endpoint: "/api/showtimes", 
      auth: false 
    },
    { 
      key: "bundle_orders", 
      name: "Bundle Orders", 
      icon: "📦", 
      endpoint: "/api/admin/bundle-orders", 
      auth: true,
      adminOnly: true
    },
  ];

  const fetchTableData = async (tableName) => {
    try {
      setLoading(true);
      setError("");
      const tableConfig = databaseTables.find(t => t.key === tableName);
      
      if (!tableConfig) {
        setError(`Tabel ${tableName} tidak dikenali`);
        return;
      }

      // ✅ GUNAKAN getAuthHeaders() YANG SUDAH INCLUDE TOKEN
      const headers = getAuthHeaders();
      
      // ✅ CEK PERMISSION LEBIH KETAT
      if (tableConfig.auth && !token) {
        setError(`Login required untuk mengakses ${tableName}`);
        setLoading(false);
        return;
      }

      if (tableConfig.adminOnly && !isAdmin) {
        setError(`Hanya admin yang bisa mengakses ${tableName}. Role Anda: ${user?.role}`);
        setLoading(false);
        return;
      }

      console.log(`🔄 Fetching ${tableName} from:`, tableConfig.endpoint);
      console.log(`🔐 Auth required: ${tableConfig.auth}, Token: ${token ? 'Yes' : 'No'}`);
      console.log(`👑 Admin required: ${tableConfig.adminOnly}, Is Admin: ${isAdmin}`);
      console.log(`📨 Headers:`, headers);

      const response = await fetch(`https://beckendflyio.vercel.app${tableConfig.endpoint}`, {
        headers,
        method: 'GET'
      });

      console.log(`📡 Response status for ${tableName}:`, response.status);

      // Update debug info
      setDebugInfo({
        activeTab: tableName,
        endpoint: tableConfig.endpoint,
        authRequired: tableConfig.auth,
        adminRequired: tableConfig.adminOnly,
        hasToken: !!token,
        userRole: user?.role,
        isAdmin: isAdmin,
        responseStatus: response.status,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError(`Error 401: Unauthorized - Token tidak valid atau expired`);
          logout();
        } else if (response.status === 403) {
          setError(`Error 403: Forbidden - Hanya admin yang bisa mengakses ${tableName}`);
        } else if (response.status === 404) {
          setError(`Error 404: Endpoint ${tableConfig.endpoint} tidak ditemukan di server`);
        } else {
          setError(`Error ${response.status}: Gagal mengambil data ${tableName}`);
        }
        setTableData([]);
        return;
      }

      const result = await response.json();
      console.log(`✅ Success response for ${tableName}:`, result);

      if (result.success && result.data) {
        setTableData(result.data);
        setError("");
      } else {
        setError(`Server error: ${result.message || 'Tidak ada data yang ditemukan'}`);
        setTableData([]);
      }

    } catch (error) {
      console.error(`❌ Network error for ${tableName}:`, error);
      setError(`Network error: ${error.message}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ TEST TOKEN VALIDITY
  const testTokenValidity = async () => {
    if (!token) {
      alert('❌ Tidak ada token yang tersedia');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('https://beckendflyio.vercel.app/api/users', {
        headers
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`✅ Token VALID\nRole: ${user?.role}\nBisa akses data users`);
      } else {
        alert(`❌ Token INVALID\nError: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Error testing token: ${error.message}`);
    }
  };

  useEffect(() => {
    if (activeTab) {
      fetchTableData(activeTab);
    }
  }, [activeTab, token, user]);

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "bookings":
        return ["Reference", "Customer", "Movie", "Seats", "Amount", "Status", "Date"];
      case "users":
        return ["ID", "Username", "Email", "Role", "Phone", "Created"];
      case "theaters":
        return ["ID", "Name", "Location", "Capacity", "Screen Type"];
      case "movies":
        return ["ID", "Title", "Genre", "Duration", "Rating", "Release Date"];
      case "showtimes":
        return ["ID", "Movie", "Theater", "Showtime", "Price", "Available Seats"];
      case "bundle_orders":
        return ["Order Ref", "Customer", "Bundle", "Qty", "Total", "Status", "Date"];
      default:
        return [];
    }
  };

  const renderTableRows = () => {
    if (!tableData || tableData.length === 0) {
      return (
        <tr>
          <td colSpan={renderTableHeaders().length} className="no-data">
            {error ? error : "Tidak ada data yang ditemukan"}
          </td>
        </tr>
      );
    }

    return tableData.map((item, index) => {
      switch (activeTab) {
        case "bookings":
          return (
            <tr key={item.booking_reference || index}>
              <td className="reference">{item.booking_reference}</td>
              <td>
                <div>{item.customer_name}</div>
                <small>{item.customer_email}</small>
              </td>
              <td>{item.movie_title}</td>
              <td>
                {Array.isArray(item.seat_numbers) 
                  ? item.seat_numbers.join(", ")
                  : item.seat_numbers}
              </td>
              <td>Rp {item.total_amount?.toLocaleString()}</td>
              <td>
                <span className={`status-badge ${item.status}`}>
                  {item.status}
                </span>
              </td>
              <td>{new Date(item.booking_date).toLocaleDateString()}</td>
            </tr>
          );
        
        case "users":
          return (
            <tr key={item.id || index}>
              <td>{item.id}</td>
              <td>
                <div>{item.username}</div>
                {item.role === 'admin' && <small className="admin-badge">👑 Admin</small>}
              </td>
              <td>{item.email}</td>
              <td>
                <span className={`role-badge ${item.role}`}>
                  {item.role}
                </span>
              </td>
              <td>{item.phone || '-'}</td>
              <td>{new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          );
        
        case "theaters":
          return (
            <tr key={item.id || index}>
              <td>{item.id}</td>
              <td>{item.theater_name}</td>
              <td>{item.location}</td>
              <td>{item.capacity} seats</td>
              <td>{item.screen_type || 'Standard'}</td>
            </tr>
          );
        
        case "movies":
          return (
            <tr key={item.id || index}>
              <td>{item.id}</td>
              <td>
                <div>{item.title}</div>
                {item.genre && <small>{item.genre}</small>}
              </td>
              <td>{item.genre || '-'}</td>
              <td>{item.duration ? `${item.duration} min` : '-'}</td>
              <td>{item.rating || '-'}</td>
              <td>{item.release_date ? new Date(item.release_date).toLocaleDateString() : '-'}</td>
            </tr>
          );
        
        case "showtimes":
          return (
            <tr key={item.id || index}>
              <td>{item.id}</td>
              <td>{item.movie_title || `Movie ID: ${item.movie_id}`}</td>
              <td>{item.theater_name || `Theater ID: ${item.theater_id}`}</td>
              <td>{new Date(item.showtime).toLocaleString()}</td>
              <td>Rp {item.price?.toLocaleString() || '0'}</td>
              <td>{item.available_seats || '0'}</td>
            </tr>
          );
        
        case "bundle_orders":
          return (
            <tr key={item.order_reference || index}>
              <td className="reference">{item.order_reference}</td>
              <td>
                <div>{item.customer_name}</div>
                {item.customer_email && <small>{item.customer_email}</small>}
                {item.customer_phone && <small>📞 {item.customer_phone}</small>}
              </td>
              <td>
                <div>{item.bundle_name}</div>
                {item.bundle_description && <small>{item.bundle_description}</small>}
              </td>
              <td>{item.quantity}</td>
              <td>Rp {item.total_price?.toLocaleString()}</td>
              <td>
                <span className={`status-badge ${item.status}`}>
                  {item.status || 'pending'}
                </span>
              </td>
              <td>{new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          );
        
        default:
          return (
            <tr key={index}>
              <td colSpan={renderTableHeaders().length} className="no-data">
                Format data tidak dikenali
              </td>
            </tr>
          );
      }
    });
  };

  const refreshData = () => {
    fetchTableData(activeTab);
  };

  return (
    <div className="admin-verify-container">
      <Navigation />

      <div className="admin-content">
        <div className="admin-welcome">
          <h2>Selamat Datang, {user?.username}! 👋</h2>
          <p>
            Role: <span className={`role-badge ${user?.role}`}>{user?.role}</span> | 
            Token: {token ? "✅ Valid" : "❌ Missing"} |
            Admin: {isAdmin ? "✅ Yes" : "❌ No"}
          </p>
          {token && (
            <button onClick={testTokenValidity} className="test-token-btn">
              🧪 Test Token Validity
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <strong>Error:</strong> {error}
            </div>
            <div className="error-actions">
              <button onClick={refreshData} className="retry-btn">
                🔄 Coba Lagi
              </button>
              {error.includes('401') && (
                <button onClick={() => navigate('/login')} className="login-btn">
                  🔑 Login Kembali
                </button>
              )}
            </div>
          </div>
        )}

        {/* Database Section */}
        <div className="database-section">
          <div className="section-header">
            <h3>📊 Database Management</h3>
            <div className="header-actions">
              <span className="user-info">
                {user?.username} ({user?.role}) | Token: {token ? '✅' : '❌'} | Admin: {isAdmin ? '✅' : '❌'}
              </span>
              <button onClick={refreshData} className="refresh-btn" disabled={loading}>
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {/* Table Selection Tabs */}
          <div className="table-tabs">
            {databaseTables.map((table) => {
              const canAccess = table.auth ? token && (!table.adminOnly || isAdmin) : true;
              
              return (
                <button
                  key={table.key}
                  className={`tab-btn ${activeTab === table.key ? "active" : ""} ${
                    !canAccess ? "disabled" : ""
                  }`}
                  onClick={() => canAccess && setActiveTab(table.key)}
                  disabled={!canAccess}
                  title={!canAccess ? 
                    (table.auth && !token ? "Login required" : 
                     table.adminOnly && !isAdmin ? "Admin only" : "Access denied") 
                    : `View ${table.name}`
                  }
                >
                  <span className="tab-icon">{table.icon}</span>
                  {table.name}
                  {table.auth && <span className="auth-indicator">🔒</span>}
                  {table.adminOnly && <span className="admin-indicator">👑</span>}
                </button>
              );
            })}
          </div>

          {/* Data Table */}
          <div className="table-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Memuat data {activeTab}...</p>
              </div>
            ) : (
              <>
                <div className="table-info">
                  <p>
                    Menampilkan <strong>{tableData.length}</strong> records dari tabel{" "}
                    <strong>{activeTab}</strong>
                    {error && ` - ${error}`}
                  </p>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {renderTableHeaders().map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {renderTableRows()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="debug-info">
          <details>
            <summary>🐛 Debug Information</summary>
            <div className="debug-content">
              <p><strong>User:</strong> {user?.username} ({user?.role})</p>
              <p><strong>Token:</strong> {token ? `Present (${token.substring(0, 20)}...)` : 'Missing'}</p>
              <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>Active Tab:</strong> {debugInfo.activeTab}</p>
              <p><strong>Endpoint:</strong> {debugInfo.endpoint}</p>
              <p><strong>Response Status:</strong> {debugInfo.responseStatus}</p>
              <p><strong>Last Updated:</strong> {debugInfo.timestamp}</p>
              <button onClick={testTokenValidity} className="debug-btn-small">
                Test Token
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AdminVerify;