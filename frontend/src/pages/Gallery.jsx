import { useState, useEffect } from 'react';
import { getPublicGalleryImages } from '../services/galleryService';
import { useToast } from '../context/ToastContext';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const { showToast } = useToast();

  const categories = [
    { value: 'all', label: 'All Photos', icon: '🖼️', color: 'from-purple-500 to-pink-500' },
    { value: 'car', label: 'Cars', icon: '🚗', color: 'from-blue-500 to-cyan-500' },
    { value: 'marriage', label: 'Marriage', icon: '💒', color: 'from-pink-500 to-rose-500' },
    { value: 'tour', label: 'Tours', icon: '🏔️', color: 'from-green-500 to-emerald-500' },
    { value: 'other', label: 'Other', icon: '📸', color: 'from-orange-500 to-amber-500' }
  ];

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await getPublicGalleryImages(selectedCategory);
      setImages(response.data || []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      showToast('Failed to load gallery images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat) => {
    const category = categories.find(c => c.value === cat);
    return category?.color || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 text-sm font-semibold">
              📸 Explore Our Collection
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Photo Gallery
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Discover our stunning collection of cars, wedding vehicles, and memorable tour moments
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                  selectedCategory === category.value
                    ? 'bg-white shadow-2xl scale-105'
                    : 'bg-white/80 hover:bg-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
              >
                {selectedCategory === category.value && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-10 z-0`}></div>
                )}
                <span className="text-3xl relative z-20">{category.icon}</span>
                <span className={`text-lg relative z-20 ${
                  selectedCategory === category.value 
                    ? 'text-gray-800 font-extrabold'
                    : 'text-gray-700'
                }`}>
                  {category.label}
                </span>
                {selectedCategory === category.value && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${category.color} z-10`}></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            </div>
            <p className="mt-6 text-gray-600 font-semibold text-lg">Loading amazing photos...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && images.length === 0 && (
          <div className="text-center py-32 bg-white rounded-3xl shadow-xl">
            <div className="text-8xl mb-6">📷</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">No Photos Yet</h3>
            <p className="text-xl text-gray-500 mb-8">
              {selectedCategory === 'all' 
                ? 'Our gallery is being updated. Check back soon!'
                : `No ${categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} photos available yet.`
              }
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
            >
              View All Categories
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && images.length > 0 && (
          <>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCategory === 'all' ? 'All Photos' : categories.find(c => c.value === selectedCategory)?.label}
                <span className="ml-3 text-lg font-normal text-gray-500">({images.length} {images.length === 1 ? 'photo' : 'photos'})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image, index) => (
                <div
                  key={image._id}
                  onClick={() => setSelectedImage(image)}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div className="text-white">
                        <p className="text-sm font-semibold mb-1">Click to view</p>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <span className="text-xs">Expand</span>
                        </div>
                      </div>
                    </div>
                    {/* Category Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r ${getCategoryColor(image.category)} text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm`}>
                      {image.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {image.title}
                    </h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {image.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Accent */}
                  <div className={`h-1 bg-gradient-to-r ${getCategoryColor(image.category)} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-16 right-0 text-white hover:text-gray-300 transition-all hover:rotate-90 duration-300 z-10 bg-white/10 backdrop-blur-sm rounded-full p-3"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Container */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
                <div className="relative bg-gray-900">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                </div>
                
                {/* Details */}
                <div className="p-8 bg-gradient-to-br from-white to-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedImage.title}</h2>
                      {selectedImage.description && (
                        <p className="text-gray-600 text-lg leading-relaxed">{selectedImage.description}</p>
                      )}
                    </div>
                    <div className={`ml-4 px-5 py-2.5 bg-gradient-to-r ${getCategoryColor(selectedImage.category)} text-white font-bold rounded-full shadow-lg capitalize text-sm`}>
                      {selectedImage.category}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Gallery;
