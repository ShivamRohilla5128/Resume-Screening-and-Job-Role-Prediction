import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api", timeout: 120000 });
export const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
export const setToken = (t, remember) => { clearToken(); (remember ? localStorage : sessionStorage).setItem("token", t); };
export const clearToken = () => { localStorage.removeItem("token"); sessionStorage.removeItem("token"); };

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use((r) => r, (err) => {
  const url = err.config?.url || "";
  if (err.response?.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register")) {
    clearToken();
    if (!["/login", "/signup", "/"].includes(window.location.pathname)) window.location.assign("/login");
  }
  return Promise.reject(err);
});

const d = (p) => p.then((r) => r.data);
export const auth = {
  register: (b) => d(api.post("/auth/register", b)),
  login: (b) => d(api.post("/auth/login", b)),
  me: () => d(api.get("/auth/me")),
  forgot: (email) => d(api.post("/auth/forgot-password", { email })),
  reset: (token, password) => d(api.post("/auth/reset-password", { token, password })),
};
export const meta = { roles: () => d(api.get("/meta/roles")), metrics: () => d(api.get("/ml/metrics")) };
export const resume = {
  upload: (files, onProgress) => {
    const fd = new FormData(); files.forEach((f) => fd.append("files", f));
    return d(api.post("/resume/upload", fd, { onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0) }));
  },
  analyze: (resume_id, job_role) => d(api.post("/resume/analyze", { resume_id, job_role: job_role || null })),
  predict: (resume_id) => d(api.post("/predict/job-role", { resume_id })),
  match: (body) => d(api.post("/match/job-description", body)),
  gap: (resume_id, job_role) => d(api.post("/skills/gap-analysis", { resume_id, job_role })),
  improve: (resume_id, job_role) => d(api.post("/resume/improve", { resume_id, job_role: job_role || null })),
};
export const screening = {
  rank: (files, { job_description, required_skills, job_role }, onProgress) => {
    const fd = new FormData(); files.forEach((f) => fd.append("files", f));
    fd.append("job_description", job_description || ""); fd.append("required_skills", required_skills || ""); fd.append("job_role", job_role || "");
    return d(api.post("/screening/rank", fd, { onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0) }));
  },
};
export const history = {
  list: () => d(api.get("/history")),
  get: (id) => d(api.get(`/history/${id}`)),
  remove: (id) => d(api.delete(`/history/${id}`)),
  report: (id) => api.get(`/report/${id}`, { responseType: "blob" }).then((r) => r.data),
  stats: () => d(api.get("/dashboard/stats")),
};
export default api;
