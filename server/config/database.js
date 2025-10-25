import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// ✅ UNTUK RAILWAY - Support both Railway & custom variables
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};


const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('🔧 Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password
    });
  } else {
    console.log('✅ Connected to MySQL database on Render');
    console.log(`📊 Database: ${dbConfig.database}`);
    connection.release();
  }
});

// Enhanced connection test
const testConnection = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Connected to MySQL database successfully!');
      console.log(`📊 Database: ${dbConfig.database}`);
      console.log(`🌐 Host: ${dbConfig.host}`);
      console.log(`👤 User: ${dbConfig.user}`);
      console.log(`🔐 Has Password: ${!!dbConfig.password}`);
      
      // Simple SQL query
      connection.query('SELECT 1 + 1 AS test_result', (queryErr, results) => {
        if (queryErr) {
          console.error('❌ Query test failed:', queryErr.message);
        } else {
          console.log('✅ Database query test successful:', results[0].test_result);
        }
        connection.release();
      });
    }
  });
};

// Handle connection errors
pool.on('error', (err) => {
  console.error('💥 Database pool error:', err);
  
  // Try to reconnect after 2 seconds
  setTimeout(() => {
    console.log('🔄 Attempting to reconnect to database...');
    testConnection();
  }, 2000);
});

// Auto-test connection saat startup
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

// ✅ ES MODULES EXPORT
export { pool, testConnection };