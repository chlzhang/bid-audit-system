import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData);
  },
  register: (data: { username: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const templateAPI = {
  list: () => api.get('/templates/'),
  get: (id: number) => api.get(`/templates/${id}`),
  create: (formData: FormData) =>
    api.post('/templates/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) => api.delete(`/templates/${id}`),
};

export const projectAPI = {
  list: () => api.get('/projects/'),
  get: (id: number) => api.get(`/projects/${id}`),
  create: (formData: FormData) =>
    api.post('/projects/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

export const auditAPI = {
  start: (projectId: number) => api.post('/audit/start', { project_id: projectId }),
  listRecords: (projectId?: number) =>
    api.get('/audit/records/', { params: projectId ? { project_id: projectId } : {} }),
  getRecord: (id: number) => api.get(`/audit/records/${id}`),
  getReport: (id: number) => api.get(`/audit/records/${id}/report`),
};

export const ruleAPI = {
  list: (category?: string) =>
    api.get('/rules/', { params: category ? { category } : {} }),
  get: (id: number) => api.get(`/rules/${id}`),
  create: (data: any) => api.post('/rules/', data),
  update: (id: number, data: any) => api.put(`/rules/${id}`, data),
  delete: (id: number) => api.delete(`/rules/${id}`),
};

export default api;
