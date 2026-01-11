import axios from 'axios';

// export const API_URL = 'http://192.168.2.28:3000/api';

export const API_URL = 'https://api.coldbase.id.vn/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, 
});

// 3. Hàm Search (Cần cho HomeScreen)
export const searchVideo = async (query: string) => {
  try {
    const response = await api.get('/search', { 
      params: { query } 
    });
    return response.data;
  } catch (error) {
    console.error('Search Error:', error);
    return [];
  }
};

// 4. Hàm Trending (Ông vừa thêm)
export const getTrending = async () => {
  try {
    console.log("Fetching Trending...");
    const response = await api.get('/trending');
    return response.data;
  } catch (error) {
    console.error('Trending Error:', error);
    return [];
  }
};

export default api;