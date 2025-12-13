import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stravaApi, gamificationApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, accessToken, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Récupérer les activités
      const activitiesData = await stravaApi.getActivities(accessToken, 30);
      setActivities(activitiesData);

      // Calculer les stats de gamification
      const gamificationData = await gamificationApi.calculateStats(activitiesData);
      setStats(gamificationData.stats);
      setBadges(gamificationData.badges);
      setChallenges(gamificationData.challenges);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-strava mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos données...</p>
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.firstname} {user?.lastname}
                </h1>
                <p className="text-gray-600">
                  {stats?.totalPoints || 0} points
                </p>
              </div>
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
            <Link to="/dashboard" className="text-strava font-semibold border-b-2 border-strava pb-1">
              Tableau de bord
            </Link>
            <Link to="/activities" className="text-gray-600 hover:text-strava">
              Activités
            </Link>
            <Link to="/badges" className="text-gray-600 hover:text-strava">
              Badges ({badges.length})
            </Link>
            <Link to="/challenges" className="text-gray-600 hover:text-strava">
              Challenges
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Points Total</p>
                <p className="text-3xl font-bold text-strava">{stats?.totalPoints || 0}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Distance Totale</p>
                <p className="text-3xl font-bold text-gray-900">
                  {((stats?.totalDistance || 0) / 1000).toFixed(1)} km
                </p>
              </div>
              <div className="text-4xl">🚴</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Badges Débloqués</p>
                <p className="text-3xl font-bold text-gray-900">{badges.length}</p>
              </div>
              <div className="text-4xl">🎖️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Dénivelé Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats?.totalElevation || 0).toFixed(0)} m
                </p>
              </div>
              <div className="text-4xl">⛰️</div>
            </div>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Badges Récents</h2>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.slice(0, 4).map((badge) => (
                <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                  <div className="text-5xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Aucun badge débloqué pour le moment. Continuez à vous entraîner!</p>
          )}
        </div>

        {/* Active Challenges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Challenges en Cours</h2>
          {challenges.length > 0 ? (
            <div className="space-y-4">
              {challenges.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{challenge.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-strava">
                      +{challenge.reward} pts
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-strava h-2 rounded-full transition-all duration-500"
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {challenge.progress.toFixed(1)}% complété
                    {challenge.completed && <span className="text-green-600 ml-2">✓ Terminé!</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Aucun challenge actif</p>
          )}
        </div>
      </main>
    </div>
  );
}
