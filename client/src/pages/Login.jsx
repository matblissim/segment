import { useState } from 'react';
import { stravaApi } from '../services/api';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { url } = await stravaApi.getAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Strava Gamification
          </h1>
          <p className="text-gray-600 mb-8">
            Transformez vos activités en aventure épique
          </p>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Fonctionnalités
              </h2>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="mr-2">🏆</span>
                  Gagnez des points pour chaque activité
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🎖️</span>
                  Débloquez des badges exclusifs
                </li>
                <li className="flex items-center">
                  <span className="mr-2">🎯</span>
                  Relevez des challenges hebdomadaires
                </li>
                <li className="flex items-center">
                  <span className="mr-2">📊</span>
                  Comparez-vous aux autres
                </li>
              </ul>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-strava hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter avec Strava'}
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            En vous connectant, vous autorisez l'accès à vos activités Strava
          </p>
        </div>
      </div>
    </div>
  );
}
