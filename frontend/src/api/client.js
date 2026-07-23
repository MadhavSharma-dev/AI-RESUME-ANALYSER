import axios from 'axios';

let currentToken = null;

export const setAccessToken = (token) => {
  currentToken = token;
};

export const clearAccessToken = () => {
  currentToken = null;
};

const client = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          'http://localhost:5001/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return client(originalRequest);
        }
      } catch (refreshErr) {
        clearAccessToken();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
