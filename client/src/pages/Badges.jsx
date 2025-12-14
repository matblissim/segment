import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activitiesApi, gamificationApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Badges() {
  const { user, logout } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);

      // Récupérer tous les badges disponibles
      const badgesData = await gamificationApi.getBadges();
      setAllBadges(badgesData);

      // Récupérer les activités et calculer les badges gagnés
      const data = await activitiesApi.getActivities(100);
      const activities = data.activities || data;
      const gamificationData = await gamificationApi.calculateStats(activities);
      setEarnedBadges(gamificationData.badges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBadgeEarned = (badgeId) => {
    return earnedBadges.some(badge => badge.id === badgeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-strava mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src={user?.profile || 'https://via.placeholder.com/50'}
                alt="Profile"
                className="w-12 h-12 rounded-full"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.firstname} {user?.lastname}
              </h1>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <Link to="/dashboard" className="text-gray-600 hover:text-strava">
              Tableau de bord
            </Link>
            <Link to="/activities" className="text-gray-600 hover:text-strava">
              Activités
            </Link>
            <Link to="/badges" className="text-strava font-semibold border-b-2 border-strava pb-1">
              Badges ({earnedBadges.length}/{allBadges.length})
            </Link>
            <Link to="/challenges" className="text-gray-600 hover:text-strava">
              Challenges
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Collection de Badges</h2>
          <p className="text-gray-600">
            Vous avez débloqué {earnedBadges.length} badges sur {allBadges.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-strava h-2 rounded-full transition-all duration-500"
              style={{ width: `${(earnedBadges.length / allBadges.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBadges.map((badge) => {
            const earned = isBadgeEarned(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-lg shadow p-6 transition transform hover:scale-105 ${
                  earned
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400'
                    : 'bg-white opacity-60'
                }`}
              >
                <div className="text-center">
                  <div className={`text-6xl mb-3 ${!earned && 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {badge.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {badge.description}
                  </p>
                  {earned ? (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full inline-block">
                      ✓ Débloqué
                    </div>
                  ) : (
                    <div className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full inline-block">
                      🔒 Verrouillé
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
