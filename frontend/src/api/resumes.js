import client from './client';

export const fetchResumesList = async () => {
  const res = await client.get('/resumes');
  return res.data;
};

export const fetchResumeDetails = async (id) => {
  const res = await client.get(`/resumes/${id}`);
  return res.data;
};

export const uploadNewResume = async (file, targetRole) => {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("targetRole", targetRole);
  const res = await client.post('/resumes/upload', formData);
  return res.data;
};

export const uploadResumeVersion = async (id, file, targetRole) => {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("targetRole", targetRole);
  const res = await client.post(`/resumes/${id}/version`, formData);
  return res.data;
};

export const removeResume = async (id) => {
  const res = await client.delete(`/resumes/${id}`);
  return res.data;
};
