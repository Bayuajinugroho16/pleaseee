import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Movies API
export const moviesAPI = {
  getAll: () => api.get('/movies'),
  getById: (id) => api.get(`/movies/${id}`),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getByEmail: (email) => api.get(`/bookings?email=${email}`),
};

// Showtimes API
export const showtimesAPI = {
  getByMovie: (movieId) => api.get(`/showtimes/movie/${movieId}`),
  getById: (showtimeId) => api.get(`/showtimes/${showtimeId}`),
};

// **TAMBAHKAN INI - Payment & Upload APIs**
export const paymentAPI = {
  // Upload payment proof dengan FormData (file)
  uploadProof: (formData) => api.post('/upload/payment-proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),
  
  // Get payment status
  getStatus: (bookingReference) => api.get(`/payments/status/${bookingReference}`),
  
  // Get all payments (for admin)
  getAllPayments: () => api.get('/admin/payments'),
  
  // Get payment proof image
  getProof: (filename) => api.get(`/payments/proof/${filename}`),
};

// **TAMBAHKAN INI - Admin APIs**
export const adminAPI = {
  getAllBookings: () => api.get('/admin/bookings'),
  getAllPayments: () => api.get('/admin/payments'),
  verifyPayment: (bookingReference) => api.put(`/admin/payments/verify/${bookingReference}`),
  rejectPayment: (bookingReference) => api.put(`/admin/payments/reject/${bookingReference}`),
};


export default api;