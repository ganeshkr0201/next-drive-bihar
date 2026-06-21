import api from '../config/axios.js';

export const getAllDrivers = async () => {
  const res = await api.get('/api/drivers');
  return res.data;
};

export const getDriverById = async (id) => {
  const res = await api.get(`/api/drivers/${id}`);
  return res.data;
};

export const createDriver = async (formData) => {
  const res = await api.post('/api/drivers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data) => data],
  });
  return res.data;
};

export const updateDriver = async (id, formData) => {
  const res = await api.put(`/api/drivers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data) => data],
  });
  return res.data;
};

export const deleteDriver = async (id) => {
  const res = await api.delete(`/api/drivers/${id}`);
  return res.data;
};

export const toggleDriverStatus = async (id) => {
  const res = await api.patch(`/api/drivers/${id}/toggle-status`);
  return res.data;
};
