import api from '../config/axios.js';
import errorHandler from '../utils/errorHandler.js';
import envConfig from '../config/env.js';

class TourService {
  // Get all published tour packages
  async getTourPackages(params = {}) {
    try {
      const response = await api.get('/api/tour-packages', { params });
      return response.data.packages || [];
    } catch (error) {
      errorHandler.logError(error, 'TourService.getTourPackages');
      return [];
    }
  }

  // Get featured tour packages for home page
  async getFeaturedTourPackages(limit = 6) {
    try {
      const response = await api.get('/api/tour-packages', { 
        params: { featured: true, limit } 
      });
      return response.data.packages || [];
    } catch (error) {
      errorHandler.logError(error, 'TourService.getFeaturedTourPackages');
      return [];
    }
  }

  // Get single tour package by slug or ID
  async getTourPackage(identifier) {
    try {
      const response = await api.get(`/api/tour-packages/${identifier}`);
      return response.data.package;
    } catch (error) {
      throw errorHandler.handleServiceError(error, 'Tour', 'getTourPackage');
    }
  }

  // Get tour categories
  async getTourCategories() {
    try {
      const response = await api.get('/api/tour-categories');
      return response.data.categories || [];
    } catch (error) {
      errorHandler.logError(error, 'TourService.getTourCategories');
      return [];
    }
  }

  // Helper method to format tour package for display
  formatTourPackage(pkg) {
    // Ensure highlights is always an array
    let highlights = [];
    if (pkg.highlights) {
      if (Array.isArray(pkg.highlights)) {
        highlights = pkg.highlights;
      } else if (typeof pkg.highlights === 'string') {
        try {
          // Try to parse as JSON first
          highlights = JSON.parse(pkg.highlights);
        } catch (e) {
          // If not JSON, split by comma or newline
          highlights = pkg.highlights.split(/[,\n]/).map(h => h.trim()).filter(h => h);
        }
      }
    }

    return {
      id: pkg._id,
      title: pkg.title,
      slug: pkg.slug,
      duration: `${pkg.duration.days} Days / ${pkg.duration.nights} Nights`,
      price: `₹${pkg.pricing.basePrice.toLocaleString()}`,
      originalPrice: `₹${pkg.pricing.originalPrice.toLocaleString()}`,
      image: pkg.images.featured ? 
        envConfig.getAssetUrl(pkg.images.featured) :
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      highlights: highlights,
      rating: 4.5, // Default rating - you can add rating system later
      reviews: Math.floor(Math.random() * 200) + 50, // Random reviews for now
      description: pkg.shortDescription || pkg.description,
      category: pkg.category,
      difficulty: pkg.difficulty,
      maxGroupSize: pkg.maxGroupSize,
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      destinations: pkg.destinations || []
    };
  }
}

export default new TourService();