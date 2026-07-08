const API_URL = "http://localhost:5001/api";

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers
  };

  // Attach token if logged in
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Multer FormData requires standard browser boundary headers, don't set manually
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
};

export const login = (email, password) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const signup = (name, email, password) =>
  apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });

export const getProfile = () =>
  apiFetch("/auth/profile");

export const fetchResumesList = () =>
  apiFetch("/resumes");

export const fetchResumeDetails = (id) =>
  apiFetch(`/resumes/${id}`);

export const uploadNewResume = (file, targetRole) => {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("targetRole", targetRole);
  return apiFetch("/resumes", {
    method: "POST",
    body: formData
  });
};

export const uploadResumeVersion = (id, file, targetRole) => {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("targetRole", targetRole);
  return apiFetch(`/resumes/${id}/version`, {
    method: "POST",
    body: formData
  });
};

export const removeResume = (id) =>
  apiFetch(`/resumes/${id}`, {
    method: "DELETE"
  });
