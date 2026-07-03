import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getAllDrivers, createDriver, updateDriver } from '../services/driverService';

const LICENCE_TYPES = ['LMV', 'HMV', 'HPMV', 'PSV', 'LMV-TR', 'MCWG'];
const CAR_TYPES     = ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Bus', 'Other'];
const LANGUAGES     = ['Hindi', 'English', 'Bhojpuri', 'Maithili', 'Urdu', 'Bengali'];

const empty = {
  name: '', phone: '', licenceType: 'LMV', drivingExperience: '',
  status: 'available', languagesKnown: [], carType: 'Sedan', carModel: '', carNumber: '',
};

const ImageField = ({ label, name, existingUrl, file, onChange }) => {
  const ref = useRef(null);
  const preview = file ? URL.createObjectURL(file) : existingUrl || null;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div onClick={() => ref.current?.click()}
        className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden transition-colors"
        style={{ minHeight: 100 }}>
        {preview ? (
          <img src={preview} alt={label} className="w-full h-24 object-cover rounded-xl" />
        ) : (
          <div className="text-center py-4 px-2">
            <svg className="w-6 h-6 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs text-gray-400">Click to upload</p>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => onChange(name, e.target.files[0] || null)} />
      </div>
    </div>
  );
};

const AdminDriverForm = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');

  const [form, setForm]           = useState(empty);
  const [files, setFiles]         = useState({ driverPhoto: null, licenceImageFront: null, licenceImageBack: null, carFrontImage: null });
  const [editingDriver, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load driver data if editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await getAllDrivers();
        const d = (res.data || []).find(x => x._id === editId);
        if (d) {
          setEditing(d);
          setForm({
            name: d.name || '', phone: d.phone || '', licenceType: d.licenceType || 'LMV',
            drivingExperience: d.drivingExperience ?? '', status: d.status || 'available',
            languagesKnown: d.languagesKnown || [], carType: d.carType || 'Sedan',
            carModel: d.carModel || '', carNumber: d.carNumber || '',
          });
        }
      } catch { /* ignore */ }
    })();
  }, [editId]);

  const set = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === 'carNumber' ? value.toUpperCase() : value }));
  };

  const toggleLang = lang => setForm(p => ({
    ...p,
    languagesKnown: p.languagesKnown.includes(lang) ? p.languagesKnown.filter(l => l !== lang) : [...p.languagesKnown, lang],
  }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.phone)) { showError('Phone must be exactly 10 digits'); return; }

    const fd = new FormData();
    Object.entries({ name: form.name.trim(), phone: form.phone.trim(), licenceType: form.licenceType,
      drivingExperience: form.drivingExperience, status: form.status,
      languagesKnown: JSON.stringify(form.languagesKnown), carType: form.carType,
      carModel: form.carModel.trim(), carNumber: form.carNumber.trim().toUpperCase(),
    }).forEach(([k, v]) => fd.append(k, v));
    ['driverPhoto','licenceImageFront','licenceImageBack','carFrontImage'].forEach(f => { if (files[f]) fd.append(f, files[f]); });

    setSubmitting(true);
    try {
      if (editingDriver) {
        await updateDriver(editingDriver._id, fd);
        showSuccess('Driver updated successfully');
      } else {
        await createDriver(fd);
        showSuccess('Driver added successfully');
      }
      navigate('/admin/drivers');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!editingDriver;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <button onClick={() => navigate('/admin/dashboard')} className="hover:text-indigo-600 transition-colors">Admin</button>
            <span>/</span>
            <button onClick={() => navigate('/admin/drivers')} className="hover:text-indigo-600 transition-colors">Drivers</button>
            <span>/</span>
            <span className="text-gray-600 font-medium">{isEdit ? 'Edit' : 'Add'}</span>
          </div>
          {/* Title row */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/drivers')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEdit ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' : 'M12 4v16m8-8H4'} />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {isEdit ? `Edit Driver` : 'Add New Driver'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {isEdit ? `Updating information for ${editingDriver.name}` : 'Fill in the details below to register a driver'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1 — Personal Info */}
          <Section num="1" title="Personal Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Driver Name *">
                <input type="text" name="name" required value={form.name} onChange={set} placeholder="e.g., Ramesh Kumar" className={inp} />
              </Field>
              <Field label="Phone * (10 digits)">
                <input type="tel" name="phone" required maxLength={10} value={form.phone} onChange={set} placeholder="9876543210" className={inp} />
              </Field>
              <ImageField label="Driver Photo" name="driverPhoto" existingUrl={editingDriver?.driverPhoto} file={files.driverPhoto} onChange={(n, f) => setFiles(p => ({...p,[n]:f}))} />
            </div>
          </Section>

          {/* Section 2 — Licence */}
          <Section num="2" title="Licence Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Licence Type *">
                <select name="licenceType" required value={form.licenceType} onChange={set} className={inp}>
                  {LICENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Experience (years) *">
                <input type="number" name="drivingExperience" required min="0" value={form.drivingExperience} onChange={set} placeholder="e.g., 5" className={inp} />
              </Field>
              <ImageField label="Licence Front" name="licenceImageFront" existingUrl={editingDriver?.licenceImageFront} file={files.licenceImageFront} onChange={(n, f) => setFiles(p => ({...p,[n]:f}))} />
              <ImageField label="Licence Back"  name="licenceImageBack"  existingUrl={editingDriver?.licenceImageBack}  file={files.licenceImageBack}  onChange={(n, f) => setFiles(p => ({...p,[n]:f}))} />
            </div>
          </Section>

          {/* Section 3 — Vehicle */}
          <Section num="3" title="Vehicle Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Car Type *">
                <select name="carType" required value={form.carType} onChange={set} className={inp}>
                  {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Car Model">
                <input type="text" name="carModel" value={form.carModel} onChange={set} placeholder="e.g., Ertiga" className={inp} />
              </Field>
              <Field label="Plate Number">
                <input type="text" name="carNumber" value={form.carNumber} onChange={set} placeholder="BR01AB1234" className={`${inp} uppercase`} />
              </Field>
              <ImageField label="Car Photo" name="carFrontImage" existingUrl={editingDriver?.carFrontImage} file={files.carFrontImage} onChange={(n, f) => setFiles(p => ({...p,[n]:f}))} />
            </div>
          </Section>

          {/* Section 4 — Other */}
          <Section num="4" title="Other Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-3">
                  {['available','unavailable'].map(s => (
                    <button key={s} type="button" onClick={() => setForm(p => ({...p, status: s}))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                        form.status === s
                          ? s === 'available' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-500 border-red-500 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {s === 'available' ? 'Available' : 'Unavailable'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLang(lang)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                        form.languagesKnown.includes(lang) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
              {submitting ? (isEdit ? 'Updating…' : 'Adding…') : (isEdit ? 'Update Driver' : 'Add Driver')}
            </button>
            <button type="button" onClick={() => navigate('/admin/drivers')}
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none bg-white transition-colors';

const Section = ({ num, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{num}</div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

export default AdminDriverForm;
