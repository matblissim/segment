import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stravaApi, gamificationApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Challenges() {
  const { user, accessToken, logout } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, [accessToken]);

  const loadChallenges = async () => {
    try {
      setLoading(true);

      // Récupérer les activités
      const activities = await stravaApi.getActivities(accessToken, 100);

      // Calculer les stats de gamification
      const gamificationData = await gamificationApi.calculateStats(activities);
      setChallenges(gamificationData.challenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeStatus = (challenge) => {
    if (challenge.completed) {
      return { text: 'Terminé!', color: 'bg-green-500', textColor: 'text-white' };
    } else if (challenge.progress >= 50) {
      return { text: 'En cours', color: 'bg-yellow-500', textColor: 'text-white' };
    } else {
      return { text: 'Non commencé', color: 'bg-gray-300', textColor: 'text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-strava mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des challenges...</p>
        </div>
      </div>
    );
  }

  const completedChallenges = challenges.filter(c => c.completed);
  const activeChallenges = challenges.filter(c => !c.completed);

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
            <Link to="/badges" className="text-gray-600 hover:text-strava">
              Badges
            </Link>
            <Link to="/challenges" className="text-strava font-semibold border-b-2 border-strava pb-1">
              Challenges
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats Summary */}
        <div className="bg-gradient-to-r from-strava to-orange-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Vos Challenges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-orange-100 text-sm">Total</p>
              <p className="text-2xl font-bold">{challenges.length}</p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">Complétés</p>
              <p className="text-2xl font-bold">{completedChallenges.length}</p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">En cours</p>
              <p className="text-2xl font-bold">{activeChallenges.length}</p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">Points gagnés</p>
              <p className="text-2xl font-bold">
                {completedChallenges.reduce((sum, c) => sum + c.reward, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Challenges Actifs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeChallenges.map((challenge) => {
              const status = getChallengeStatus(challenge);
              return (
                <div key={challenge.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{challenge.icon}</div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{challenge.name}</h4>
                        <p className="text-gray-600 text-sm">{challenge.description}</p>
                      </div>
                    </div>
                    <div className={`${status.color} ${status.textColor} px-3 py-1 rounded-full text-sm font-semibold`}>
                      {status.text}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-semibold text-gray-900">{challenge.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-strava to-orange-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${challenge.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-gray-600 text-sm">Récompense</span>
                    <span className="text-strava font-bold text-lg">+{challenge.reward} points</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Challenges Complétés</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedChallenges.map((challenge) => (
                <div key={challenge.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{challenge.icon}</div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{challenge.name}</h4>
                        <p className="text-gray-600 text-sm">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Terminé
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-green-300">
                    <span className="text-gray-600 text-sm">Récompense obtenue</span>
                    <span className="text-green-600 font-bold text-lg">+{challenge.reward} points</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {challenges.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Aucun challenge disponible pour le moment.</p>
          </div>
        )}
      </main>
    </div>
  );
}
