import { useState, useEffect } from 'react';
import {
  getAdminGalleryImages,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} from '../services/galleryService';
import { useToast } from '../context/ToastContext';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingImage, setEditingImage] = useState(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: 'car'
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'all', label: 'All Photos', icon: '🖼️', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { value: 'car', label: 'Cars', icon: '🚗', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { value: 'marriage', label: 'Marriage', icon: '💒', color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
    { value: 'tour', label: 'Tours', icon: '🏔️', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    { value: 'other', label: 'Other', icon: '📸', color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' }
  ];

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await getAdminGalleryImages(selectedCategory);
      setImages(response.data || []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      showError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      
      if (selectedFile) {
        uploadData.append('image', selectedFile);
      } else if (editingImage) {
        uploadData.append('imageUrl', formData.imageUrl);
      } else {
        showError('Please select an image to upload');
        setUploading(false);
        return;
      }
      
      if (editingImage) {
        await updateGalleryImage(editingImage._id, uploadData);
        showSuccess('Image updated successfully!');
      } else {
        await uploadGalleryImage(uploadData);
        showSuccess('Image uploaded successfully!');
      }
      
      setEditingImage(null);
      setFormData({ title: '', description: '', imageUrl: '', category: 'car' });
      setSelectedFile(null);
      setImagePreview(null);
      fetchImages();
    } catch (error) {
      console.error('Error saving image:', error);
      showError(error.response?.data?.message || 'Failed to save image');
    } finally {
      setUploading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description || '',
      imageUrl: image.imageUrl,
      category: image.category
    });
    setImagePreview(image.imageUrl);
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await deleteGalleryImage(id);
      showSuccess('Image deleted successfully!');
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      showError('Failed to delete image');
    }
  };

  const handleToggleActive = async (image) => {
    try {
      await updateGalleryImage(image._id, { isActive: !image.isActive });
      showSuccess(`Image ${!image.isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchImages();
    } catch (error) {
      console.error('Error toggling image status:', error);
      showError('Failed to update image status');
    }
  };

  const getCategoryInfo = (cat) => {
    return categories.find(c => c.value === cat) || categories[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-12 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">Gallery Management</h1>
              <p className="text-white/90 text-lg">Upload and manage your gallery images</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
                <div className="text-3xl font-bold">{images.length}</div>
                <div className="text-sm text-white/80">Total Images</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Upload Form Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${editingImage ? 'from-orange-500 to-red-500' : 'from-blue-500 to-purple-500'}`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingImage ? 'Edit Image' : 'Upload New Image'}
              </h2>
              <p className="text-gray-600">
                {editingImage ? 'Update the image details below' : 'Add a new image to your gallery'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Image Upload *
                </label>
                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    imagePreview 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-100');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      handleFileChange({ target: { files: [file] } });
                    }
                  }}
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-xl object-contain"
                      />
                      <div className="flex gap-2 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreview(editingImage ? formData.imageUrl : null);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                      >
                        Choose Image
                      </label>
                      <p className="text-gray-500 mt-3 text-sm">or drag and drop</p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Luxury Wedding Car"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Add a brief description..."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
                  >
                    <option value="car">🚗 Cars</option>
                    <option value="marriage">💒 Marriage</option>
                    <option value="tour">🏔️ Tours</option>
                    <option value="other">📸 Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {editingImage && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingImage(null);
                    setFormData({ title: '', description: '', imageUrl: '', category: 'car' });
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {editingImage ? 'Update Image' : 'Upload Image'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  selectedCategory === category.value
                    ? `${category.bgColor} ${category.textColor} shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:shadow-md shadow'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span>{category.label}</span>
                {selectedCategory === category.value && (
                  <span className={`ml-1 px-2 py-0.5 ${category.bgColor} rounded-full text-xs font-bold`}>
                    {images.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-semibold">Loading images...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && images.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
            <div className="text-7xl mb-4">📷</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Images Found</h3>
            <p className="text-gray-500 mb-6">
              {selectedCategory === 'all' 
                ? 'Upload your first image to get started'
                : `No ${getCategoryInfo(selectedCategory).label.toLowerCase()} images yet`
              }
            </p>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => {
              const catInfo = getCategoryInfo(image.category);
              return (
                <div
                  key={image._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {!image.isActive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                          Inactive
                        </span>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r ${catInfo.color} text-white text-xs font-bold rounded-full shadow-lg capitalize`}>
                      {image.category}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 truncate text-lg">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{image.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => handleToggleActive(image)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          image.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {image.isActive ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(image)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(image._id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGallery;
