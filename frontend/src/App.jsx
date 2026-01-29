import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ContactProtectedRoute from './components/ContactProtectedRoute';
import TourBookingProtectedRoute from './components/TourBookingProtectedRoute';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerification from './pages/EmailVerification';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import CarRental from './pages/CarRental';
import TourPackages from './pages/TourPackages';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import TourDetail from './pages/TourDetail';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
          {/* Global animated background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Floating circles */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-10 animate-float" style={{ animationDuration: '6s' }} />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-10 animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }} />
            
            {/* Central gradient circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-5 animate-gradient-xy" />
            
            {/* Additional floating circles only */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full opacity-15 animate-float" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          </div>
          
          <Navbar />

          <main className="flex-grow relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              <Route path="/car-rental" element={<CarRental />} />
              <Route path="/tour-packages" element={<TourPackages />} />
              <Route path="/tour-packages/:id" element={
                <TourBookingProtectedRoute>
                  <TourDetail />
                </TourBookingProtectedRoute>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={
                <ContactProtectedRoute>
                  <Contact />
                </ContactProtectedRoute>
              } />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route 
                path="/user-dashboard" 
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-bookings" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen py-8">
                      <div className="container mx-auto px-4">
                        <h1 className="text-4xl font-bold text-center mb-8">My Bookings</h1>
                        <div className="bg-white rounded-lg shadow-md p-8">
                          <p className="text-lg text-gray-600">Your booking history will appear here.</p>
                        </div>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } 
              />
              {/* Catch-all route for 404 - must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;