import { useState, useEffect } from 'react';
import { getPublicGalleryImages } from '../services/galleryService';
import { useToast } from '../context/ToastContext';

const CATS = [
  { value: 'all',      label: 'All',      icon: '🖼️', color: 'from-purple-500 to-pink-500' },
  { value: 'car',      label: 'Cars',     icon: '🚗', color: 'from-blue-500 to-cyan-500' },
  { value: 'marriage', label: 'Marriage', icon: '💒', color: 'from-pink-500 to-rose-500' },
  { value: 'tour',     label: 'Tours',    icon: '🏔️', color: 'from-green-500 to-emerald-500' },
  { value: 'other',    label: 'Other',    icon: '📸', color: 'from-orange-500 to-amber-500' },
];

const Gallery = () => {
  const [images, setImages]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const { showToast } = useToast();

  useEffect(() => { fetchImages(); }, [selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await getPublicGalleryImages(selectedCategory);
      setImages(res.data || []);
    } catch {
      showToast('Failed to load gallery images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const catColor = (cat) => CATS.find(c => c.value === cat)?.color || 'from-gray-500 to-gray-600';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-10 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold mb-4">
            📸 Explore Our Collection
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 drop-shadow">
            Photo Gallery
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
            Discover our cars, wedding vehicles, and memorable tour moments
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-10">

        {/* ── Category filter — scrollable chips on mobile ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-6 sm:mb-8 sm:flex-wrap sm:justify-center">
          {CATS.map(cat => (
            <button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                selectedCategory === cat.value
                  ? 'bg-white text-gray-900 shadow-md scale-105'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:shadow-md'
              }`}>
              <span className="text-base sm:text-lg">{cat.icon}</span>
              <span>{cat.label}</span>
              {selectedCategory === cat.value && (
                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${cat.color}`} />
              )}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading photos…</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && images.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-5xl sm:text-6xl mb-4">📷</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Photos Yet</h3>
            <p className="text-sm text-gray-500 mb-5">
              {selectedCategory === 'all'
                ? 'Gallery is being updated. Check back soon!'
                : `No ${CATS.find(c => c.value === selectedCategory)?.label.toLowerCase()} photos available yet.`}
            </p>
            <button onClick={() => setSelectedCategory('all')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
              View All Categories
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && images.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">
                {selectedCategory === 'all' ? 'All Photos' : CATS.find(c => c.value === selectedCategory)?.label}
                <span className="ml-2 text-sm font-normal text-gray-400">({images.length})</span>
              </h2>
            </div>

            {/* 2 cols on mobile, 3 on sm, 4 on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {images.map((image) => (
                <div key={image._id} onClick={() => setSelectedImage(image)}
                  className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img src={image.imageUrl} alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy" />
                    {/* Hover overlay — desktop only for clean look */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end p-3">
                      <p className="text-white text-xs font-medium">Tap to expand</p>
                    </div>
                    {/* Category badge */}
                    <div className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r ${catColor(image.category)} text-white text-[9px] sm:text-xs font-bold rounded-full shadow capitalize`}>
                      {image.category}
                    </div>
                  </div>
                  {/* Caption */}
                  <div className="p-2 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {image.title}
                    </h3>
                    {image.description && (
                      <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5 hidden sm:block">
                        {image.description}
                      </p>
                    )}
                  </div>
                  {/* Accent bar */}
                  <div className={`h-0.5 bg-gradient-to-r ${catColor(image.category)} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Lightbox modal ── */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setSelectedImage(null)}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 bg-gradient-to-r ${catColor(selectedImage.category)} text-white text-xs font-bold rounded-full capitalize`}>
                {selectedImage.category}
              </span>
              <h2 className="text-white font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
                {selectedImage.title}
              </h2>
            </div>
            <button onClick={() => setSelectedImage(null)}
              className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image — fills remaining space */}
          <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.imageUrl} alt={selectedImage.title}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          </div>

          {/* Description (only if present) */}
          {selectedImage.description && (
            <div className="px-4 pb-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <p className="text-white/70 text-xs sm:text-sm text-center max-w-lg mx-auto">
                {selectedImage.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gallery;
