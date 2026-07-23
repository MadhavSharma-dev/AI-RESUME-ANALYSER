import client, { setAccessToken, clearAccessToken } from './client';

export const login = async (email, password) => {
  const res = await client.post('/auth/login', { email, password });
  if (res.data.accessToken) setAccessToken(res.data.accessToken);
  return res.data;
};

export const signup = async (name, email, password) => {
  const res = await client.post('/auth/signup', { name, email, password });
  if (res.data.accessToken) setAccessToken(res.data.accessToken);
  return res.data;
};

export const googleOAuthLogin = async (credential) => {
  const res = await client.post('/auth/google', { credential });
  if (res.data.accessToken) setAccessToken(res.data.accessToken);
  return res.data;
};

export const appleOAuthLogin = async (identityToken, user) => {
  const res = await client.post('/auth/apple', { identityToken, user });
  if (res.data.accessToken) setAccessToken(res.data.accessToken);
  return res.data;
};

export const logout = async () => {
  const res = await client.post('/auth/logout');
  clearAccessToken();
  return res.data;
};

export const getProfile = async () => {
  const res = await client.get('/auth/profile');
  return res.data;
};

export const refreshSession = async () => {
  const res = await client.post('/auth/refresh');
  if (res.data.accessToken) setAccessToken(res.data.accessToken);
  return res.data;
};
