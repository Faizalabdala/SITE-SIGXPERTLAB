import axios from "axios";

const api = axios.create({
  // MUDANÇA AQUI: Trocamos 'localhost' por '127.0.0.1'
  baseURL: "http://127.0.0.1:3000",
});

// Interceptor para adicionar o Token automaticamente
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
