import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
} from '../services/driverService';

const LICENCE_TYPES = ['LMV', 'HMV', 'HPMV', 'PSV', 'LMV-TR', 'MCWG'];
const CAR_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Bus', 'Other'];
const LANGUAGES = ['Hindi', 'English', 'Bhojpuri', 'Maithili', 'Urdu', 'Bengali'];

const emptyForm = {
  name: '',
  phone: '',
  licenceType: 'LMV',
  drivingExperience: '',
  status: 'available',
  languagesKnown: [],
  carType: 'Sedan',
  carModel: '',
  carNumber: '',
};

// Reusable image upload field with preview
const ImageUploadField = ({ label, name, existingUrl, file, onFileChange }) => {
  const inputRef = useRef(null);
  const preview = file ? URL.createObjectURL(file) : existingUrl || null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-all overflow-hidden bg-gray-50 flex items-center justify-center"
        style={{ minHeight: '110px' }}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-28 object-cover rounded-xl" />
        ) : (
          <div className="text-center py-4 px-2">
            <div className="text-2xl mb-1">📷</div>
            <p className="text-xs text-gray-500">Click to upload</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFileChange(name, e.target.files[0] || null)}
        />
      </div>
    </div>
  );
};

const AdminDriverManagement = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({
    driverPhoto: null,
    licenceImageFront: null,
    licenceImageBack: null,
    carFrontImage: null,
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getAllDrivers();
      setDrivers(res.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'carNumber' ? value.toUpperCase() : value,
    }));
  };

  const handleFileChange = (fieldName, file) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
  };

  const toggleLanguage = (lang) => {
    setForm((prev) => ({
      ...prev,
      languagesKnown: prev.languagesKnown.includes(lang)
        ? prev.languagesKnown.filter((l) => l !== lang)
        : [...prev.languagesKnown, lang],
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFiles({ driverPhoto: null, licenceImageFront: null, licenceImageBack: null, carFrontImage: null });
    setEditingDriver(null);
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name || '',
      phone: driver.phone || '',
      licenceType: driver.licenceType || 'LMV',
      drivingExperience: driver.drivingExperience ?? '',
      status: driver.status || 'available',
      languagesKnown: driver.languagesKnown || [],
      carType: driver.carType || 'Sedan',
      carModel: driver.carModel || '',
      carNumber: driver.carNumber || '',
    });
    setFiles({ driverPhoto: null, licenceImageFront: null, licenceImageBack: null, carFrontImage: null });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver "${driver.name}"? This cannot be undone.`)) return;
    try {
      await deleteDriver(driver._id);
      showSuccess('Driver deleted');
      setDrivers((prev) => prev.filter((d) => d._id !== driver._id));
    } catch (err) {
      showError(err.message || 'Failed to delete driver');
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      const res = await toggleDriverStatus(driver._id);
      showSuccess('Status updated');
      setDrivers((prev) => prev.map((d) => (d._id === driver._id ? res.data : d)));
    } catch (err) {
      showError(err.message || 'Failed to update status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.phone)) {
      showError('Phone number must be exactly 10 digits');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('phone', form.phone.trim());
    fd.append('licenceType', form.licenceType);
    fd.append('drivingExperience', form.drivingExperience);
    fd.append('status', form.status);
    fd.append('languagesKnown', JSON.stringify(form.languagesKnown));
    fd.append('carType', form.carType);
    fd.append('carModel', form.carModel.trim());
    fd.append('carNumber', form.carNumber.trim().toUpperCase());

    if (files.driverPhoto) fd.append('driverPhoto', files.driverPhoto);
    if (files.licenceImageFront) fd.append('licenceImageFront', files.licenceImageFront);
    if (files.licenceImageBack) fd.append('licenceImageBack', files.licenceImageBack);
    if (files.carFrontImage) fd.append('carFrontImage', files.carFrontImage);

    setSubmitting(true);
    try {
      if (editingDriver) {
        const res = await updateDriver(editingDriver._id, fd);
        showSuccess('Driver updated successfully');
        setDrivers((prev) => prev.map((d) => (d._id === editingDriver._id ? res.data : d)));
      } else {
        const res = await createDriver(fd);
        showSuccess('Driver added successfully');
        setDrivers((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Initials avatar fallback
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                title="Back to Dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Driver Management</h1>
                <p className="text-blue-100 text-sm mt-1">Add and manage drivers for bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold">
                {drivers.length} Driver{drivers.length !== 1 ? 's' : ''}
              </div>
              <div className="bg-green-400/30 rounded-xl px-4 py-2 text-sm font-semibold">
                {drivers.filter((d) => d.status === 'available').length} Available
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ── Driver Grid ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow border border-gray-100">
            <div className="text-6xl mb-4">🚘</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Drivers Yet</h3>
            <p className="text-gray-500 mb-4">Use the form below to add your first driver</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drivers.map((driver) => (
              <div
                key={driver._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
              >
                {/* Card Top */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
                  {driver.driverPhoto ? (
                    <img
                      src={driver.driverPhoto}
                      alt={driver.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {getInitials(driver.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-bold text-lg truncate">{driver.name}</h3>
                    <p className="text-blue-100 text-sm">{driver.phone}</p>
                  </div>
                  {/* Status badge — clickable */}
                  <button
                    onClick={() => handleToggleStatus(driver)}
                    title="Click to toggle status"
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      driver.status === 'available'
                        ? 'bg-green-400/30 text-white hover:bg-green-400/50'
                        : 'bg-red-400/30 text-white hover:bg-red-400/50'
                    }`}
                  >
                    {driver.status === 'available' ? '✅ Available' : '🔴 Busy'}
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Licence</p>
                      <p className="font-semibold text-blue-700">{driver.licenceType}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="font-semibold text-purple-700">{driver.drivingExperience} yrs</p>
                    </div>
                    {driver.carType && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Car Type</p>
                        <p className="font-semibold text-green-700">{driver.carType}</p>
                      </div>
                    )}
                    {driver.carNumber && (
                      <div className="bg-orange-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Car No.</p>
                        <p className="font-semibold text-orange-700 uppercase">{driver.carNumber}</p>
                      </div>
                    )}
                  </div>
                  {driver.carModel && (
                    <p className="text-xs text-gray-500">🚗 {driver.carModel}</p>
                  )}
                  {driver.languagesKnown && driver.languagesKnown.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {driver.languagesKnown.map((lang) => (
                        <span
                          key={lang}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(driver)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(driver)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Add / Edit Form ── */}
        <div ref={formRef} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingDriver ? `✏️ Editing: ${editingDriver.name}` : '➕ Add New Driver'}
              </h2>
              <p className="text-blue-100 text-sm mt-0.5">Fill in the details below</p>
            </div>
            {editingDriver && (
              <button
                onClick={resetForm}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                title="Cancel edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-7">
            {/* Section 1 — Personal Info */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">1</div>
                <h3 className="text-base font-semibold text-gray-900">Personal Info</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleField}
                    placeholder="e.g., Ramesh Kumar"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone * (10 digits)</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    value={form.phone}
                    onChange={handleField}
                    placeholder="9876543210"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <ImageUploadField
                  label="Driver Photo"
                  name="driverPhoto"
                  existingUrl={editingDriver?.driverPhoto}
                  file={files.driverPhoto}
                  onFileChange={handleFileChange}
                />
              </div>
            </section>

            {/* Section 2 — Licence Details */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">2</div>
                <h3 className="text-base font-semibold text-gray-900">Licence Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Licence Type *</label>
                  <select
                    name="licenceType"
                    required
                    value={form.licenceType}
                    onChange={handleField}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    {LICENCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                  <input
                    type="number"
                    name="drivingExperience"
                    required
                    min="0"
                    value={form.drivingExperience}
                    onChange={handleField}
                    placeholder="e.g., 5"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <ImageUploadField
                  label="Licence Front"
                  name="licenceImageFront"
                  existingUrl={editingDriver?.licenceImageFront}
                  file={files.licenceImageFront}
                  onFileChange={handleFileChange}
                />
                <ImageUploadField
                  label="Licence Back"
                  name="licenceImageBack"
                  existingUrl={editingDriver?.licenceImageBack}
                  file={files.licenceImageBack}
                  onFileChange={handleFileChange}
                />
              </div>
            </section>

            {/* Section 3 — Vehicle Details */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">3</div>
                <h3 className="text-base font-semibold text-gray-900">Vehicle Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Type *</label>
                  <select
                    name="carType"
                    required
                    value={form.carType}
                    onChange={handleField}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    {CAR_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
                  <input
                    type="text"
                    name="carModel"
                    value={form.carModel}
                    onChange={handleField}
                    placeholder="e.g., Ertiga"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Car Number</label>
                  <input
                    type="text"
                    name="carNumber"
                    value={form.carNumber}
                    onChange={handleField}
                    placeholder="e.g., BR01AB1234"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all uppercase"
                  />
                </div>
                <ImageUploadField
                  label="Car Front Image"
                  name="carFrontImage"
                  existingUrl={editingDriver?.carFrontImage}
                  file={files.carFrontImage}
                  onFileChange={handleFileChange}
                />
              </div>
            </section>

            {/* Section 4 — Other */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">4</div>
                <h3 className="text-base font-semibold text-gray-900">Other Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-3">
                    {['available', 'unavailable'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                          form.status === s
                            ? s === 'available'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-red-500 border-red-500 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {s === 'available' ? '✅ Available' : '🔴 Unavailable'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages Known */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                          form.languagesKnown.includes(lang)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? (editingDriver ? 'Updating...' : 'Adding...')
                  : (editingDriver ? '✅ Update Driver' : '➕ Add Driver')}
              </button>
              {editingDriver && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDriverManagement;
