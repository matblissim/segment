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
  const [allBadges, setAllBadges] = useState([]);
  const [runningBadges, setRunningBadges] = useState([]);
  const [cyclingBadges, setCyclingBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBadge, setExpandedBadge] = useState(null);
  const [sportFilter, setSportFilter] = useState('running');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const data = await activitiesApi.getAllActivities();
      const activities = data.activities || data;

      const gamificationData = await gamificationApi.calculateStats(activities);
      setAllBadges(gamificationData.badges || []);
      setRunningBadges(gamificationData.runningBadges || []);
      setCyclingBadges(gamificationData.cyclingBadges || []);
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
          <Typography variant="h6" color="gray">
            Chargement des badges...
          </Typography>
        </div>
      </div>
    );
  }

  const badges = sportFilter === 'running' ? runningBadges : cyclingBadges;
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.profile || 'https://via.placeholder.com/150'}
                alt={user?.firstname}
                size="md"
                className="ring-2 ring-gray-200"
              />
              <div>
                <Typography variant="h6" color="blue-gray">
                  {user?.firstname} {user?.lastname}
                </Typography>
                <Typography variant="small" color="gray" className="font-normal">
                  {earnedBadges.length} badges débloqués
                </Typography>
              </div>
            </div>
            <IconButton
              size="sm"
              color="gray"
              variant="text"
              onClick={logout}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="flex gap-1">
            <Link to="/dashboard">
              <Button color="gray" variant="text" size="sm" className="rounded-none">
                Tableau de bord
              </Button>
            </Link>
            <Link to="/activities">
              <Button color="gray" variant="text" size="sm" className="rounded-none">
                Activités
              </Button>
            </Link>
            <Link to="/badges">
              <Button color="gray" variant="text" size="sm" className="rounded-none border-b-2 border-gray-900">
                Badges
              </Button>
            </Link>
            <Link to="/challenges">
              <Button color="gray" variant="text" size="sm" className="rounded-none">
                Challenges
              </Button>
            </Link>
            <Link to="/stats">
              <Button color="gray" variant="text" size="sm" className="rounded-none">
                Statistiques
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Sport Toggle */}
        <Card className="mb-6 border border-gray-200 shadow-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <Typography variant="small" color="blue-gray" className="font-medium">
                Type de sport
              </Typography>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="gray"
                  variant={sportFilter === 'running' ? 'filled' : 'outlined'}
                  onClick={() => setSportFilter('running')}
                  className="normal-case"
                >
                  Course à pied
                </Button>
                <Button
                  size="sm"
                  color="gray"
                  variant={sportFilter === 'cycling' ? 'filled' : 'outlined'}
                  onClick={() => setSportFilter('cycling')}
                  className="normal-case"
                >
                  Vélo
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Stats */}
        <Card className="mb-6 border border-gray-200 shadow-none">
          <CardBody>
            <Typography variant="h5" color="blue-gray" className="mb-2">
              Collection de Badges
            </Typography>
            <Typography variant="small" color="gray" className="mb-4">
              {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''} débloqué{earnedBadges.length > 1 ? 's' : ''} sur {badges.length}
            </Typography>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gray-900 h-3 rounded-full transition-all duration-500"
                style={{ width: `${badges.length > 0 ? (earnedBadges.length / badges.length) * 100 : 0}%` }}
              ></div>
            </div>
          </CardBody>
        </Card>

        {/* Badges List */}
        <div className="grid grid-cols-1 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="space-y-2">
              <div
                className={`flex items-center justify-between p-6 rounded border-2 transition-all ${
                  badge.earned
                    ? 'bg-white border-gray-300 cursor-pointer hover:shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
                onClick={() => badge.earned && setExpandedBadge(expandedBadge === badge.id ? null : badge.id)}
              >
                <div className="flex items-center gap-4">
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
                        variant="ghost"
                        className="bg-gray-100 text-gray-900 font-bold text-lg px-4"
                      />
                      <Chip
                        value="Débloqué"
                        color="gray"
                        className="font-medium"
                      />
                    </>
                  ) : (
                    <Chip
                      value="Verrouillé"
                      color="gray"
                      variant="ghost"
                      className="font-medium"
                    />
                  )}
                </div>
              </div>

              {expandedBadge === badge.id && badge.activities && badge.activities.length > 0 && (
                <div className="ml-12 p-4 bg-white rounded border border-gray-300">
                  <Typography variant="small" color="blue-gray" className="font-medium mb-3">
                    Liste des activités ({badge.activities.length})
                  </Typography>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {badge.activities.map((activity) => (
                      <div key={activity.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition">
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
                                  <span className="font-medium">{activity.city}</span>
                                </Typography>
                              </>
                            )}
                          </div>
                        </div>
                        <Chip
                          value={`${(activity.distance / 1000).toFixed(1)} km`}
                          color="gray"
                          variant="ghost"
                          className="font-semibold"
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
          <Card className="border border-gray-200 shadow-none">
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
