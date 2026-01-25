import { useNavigate } from 'react-router-dom';

const AuthRequiredMessage = ({ 
  title = "Authentication Required", 
  message = "You need to be logged in to access this feature.",
  showButtons = true,
  className = ""
}) => {
  const navigate = useNavigate();

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-semibold text-yellow-800">{title}</h3>
      </div>
      <p className="text-yellow-700 mb-4">{message}</p>
      {showButtons && (
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthRequiredMessage;