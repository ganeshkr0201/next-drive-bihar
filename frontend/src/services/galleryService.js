import api from '../config/axios';

// Get all public gallery images
export const getPublicGalleryImages = async (category = 'all') => {
  const response = await api.get(`/api/gallery/public${category !== 'all' ? `?category=${category}` : ''}`);
  return response.data;
};

// Get all gallery images for admin
export const getAdminGalleryImages = async (category = 'all') => {
  const response = await api.get(`/api/gallery/admin${category !== 'all' ? `?category=${category}` : ''}`);
  return response.data;
};

// Upload new gallery image
export const uploadGalleryImage = async (imageData) => {
  const response = await api.post('/api/gallery', imageData);
  return response.data;
};

// Update gallery image
export const updateGalleryImage = async (id, updateData) => {
  const response = await api.put(`/api/gallery/${id}`, updateData);
  return response.data;
};

// Delete gallery image
export const deleteGalleryImage = async (id) => {
  const response = await api.delete(`/api/gallery/${id}`);
  return response.data;
};
