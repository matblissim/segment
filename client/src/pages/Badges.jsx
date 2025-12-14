import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activitiesApi, gamificationApi } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Button,
} from "@material-tailwind/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";

export default function Badges() {
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBadge, setExpandedBadge] = useState(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);

      // Récupérer TOUTES les activités pour un comptage précis
      const data = await activitiesApi.getAllActivities();
      const activities = data.activities || data;

      // Calculer les badges avec comptage
      const gamificationData = await gamificationApi.calculateStats(activities);
      setBadges(gamificationData.badges);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <Typography variant="h6" color="gray">
            Chargement des badges...
          </Typography>
        </div>
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-deep-orange-600 pb-32">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.profile || 'https://via.placeholder.com/150'}
                alt={user?.firstname}
                size="md"
                className="ring-2 ring-white"
              />
              <div>
                <Typography variant="h6" color="white">
                  {user?.firstname} {user?.lastname}
                </Typography>
                <Typography variant="small" color="white" className="opacity-80">
                  {earnedBadges.length} badges débloqués
                </Typography>
              </div>
            </div>
            <IconButton
              size="sm"
              color="white"
              variant="text"
              onClick={logout}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex gap-4">
            <Link to="/dashboard">
              <Button color="white" variant="text" size="sm">Tableau de bord</Button>
            </Link>
            <Link to="/activities">
              <Button color="white" variant="text" size="sm">Activités</Button>
            </Link>
            <Link to="/badges">
              <Button color="white" size="sm">Badges</Button>
            </Link>
            <Link to="/challenges">
              <Button color="white" variant="text" size="sm">Challenges</Button>
            </Link>
            <Link to="/stats">
              <Button color="white" variant="text" size="sm">Statistiques</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 pb-12">
        <Card className="mb-6 border border-blue-gray-100 shadow-sm">
          <CardBody>
            <Typography variant="h5" color="blue-gray" className="mb-2">
              Collection de Badges 🏆
            </Typography>
            <Typography variant="small" color="gray" className="mb-4">
              Vous avez débloqué {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''} sur {badges.length}
            </Typography>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-deep-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${badges.length > 0 ? (earnedBadges.length / badges.length) * 100 : 0}%` }}
              ></div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="space-y-2">
              <div
                className={`flex items-center justify-between p-6 rounded-lg border-2 transition-all ${
                  badge.earned
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 cursor-pointer hover:shadow-lg'
                    : 'bg-white border-gray-200 opacity-60'
                }`}
                onClick={() => badge.earned && setExpandedBadge(expandedBadge === badge.id ? null : badge.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-5xl ${!badge.earned && 'grayscale opacity-40'}`}>
                    {badge.icon}
                  </div>
                  <div>
                    <Typography variant="h6" color="blue-gray">
                      {badge.name}
                    </Typography>
                    <Typography variant="small" color="gray">
                      {badge.description}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {badge.earned ? (
                    <>
                      <Chip
                        value={`×${badge.count}`}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-deep-orange-600 text-white font-bold text-lg px-4"
                      />
                      <Chip
                        value="✓ Débloqué"
                        color="green"
                        className="font-semibold"
                      />
                    </>
                  ) : (
                    <Chip
                      value="🔒 Verrouillé"
                      color="gray"
                      variant="ghost"
                      className="font-semibold"
                    />
                  )}
                </div>
              </div>

              {expandedBadge === badge.id && badge.activities && badge.activities.length > 0 && (
                <div className="ml-12 p-4 bg-white rounded-lg border border-gray-300 shadow-inner">
                  <Typography variant="small" color="blue-gray" className="font-semibold mb-3">
                    📋 Liste des activités ({badge.activities.length}):
                  </Typography>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {badge.activities.map((activity) => (
                      <div key={activity.id} className="flex justify-between items-center p-3 hover:bg-orange-50 rounded-lg transition">
                        <div className="flex-1 mr-4">
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {activity.name || `${activity.type} - ${new Date(activity.start_date).toLocaleDateString()}`}
                          </Typography>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Typography variant="small" color="gray">
                              {new Date(activity.start_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Typography>
                            {activity.city && (
                              <>
                                <span className="text-gray-400">•</span>
                                <Typography variant="small" color="blue-gray" className="flex items-center gap-1">
                                  📍 <span className="font-medium">{activity.city}</span>
                                </Typography>
                              </>
                            )}
                          </div>
                        </div>
                        <Chip
                          value={`${(activity.distance / 1000).toFixed(1)} km`}
                          color="orange"
                          variant="gradient"
                          className="font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {badges.length === 0 && (
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody className="text-center py-12">
              <Typography variant="h6" color="gray">
                Aucun badge disponible pour le moment
              </Typography>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}
