import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stravaApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Activities() {
  const { user, accessToken, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [accessToken]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await stravaApi.getActivities(accessToken, 50);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const getActivityIcon = (type) => {
    const icons = {
      'Ride': '🚴',
      'Run': '🏃',
      'Swim': '🏊',
      'Walk': '🚶',
      'Hike': '🥾',
      'default': '💪'
    };
    return icons[type] || icons.default;
  };

  const calculatePoints = (activity) => {
    let points = Math.floor((activity.distance / 1000) * 10);
    if (activity.total_elevation_gain) {
      points += Math.floor(activity.total_elevation_gain / 10);
    }
    return points;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-strava mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des activités...</p>
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
            <Link to="/activities" className="text-strava font-semibold border-b-2 border-strava pb-1">
              Activités
            </Link>
            <Link to="/badges" className="text-gray-600 hover:text-strava">
              Badges
            </Link>
            <Link to="/challenges" className="text-gray-600 hover:text-strava">
              Challenges
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Vos Activités</h2>

        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-4xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {activity.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {formatDate(activity.start_date)}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Distance</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {(activity.distance / 1000).toFixed(2)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Durée</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDuration(activity.moving_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Dénivelé</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {activity.total_elevation_gain?.toFixed(0) || 0} m
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Vitesse moy.</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {((activity.distance / 1000) / (activity.moving_time / 3600)).toFixed(1)} km/h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="bg-strava text-white px-4 py-2 rounded-lg">
                    <p className="text-sm">Points gagnés</p>
                    <p className="text-2xl font-bold">+{calculatePoints(activity)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Aucune activité trouvée. Commencez à vous entraîner!</p>
          </div>
        )}
      </main>
    </div>
  );
}
