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
      marriage: { perDay: 0, extraAmount: 0 },
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
          marriage: { perDay: 0, extraAmount: 0 },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Fleet Management</h1>
                <p className="text-sm sm:text-base text-blue-100">Manage your car inventory and pricing</p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 sm:px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden xs:inline">Add New Car</span>
              <span className="xs:hidden">Add Car</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by car name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 sm:pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{cars.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Cars</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{cars.filter(c => c.isAvailable).length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{cars.filter(c => c.status === 'Maintenance').length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Maintenance</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCars.map((car) => (
              <div key={car._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 group">
                {/* Car Header */}
                <div className={`p-4 sm:p-6 ${
                  car.status === 'Active' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  car.status === 'Maintenance' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                  'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-white flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold truncate">{car.name}</h3>
                          <p className="text-xs sm:text-sm opacity-90">{car.carType} • {car.numberOfSeats} Seater</p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      car.isAvailable ? 'bg-white text-green-600' : 'bg-white/20 text-white'
                    }`}>
                      {car.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">One Way</div>
                      <div className="font-bold text-blue-600 text-sm sm:text-base">₹{car.pricing.oneWay.perKm}/km</div>
                      {car.pricing.oneWay.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.oneWay.extraAmount}</div>
                      )}
                    </div>
                    <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Round Trip</div>
                      <div className="font-bold text-green-600 text-sm sm:text-base">₹{car.pricing.roundTrip.perKm}/km</div>
                      {car.pricing.roundTrip.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.roundTrip.extraAmount}</div>
                      )}
                    </div>
                    <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Outstation</div>
                      <div className="font-bold text-purple-600 text-sm sm:text-base">₹{car.pricing.outstation.perKm}/km</div>
                      {car.pricing.outstation.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.outstation.extraAmount}</div>
                      )}
                    </div>
                    <div className="bg-pink-50 p-2 sm:p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Marriage</div>
                      <div className="font-bold text-pink-600 text-sm sm:text-base">₹{car.pricing.marriage.perDay}/day</div>
                      {car.pricing.marriage.extraAmount > 0 && (
                        <div className="text-xs text-gray-500">+₹{car.pricing.marriage.extraAmount}</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Monthly Subscription</div>
                    <div className="font-bold text-orange-600 text-sm sm:text-base">₹{car.pricing.monthly.price}/month</div>
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
                      className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center justify-center gap-1 min-h-[44px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(car._id)}
                      className={`flex-1 px-3 py-2.5 rounded-lg transition-all text-sm font-medium min-h-[44px] ${
                        car.isAvailable
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {car.isAvailable ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(car._id, car.name)}
                      className="px-3 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl max-w-4xl w-full my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                      </svg>
                    </div>
                    <span className="truncate">{editingCar ? 'Edit Car' : 'Add New Car'}</span>
                  </h2>
                  <p className="text-blue-100 text-xs sm:text-sm">Fill in the details below to {editingCar ? 'update' : 'add'} a car</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base"
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base"
                    >
                      {carTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Seats * (2-32)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={carForm.numberOfSeats}
                      onChange={(e) => {
                        let value = e.target.value;
                        
                        // Allow only numbers
                        value = value.replace(/[^\d]/g, '');
                        
                        // Allow empty string for clearing
                        if (value === '') {
                          setCarForm(prev => ({ ...prev, numberOfSeats: '' }));
                          return;
                        }
                        
                        // Remove leading zeros but keep the string format
                        value = value.replace(/^0+/, '') || '0';
                        
                        // Store as string to allow typing multi-digit numbers
                        setCarForm(prev => ({ ...prev, numberOfSeats: value }));
                      }}
                      onBlur={(e) => {
                        // Validate and clamp to range on blur
                        if (e.target.value === '') {
                          setCarForm(prev => ({ ...prev, numberOfSeats: 4 }));
                        } else {
                          const numValue = parseInt(e.target.value) || 4;
                          // Clamp between 2 and 32
                          const clampedValue = Math.max(2, Math.min(32, numValue));
                          setCarForm(prev => ({ ...prev, numberOfSeats: clampedValue }));
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                      placeholder="Enter seats (2-32)"
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base"
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-base"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
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
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Pricing Details</h4>
                </div>

                {/* One Way Pricing */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border-2 border-blue-100">
                  <h5 className="font-semibold text-blue-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">1</span>
                    One Way Trip
                  </h5>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Per KM Rate (₹) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={carForm.pricing.oneWay.perKm}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              oneWay: { ...prev.pricing.oneWay, perKm: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              oneWay: { ...prev.pricing.oneWay, perKm: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                        placeholder="e.g., 12.50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carForm.pricing.oneWay.extraAmount}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              oneWay: { ...prev.pricing.oneWay, extraAmount: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              oneWay: { ...prev.pricing.oneWay, extraAmount: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>
                </div>

                {/* Round Trip Pricing */}
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border-2 border-green-100">
                  <h5 className="font-semibold text-green-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">2</span>
                    Round Trip
                  </h5>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Per KM Rate (₹) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={carForm.pricing.roundTrip.perKm}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              roundTrip: { ...prev.pricing.roundTrip, perKm: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              roundTrip: { ...prev.pricing.roundTrip, perKm: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
                        placeholder="e.g., 11.50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carForm.pricing.roundTrip.extraAmount}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              roundTrip: { ...prev.pricing.roundTrip, extraAmount: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              roundTrip: { ...prev.pricing.roundTrip, extraAmount: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>
                </div>

                {/* Outstation Pricing */}
                <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border-2 border-purple-100">
                  <h5 className="font-semibold text-purple-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">3</span>
                    Outstation Trip
                  </h5>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Per KM Rate (₹) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={carForm.pricing.outstation.perKm}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              outstation: { ...prev.pricing.outstation, perKm: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              outstation: { ...prev.pricing.outstation, perKm: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base"
                        placeholder="e.g., 13.50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carForm.pricing.outstation.extraAmount}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              outstation: { ...prev.pricing.outstation, extraAmount: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              outstation: { ...prev.pricing.outstation, extraAmount: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base"
                        placeholder="e.g., 150"
                      />
                    </div>
                  </div>
                </div>

                {/* Marriage Booking Pricing */}
                <div className="bg-pink-50 p-3 sm:p-4 rounded-xl border-2 border-pink-100">
                  <h5 className="font-semibold text-pink-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">4</span>
                    Marriage Booking
                  </h5>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Per Day Rate (₹) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={carForm.pricing.marriage.perDay}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              marriage: { ...prev.pricing.marriage, perDay: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              marriage: { ...prev.pricing.marriage, perDay: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-base"
                        placeholder="e.g., 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carForm.pricing.marriage.extraAmount}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              marriage: { ...prev.pricing.marriage, extraAmount: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              marriage: { ...prev.pricing.marriage, extraAmount: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-base"
                        placeholder="e.g., 200"
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Subscription Pricing */}
                <div className="bg-orange-50 p-3 sm:p-4 rounded-xl border-2 border-orange-100">
                  <h5 className="font-semibold text-orange-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">5</span>
                    Monthly Subscription
                  </h5>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Monthly Price (₹) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={carForm.pricing.monthly.price}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              monthly: { ...prev.pricing.monthly, price: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              monthly: { ...prev.pricing.monthly, price: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base"
                        placeholder="e.g., 25000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Extra Amount (₹)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carForm.pricing.monthly.extraAmount}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^\d.]/g, '');
                          value = value.replace(/^0+(?=\d)/, '');
                          const parts = value.split('.');
                          if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              monthly: { ...prev.pricing.monthly, extraAmount: value === '' ? 0 : value }
                            }
                          }));
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          setCarForm(prev => ({
                            ...prev,
                            pricing: {
                              ...prev.pricing,
                              monthly: { ...prev.pricing.monthly, extraAmount: numValue }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base"
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 sm:gap-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all min-h-[44px] text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span className="hidden xs:inline">Saving...</span>
                      <span className="xs:hidden">...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
