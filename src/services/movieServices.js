const API_BASE_URL = 'https://beckendflyio.vercel.app/api';

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
    
    // ✅ FALLBACK DATA DENGAN PATH RELATIVE
    return {
      success: true,
      data: [
        {
          id: 1,
          title: "Layar Kompetisi 1",
          genre: " ",
          duration: "3h 1m",
          showtimes: ["10:00", "14:00", "18:00"],
          price: 50000,
          poster: "/film/layar1.png"  // ✅ Path relative dari public folder
        },
        {
          id: 2,
          title: "Layar Kompetisi 2", 
          genre: "",
          duration: "2h 56m",
          showtimes: ["11:00", "15:00", "19:00"],
          price: 45000,
          poster: "/film/layar2.png"  // ✅ Path relative dari public folder
        },
        {
          id: 3,
          title: "Layar Kompetisi 3",
          genre: "",
          duration: "2h 28m", 
          showtimes: ["12:00", "16:00", "20:00"],
          price: 48000,
          poster: "/film/layar3.png"  // ✅ Path relative dari public folder
        },
        {
          id: 4,
          title: "Layar Kompetisi 4",
          genre: "", 
          duration: "2h 41m",
          showtimes: ["13:00", "17:00", "21:00"],
          price: 52000,
          poster: "/film/layar4.png"  // ✅ Path relative dari public folder
        }
      ],
      total: 4,
      message: "Using fallback data with assets images"
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