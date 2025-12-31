import axios from 'axios';

// 1. Khai báo URL Server (Thay IP nếu đổi VPS)
export const API_URL = 'http://192.168.1.135:3000/api';

// 2. Tạo instance axios (Cái mà ông thiếu nè)
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Timeout 10s cho chắc
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