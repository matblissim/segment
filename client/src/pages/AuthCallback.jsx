import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      handleCallback(code);
    } else {
      navigate('/');
    }
  }, [searchParams]);

  const handleCallback = async (code) => {
    try {
      await login(code);
      navigate('/dashboard');
    } catch (error) {
      console.error('Callback error:', error);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-strava mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion en cours...</h2>
          <p className="text-gray-600">Veuillez patienter</p>
        </div>
      </div>
    </div>
  );
}
