import api from '../config/axios';

const bannerService = {
  // Get active banners (public)
  getActiveBanners: async () => {
    try {
      const response = await api.get('/api/banners');
      return response.data.banners;
    } catch (error) {
      console.error('Get active banners error:', error);
      throw error;
    }
  },

  // Admin: Get all banners
  getAllBanners: async () => {
    try {
      const response = await api.get('/api/admin/banners');
      return response.data.banners;
    } catch (error) {
      console.error('Get all banners error:', error);
      throw error;
    }
  },

  // Admin: Create banner
  createBanner: async (bannerData) => {
    try {
      const response = await api.post('/api/admin/banners', bannerData);
      return response.data;
    } catch (error) {
      console.error('Create banner error:', error);
      throw error;
    }
  },

  // Admin: Update banner
  updateBanner: async (id, bannerData) => {
    try {
      const response = await api.put(`/api/admin/banners/${id}`, bannerData);
      return response.data;
    } catch (error) {
      console.error('Update banner error:', error);
      throw error;
    }
  },

  // Admin: Delete banner
  deleteBanner: async (id) => {
    try {
      const response = await api.delete(`/api/admin/banners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete banner error:', error);
      throw error;
    }
  }
};

export default bannerService;
