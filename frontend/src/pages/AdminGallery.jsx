import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminGalleryImages,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from '../services/galleryService';
import { useToast } from '../context/ToastContext';

const CATS = [
  { value: 'all',      label: 'All',      icon: '🖼️' },
  { value: 'car',      label: 'Cars',     icon: '🚗' },
  { value: 'marriage', label: 'Marriage', icon: '💒' },
  { value: 'tour',     label: 'Tours',    icon: '🏔️' },
  { value: 'other',    label: 'Other',    icon: '📸' },
];

const AdminGallery = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [images, setImages]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [cat, setCat]                     = useState('all');
  const [editingImage, setEditingImage]   = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [selectedFile, setSelectedFile]   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [form, setForm]                   = useState({ title: '', description: '', category: 'car' });

  useEffect(() => { fetchImages(); }, [cat]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await getAdminGalleryImages(cat);
      setImages(res.data || []);
    } catch { showError('Failed to load gallery images'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingImage(null);
    setForm({ title: '', description: '', category: 'car' });
    setSelectedFile(null);
    setPreview(null);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const openEdit = (img) => {
    setEditingImage(img);
    setForm({ title: img.title, description: img.description || '', category: img.category });
    setPreview(img.imageUrl);
    setSelectedFile(null);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const closeForm = () => { setShowForm(false); setEditingImage(null); setPreview(null); setSelectedFile(null); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showError('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024)    { showError('Image size must be under 5 MB'); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !editingImage) { showError('Please select an image'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      if (selectedFile) fd.append('image', selectedFile);
      else if (editingImage) fd.append('imageUrl', editingImage.imageUrl);

      if (editingImage) { await updateGalleryImage(editingImage._id, fd); showSuccess('Image updated!'); }
      else              { await uploadGalleryImage(fd); showSuccess('Image uploaded!'); }
      closeForm();
      fetchImages();
    } catch (err) { showError(err.response?.data?.message || 'Failed to save image'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try { await deleteGalleryImage(id); showSuccess('Deleted!'); fetchImages(); }
    catch { showError('Failed to delete image'); }
  };

  const handleToggle = async (img) => {
    try {
      await updateGalleryImage(img._id, { isActive: !img.isActive });
      showSuccess(`Image ${!img.isActive ? 'activated' : 'deactivated'}`);
      fetchImages();
    } catch { showError('Failed to update status'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <button onClick={() => navigate('/admin/dashboard')} className="hover:text-indigo-600 transition-colors">Admin</button>
            <span>/</span>
            <span className="text-gray-600 font-medium">Gallery</span>
          </div>
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gallery Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading…' : `${images.length} image${images.length !== 1 ? 's' : ''} · Upload and manage gallery photos`}
                </p>
              </div>
            </div>
            <button onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm self-start sm:self-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Image
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Upload / Edit form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
              <p className="text-sm font-semibold text-indigo-900">
                {editingImage ? 'Edit Image' : 'Upload New Image'}
              </p>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image picker */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                    preview ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-indigo-400 bg-gray-50'
                  }`}
                  style={{ minHeight: 160 }}>
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">Tap to choose image</p>
                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5 MB</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Title *</label>
                    <input required value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                      placeholder="e.g., Luxury Wedding Car"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Category *</label>
                    <select required value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white">
                      <option value="car">🚗 Cars</option>
                      <option value="marriage">💒 Marriage</option>
                      <option value="tour">🏔️ Tours</option>
                      <option value="other">📸 Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                      placeholder="Optional description..." rows={3} resize="none"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none resize-none" />
                  </div>
                  {preview && selectedFile && (
                    <button type="button" onClick={() => { setSelectedFile(null); setPreview(editingImage?.imageUrl || null); }}
                      className="text-xs text-red-500 hover:text-red-700 underline">
                      Remove selected image
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button type="submit" disabled={uploading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {uploading ? 'Saving…' : (editingImage ? 'Update Image' : 'Upload Image')}
                </button>
                <button type="button" onClick={closeForm}
                  className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 text-sm font-medium rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category filter chips — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
          {CATS.map(c => (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                cat === c.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
              {cat === c.value && images.length > 0 && (
                <span className="text-[10px] bg-white/20 px-1 rounded-full">{images.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && images.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-14">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-base font-semibold text-gray-700 mb-1">No images found</p>
            <p className="text-sm text-gray-400 mb-4">
              {cat === 'all' ? 'Upload your first image to get started.' : `No ${cat} images yet.`}
            </p>
            <button onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Upload Image
            </button>
          </div>
        )}

        {/* Gallery grid — 2 cols on mobile, 3 on sm, 4 on lg */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {images.map(image => (
              <div key={image._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover" />
                  {!image.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-medium">Inactive</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded-full capitalize">
                    {image.category}
                  </span>
                </div>
                {/* Info + actions */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 truncate mb-1">{image.title}</p>
                  {image.description && (
                    <p className="text-[10px] text-gray-400 line-clamp-1 mb-2">{image.description}</p>
                  )}
                  <div className="flex gap-1.5">
                    <button onClick={() => handleToggle(image)}
                      className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                        image.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {image.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => openEdit(image)}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-medium rounded-md transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(image._id)}
                      className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGallery;
