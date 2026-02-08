import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import carService from '../services/carService';

const AdminCarManagement = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [carForm, setCarForm] = useState({
    name: '',
    carType: 'Sedan',
    numberOfSeats: 4,
    image: '',
    features: '',
    isAvailable: true,
    status: 'Active',
    pricing: {
      oneWay: { perKm: 0, extraAmount: 0 },
      roundTrip: { perKm: 0, extraAmount: 0 },
      outstation: { perKm: 0, extraAmount: 0 },
      marriage: { perHour: 0, extraAmount: 0 },
      monthly: { price: 0, extraAmount: 0 }
    }
  });

  const carTypes = ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Tempo Traveller', 'Other'];
  const statusOptions = ['Active', 'Inactive', 'Maintenance'];

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    setLoading(true);
    try {
      const data = await carService.getAllCars();
      setCars(data);
    } catch (error) {
      showError(error.message || 'Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (car = null) => {
    if (car) {
      setEditingCar(car);
      setCarForm({
        name: car.name,
        carType: car.carType,
        numberOfSeats: car.numberOfSeats,
        image: car.image || '',
        features: car.features?.join(', ') || '',
        isAvailable: car.isAvailable,
        status: car.status,
        pricing: car.pricing
      });
    } else {
      setEditingCar(null);
      setCarForm({
        name: '',
        carType: 'Sedan',
        numberOfSeats: 4,
        image: '',
        features: '',
        isAvailable: true,
        status: 'Active',
        pricing: {
          oneWay: { perKm: 0, extraAmount: 0 },
          roundTrip: { perKm: 0, extraAmount: 0 },
          outstation: { perKm: 0, extraAmount: 0 },
          marriage: { perHour: 0, extraAmount: 0 },
          monthly: { price: 0, extraAmount: 0 }
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCar(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const carData = {
        ...carForm,
        features: carForm.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingCar) {
        const response = await carService.updateCar(editingCar._id, carData);
        showSuccess('Car updated successfully');
        setCars(prevCars => 
          prevCars.map(car => car._id === editingCar._id ? response.car : car)
        );
      } else {
        const response = await carService.createCar(carData);
        showSuccess('Car created successfully');
        setCars(prevCars => [response.car, ...prevCars]);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Car operation error:', error);
      showError(error.message || 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await carService.deleteCar(id);
      showSuccess('Car deleted successfully');
      setCars(prevCars => prevCars.filter(car => car._id !== id));
    } catch (error) {
      showError(error.message || 'Failed to delete car');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id) => {
    setLoading(true);
    try {
      const response = await carService.toggleCarAvailability(id);
      showSuccess('Car availability updated');
      setCars(prevCars => 
        prevCars.map(car => car._id === id ? response.car : car)
      );
    } catch (error) {
      showError(error.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  // Filter cars
  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.carType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || car.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Fleet Management</h1>
                <p className="text-blue-100">Manage your car inventory and pricing</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Car
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by car name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{cars.length}</div>
              <div className="text-sm text-gray-600">Total Cars</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cars.filter(c => c.isAvailable).length}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{cars.filter(c => c.status === 'Maintenance').length}</div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
          </div>
        </div>

        {/* Cars Grid */}
        {loading && cars.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cars Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by adding your first car to the fleet'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
              >
                Add Your First Car
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <div key={car._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 group">
                {/* Car Header */}
                <div className={`p-6 ${
                  car.status === 'Active' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  car.status === 'Maintenance' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                  'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="text-white flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{car.name}</h3>
                          <p className="text-sm opacity-90">{car.carType} • {car.numberOfSeats} Seater</p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      car.isAvailable ? 'bg-white text-green-600' : 'bg-white/20 text-white'
                    }`}>
                      {car.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">One Way</div>
                      <div className="font-bold text-blue-600">₹{car.pricing.oneWay.perKm}/km</div>
                      {car.pricing.oneWay.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.oneWay.extraAmount}</div>
                      )}
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Round Trip</div>
                      <div className="font-bold text-green-600">₹{car.pricing.roundTrip.perKm}/km</div>
                      {car.pricing.roundTrip.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.roundTrip.extraAmount}</div>
                      )}
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Outstation</div>
                      <div className="font-bold text-purple-600">₹{car.pricing.outstation.perKm}/km</div>
                      {car.pricing.outstation.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.outstation.extraAmount}</div>
                      )}
                    </div>
                    <div className="bg-pink-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Marriage</div>
                      <div className="font-bold text-pink-600">₹{car.pricing.marriage.perHour}/hr</div>
                      {car.pricing.marriage.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.marriage.extraAmount}</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Monthly Subscription</div>
                    <div className="font-bold text-orange-600">₹{car.pricing.monthly.price}/month</div>
                    {car.pricing.monthly.extraAmount > 0 && (
                      <div className="text-xs text-gray-500">+₹{car.pricing.monthly.extraAmount}</div>
                    )}
                  </div>

                  {/* Features */}
                  {car.features && car.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {car.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                      {car.features.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          +{car.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenModal(car)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(car._id)}
                      className={`flex-1 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                        car.isAvailable
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {car.isAvailable ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(car._id, car.name)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Add/Edit Car Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                      </svg>
                    </div>
                    {editingCar ? 'Edit Car' : 'Add New Car'}
                  </h2>
                  <p className="text-blue-100 text-sm">Fill in the details below to {editingCar ? 'update' : 'add'} a car</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Car Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Ertiga, Scorpio"
                      value={carForm.name}
                      onChange={(e) => setCarForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Car Type *
                    </label>
                    <select
                      required
                      value={carForm.carType}
                      onChange={(e) => setCarForm(prev => ({ ...prev, carType: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    >
                      {carTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Seats *
                    </label>
                    <input
                      type="number"
                      required
                      min="2"
                      max="20"
                      value={carForm.numberOfSeats}
                      onChange={(e) => setCarForm(prev => ({ ...prev, numberOfSeats: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={carForm.status}
                      onChange={(e) => setCarForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., AC, GPS, Music System"
                      value={carForm.features}
                      onChange={(e) => setCarForm(prev => ({ ...prev, features: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={carForm.isAvailable}
                      onChange={(e) => setCarForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                      Car is available for booking
                    </label>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Pricing Details</h4>
                </div>

                {/* One Way Pricing */}
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
                  <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                    One Way Trip
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per KM Rate (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={carForm.pricing.oneWay.perKm}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            oneWay: { ...prev.pricing.oneWay, perKm: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={carForm.pricing.oneWay.extraAmount}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            oneWay: { ...prev.pricing.oneWay, extraAmount: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Round Trip Pricing */}
                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                    Round Trip
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per KM Rate (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={carForm.pricing.roundTrip.perKm}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            roundTrip: { ...prev.pricing.roundTrip, perKm: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={carForm.pricing.roundTrip.extraAmount}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            roundTrip: { ...prev.pricing.roundTrip, extraAmount: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Outstation Pricing */}
                <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-100">
                  <h5 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                    Outstation Trip
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per KM Rate (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={carForm.pricing.outstation.perKm}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            outstation: { ...prev.pricing.outstation, perKm: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={carForm.pricing.outstation.extraAmount}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            outstation: { ...prev.pricing.outstation, extraAmount: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Marriage Booking Pricing */}
                <div className="bg-pink-50 p-4 rounded-xl border-2 border-pink-100">
                  <h5 className="font-semibold text-pink-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs mr-2">4</span>
                    Marriage Booking
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Hour Rate (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={carForm.pricing.marriage.perHour}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            marriage: { ...prev.pricing.marriage, perHour: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={carForm.pricing.marriage.extraAmount}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            marriage: { ...prev.pricing.marriage, extraAmount: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Subscription Pricing */}
                <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100">
                  <h5 className="font-semibold text-orange-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs mr-2">5</span>
                    Monthly Subscription
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={carForm.pricing.monthly.price}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            monthly: { ...prev.pricing.monthly, price: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={carForm.pricing.monthly.extraAmount}
                        onChange={(e) => setCarForm(prev => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            monthly: { ...prev.pricing.monthly, extraAmount: parseFloat(e.target.value) || 0 }
                          }
                        }))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingCar ? 'Update Car' : 'Add Car'}
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCarManagement;
