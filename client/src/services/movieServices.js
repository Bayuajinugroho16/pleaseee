const API_BASE_URL = 'http://localhost:5000/api';

export const getMovies = async () => {
  try {
    console.log('🔄 Fetching movies from:', `${API_BASE_URL}/movies`);
    
    const response = await fetch(`${API_BASE_URL}/movies`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Movies API raw response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching movies:', error);
    
    // Fallback data jika API error
    return {
      success: true,
      data: [
        {
          id: 1,
          title: "Avengers: Endgame",
          genre: "Action",
          duration: "3h 1m",
          showtimes: ["10:00", "14:00", "18:00"],
          price: 50000,
          poster: "/images/movie1.jpg"
        },
        {
          id: 2,
          title: "The Batman",
          genre: "Action",
          duration: "2h 56m",
          showtimes: ["11:00", "15:00", "19:00"],
          price: 45000,
          poster: "/images/movie2.jpg"
        }
      ],
      total: 2,
      message: "Using fallback data"
    };
  }
};

export const getMovieById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${id}`);
    if (!response.ok) throw new Error('Movie not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching movie:', error);
    throw error;
  }
};