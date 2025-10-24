const API_BASE_URL = 'https://beckendflyio.vercel.app/api';

export const createBooking = async (bookingData) => {
  try {
    console.log('🎫 Creating booking:', bookingData);
    
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error(`Booking failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Booking response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Booking error:', error);
    throw error;
  }
};

export const getBookingByReference = async (reference) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${reference}`);
    if (!response.ok) throw new Error('Booking not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

export const verifyTicket = async (verificationCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verification_code: verificationCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Verification failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying ticket:', error);
    throw error;
  }
};


// **TAMBAHKAN FUNCTION INI - Upload Payment Proof**
export const uploadPaymentProof = async (bookingReference, file) => {
  try {
    console.log('📤 Uploading payment proof for:', bookingReference);
    
    const formData = new FormData();
    formData.append('payment_proof', file);
    formData.append('booking_reference', bookingReference);
    
    const response = await fetch(`${API_BASE_URL}/bookings/upload-payment`, {
      method: 'POST',
      body: formData,
      // JANGAN tambah Content-Type header, biarkan browser set otomatis
    });

    console.log('📥 Upload response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Upload response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

// **TAMBAHKAN INI - Confirm Payment**
export const confirmPayment = async (bookingData) => {
  try {
    console.log('💰 Confirming payment:', bookingData);
    
    const response = await fetch(`${API_BASE_URL}/bookings/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error(`Payment confirmation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Payment confirmation response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Payment confirmation error:', error);
    throw error;
  }
};

// **TAMBAHKAN INI - Get Payment Status**
export const getPaymentStatus = async (bookingReference) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/payment-status/${bookingReference}`);
    if (!response.ok) throw new Error('Payment status not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};