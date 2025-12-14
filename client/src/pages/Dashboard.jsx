import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activitiesApi, gamificationApi, syncApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => {
    loadData();
    loadSyncInfo();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Récupérer les activités depuis la BDD
      const activitiesData = await activitiesApi.getActivities(30);
      setActivities(activitiesData.activities || activitiesData);

      // Calculer les stats de gamification
      const gamificationData = await gamificationApi.calculateStats(activitiesData.activities || activitiesData);
      setStats(gamificationData.stats);
      setBadges(gamificationData.badges);
      setChallenges(gamificationData.challenges);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncInfo = async () => {
    try {
      const info = await syncApi.getSyncInfo();
      setSyncInfo(info);

      // Si sync en cours, poll le statut toutes les 5 secondes
      if (info.syncStatus === 'syncing') {
        setTimeout(loadSyncInfo, 5000);
      }
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncApi.startSync(false); // Sync incrémentale

      // Recharger le statut de sync après 2 secondes
      setTimeout(async () => {
        await loadSyncInfo();
        setSyncing(false);

        // Recharger les données après 5 secondes pour laisser le temps à la sync
        setTimeout(loadData, 5000);
      }, 2000);
    } catch (error) {
      console.error('Error starting sync:', error);
      setSyncing(false);
      alert('Erreur lors de la synchronisation. Veuillez réessayer.');
    }
  };

  const getSyncStatusBadge = () => {
    if (!syncInfo) return null;

    const statusConfig = {
      syncing: { color: 'bg-blue-500', text: 'Sync...', icon: '🔄', animate: true },
      completed: { color: 'bg-green-500', text: 'Sync OK', icon: '✓', animate: false },
      failed: { color: 'bg-red-500', text: 'Échec', icon: '✗', animate: false },
      pending: { color: 'bg-yellow-500', text: 'En attente', icon: '⏳', animate: false },
    };

    const config = statusConfig[syncInfo.syncStatus] || statusConfig.pending;

    return (
      <div className={`${config.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.animate ? 'animate-pulse' : ''}`}>
        <span className={config.animate ? 'animate-spin' : ''}>{config.icon}</span>
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-strava mx-auto mb-4"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">🏃</div>
          </div>
          <p className="text-gray-700 font-medium">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Moderne */}
      <header className="bg-white shadow-lg border-b-4 border-strava">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={user?.profile || 'https://via.placeholder.com/60'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-4 border-strava shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-strava to-orange-600 bg-clip-text text-transparent">
                  {user?.firstname} {user?.lastname}
                </h1>
                <p className="text-gray-600 font-medium">
                  {stats?.totalPoints || 0} points • {syncInfo?.activityCount || 0} activités
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getSyncStatusBadge()}
              <button
                onClick={handleSync}
                disabled={syncing || syncInfo?.syncStatus === 'syncing'}
                className="bg-gradient-to-r from-strava to-orange-600 hover:from-orange-600 hover:to-strava text-white px-6 py-3 rounded-full font-semibold shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className={syncing || syncInfo?.syncStatus === 'syncing' ? 'animate-spin' : ''}>
                  🔄
                </span>
                Synchroniser
              </button>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transform transition hover:scale-105"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Moderne */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <Link to="/dashboard" className="text-strava font-bold border-b-4 border-strava pb-1 flex items-center gap-2">
              🏠 Tableau de bord
            </Link>
            <Link to="/stats" className="text-gray-600 hover:text-strava font-semibold transition flex items-center gap-2">
              📊 Statistiques
            </Link>
            <Link to="/total" className="text-gray-600 hover:text-strava font-semibold transition flex items-center gap-2">
              🏆 Total
            </Link>
            <Link to="/activities" className="text-gray-600 hover:text-strava font-semibold transition flex items-center gap-2">
              🚴 Activités
            </Link>
            <Link to="/badges" className="text-gray-600 hover:text-strava font-semibold transition flex items-center gap-2">
              🎖️ Badges ({badges.length})
            </Link>
            <Link to="/challenges" className="text-gray-600 hover:text-strava font-semibold transition flex items-center gap-2">
              🎯 Challenges
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message si aucune activité */}
        {syncInfo && syncInfo.activityCount === 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-6xl">🚀</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Bienvenue sur votre tableau de bord!</h2>
                <p className="text-blue-100">
                  Cliquez sur "Synchroniser" pour récupérer vos activités Strava et commencer à gagner des points!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid Moderne avec Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-6 text-white transform transition hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Points Total</p>
                <p className="text-4xl font-black">{stats?.totalPoints || 0}</p>
              </div>
              <div className="text-6xl opacity-80">🏆</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-xl p-6 text-white transform transition hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Distance Totale</p>
                <p className="text-4xl font-black">
                  {(Number(stats?.totalDistance || 0) / 1000).toFixed(1)}
                  <span className="text-2xl ml-1">km</span>
                </p>
              </div>
              <div className="text-6xl opacity-80">🚴</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-xl p-6 text-white transform transition hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Badges Débloqués</p>
                <p className="text-4xl font-black">{badges.length}</p>
              </div>
              <div className="text-6xl opacity-80">🎖️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl shadow-xl p-6 text-white transform transition hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Dénivelé Total</p>
                <p className="text-4xl font-black">
                  {Number(stats?.totalElevation || 0).toFixed(0)}
                  <span className="text-2xl ml-1">m</span>
                </p>
              </div>
              <div className="text-6xl opacity-80">⛰️</div>
            </div>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">🎖️</span>
            Badges Récents
          </h2>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {badges.slice(0, 4).map((badge) => (
                <div key={badge.id} className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-400 shadow-lg transform transition hover:scale-110 hover:shadow-2xl">
                  <div className="text-6xl mb-3 animate-bounce">{badge.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600">Aucun badge débloqué pour le moment. Continuez à vous entraîner!</p>
            </div>
          )}
        </div>

        {/* Active Challenges */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            Challenges en Cours
          </h2>
          {challenges.length > 0 ? (
            <div className="space-y-4">
              {challenges.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-strava transition transform hover:scale-102 hover:shadow-lg bg-gradient-to-r from-white to-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{challenge.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{challenge.name}</h3>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                      </div>
                    </div>
                    <span className="text-strava font-black text-xl">
                      +{challenge.reward} pts
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-strava to-orange-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.min(challenge.progress || 0, 100)}%` }}
                      >
                        {challenge.progress >= 10 && (
                          <span className="text-white text-xs font-bold">
                            {Number(challenge.progress || 0).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {challenge.progress < 10 && (
                      <p className="text-sm text-gray-600 mt-1 font-semibold">
                        {Number(challenge.progress || 0).toFixed(1)}% complété
                      </p>
                    )}
                  </div>
                  {challenge.completed && (
                    <span className="inline-block mt-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ✓ Terminé!
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💪</div>
              <p className="text-gray-600">Aucun challenge actif pour le moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
