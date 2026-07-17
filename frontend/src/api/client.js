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

export default client;
