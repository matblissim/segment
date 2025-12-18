import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activitiesApi, gamificationApi, syncApi } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Chip,
  Progress,
  Avatar,
  IconButton,
} from "@material-tailwind/react";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [runningBadges, setRunningBadges] = useState([]);
  const [cyclingBadges, setCyclingBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);
  const [expandedBadge, setExpandedBadge] = useState(null);
  const [sportFilter, setSportFilter] = useState('running'); // 'running' ou 'cycling'

  useEffect(() => {
    loadData();
    loadSyncInfo();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const activitiesData = await activitiesApi.getActivities(30);
      setActivities(activitiesData.activities || activitiesData);

      const gamificationData = await gamificationApi.calculateStats(activitiesData.activities || activitiesData);
      setStats(gamificationData.stats);
      setAllBadges(gamificationData.badges || []);
      setRunningBadges(gamificationData.runningBadges || []);
      setCyclingBadges(gamificationData.cyclingBadges || []);
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
      await syncApi.startSync(false);

      setTimeout(async () => {
        await loadSyncInfo();
        setSyncing(false);
        setTimeout(loadData, 5000);
      }, 2000);
    } catch (error) {
      console.error('Error starting sync:', error);
      setSyncing(false);
      alert('Erreur lors de la synchronisation');
    }
  };

  const getSyncChipColor = () => {
    if (!syncInfo) return "gray";
    const colors = {
      syncing: "blue-gray",
      completed: "gray",
      failed: "gray",
      pending: "gray",
    };
    return colors[syncInfo.syncStatus] || "gray";
  };

  const badges = sportFilter === 'running' ? runningBadges : cyclingBadges;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
          <Typography variant="h6" color="gray">
            Chargement...
          </Typography>
        </div>
      </div>
    );
  }

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
                  {syncInfo?.activityCount || 0} activités
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncInfo && (
                <Chip
                  value={syncInfo.syncStatus === 'syncing' ? 'Sync...' : 'Sync OK'}
                  color={getSyncChipColor()}
                  variant="ghost"
                  className="capitalize"
                />
              )}
              <Button
                size="sm"
                color="gray"
                variant="text"
                className="flex items-center gap-2"
                onClick={handleSync}
                disabled={syncing || syncInfo?.syncStatus === 'syncing'}
              >
                <ArrowPathIcon className={`h-4 w-4 ${syncing || syncInfo?.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <IconButton
                size="sm"
                color="gray"
                variant="text"
                onClick={logout}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="flex gap-1">
            <Link to="/dashboard">
              <Button color="gray" variant="text" size="sm" className="rounded-none border-b-2 border-gray-900">
                Tableau de bord
              </Button>
            </Link>
            <Link to="/activities">
              <Button color="gray" variant="text" size="sm" className="rounded-none">
                Activités
              </Button>
            </Link>
            <Link to="/badges">
              <Button color="gray" variant="text" size="sm" className="rounded-none">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border border-gray-200 shadow-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-gray-600">
                    Distance
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {(Number(stats?.totalDistance || 0) / 1000).toFixed(0)} km
                  </Typography>
                </div>
                <div className="rounded-full bg-gray-100 p-3">
                  <ChartBarIcon className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-gray-200 shadow-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-gray-600">
                    Dénivelé
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {Number(stats?.totalElevation || 0).toFixed(0)} m
                  </Typography>
                </div>
                <div className="rounded-full bg-gray-100 p-3">
                  <ChartBarIcon className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-gray-200 shadow-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-gray-600">
                    Badges
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {badges.filter(b => b.earned).length}
                  </Typography>
                </div>
                <div className="rounded-full bg-gray-100 p-3">
                  <ChartBarIcon className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-gray-200 shadow-none">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-gray-600">
                    Activités
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {syncInfo?.activityCount || 0}
                  </Typography>
                </div>
                <div className="rounded-full bg-gray-100 p-3">
                  <ChartBarIcon className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Badges */}
          <Card className="border border-gray-200 shadow-none">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6 border-b border-gray-200"
            >
              <Typography variant="h6" color="blue-gray">
                Badges {sportFilter === 'running' ? 'Course à pied' : 'Vélo'}
              </Typography>
            </CardHeader>
            <CardBody className="pt-4">
              {badges.filter(b => b.earned).length > 0 ? (
                <div className="space-y-3">
                  {badges.filter(b => b.earned).map((badge) => (
                    <div key={badge.id} className="space-y-2">
                      <div
                        className="flex items-center justify-between p-4 rounded border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedBadge(expandedBadge === badge.id ? null : badge.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <Typography variant="small" color="blue-gray" className="font-semibold">
                              {badge.name}
                            </Typography>
                            <Typography variant="small" color="gray" className="font-normal">
                              {badge.description}
                            </Typography>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip
                            value={`×${badge.count}`}
                            size="sm"
                            variant="ghost"
                            className="bg-gray-100 text-gray-900 font-semibold"
                          />
                        </div>
                      </div>

                      {expandedBadge === badge.id && badge.activities && badge.activities.length > 0 && (
                        <div className="ml-4 p-3 bg-gray-50 rounded border border-gray-200">
                          <Typography variant="small" color="blue-gray" className="font-medium mb-2">
                            Activités ({badge.activities.length})
                          </Typography>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {badge.activities.map((activity) => (
                              <div key={activity.id} className="flex justify-between items-center p-2 hover:bg-white rounded">
                                <div className="flex-1">
                                  <Typography variant="small" color="blue-gray">
                                    {activity.name || `${activity.type} - ${new Date(activity.start_date).toLocaleDateString()}`}
                                  </Typography>
                                  <div className="flex items-center gap-2">
                                    <Typography variant="small" color="gray">
                                      {new Date(activity.start_date).toLocaleDateString('fr-FR')}
                                    </Typography>
                                    {activity.city && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <Typography variant="small" color="gray">
                                          {activity.city}
                                        </Typography>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                  {(activity.distance / 1000).toFixed(1)} km
                                </Typography>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="small" color="gray" className="text-center py-8">
                  Aucun badge pour le moment
                </Typography>
              )}
            </CardBody>
          </Card>

          {/* Challenges */}
          <Card className="border border-gray-200 shadow-none">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6 border-b border-gray-200"
            >
              <Typography variant="h6" color="blue-gray">
                Challenges
              </Typography>
            </CardHeader>
            <CardBody className="pt-4">
              {challenges.length > 0 ? (
                <div className="space-y-4">
                  {challenges.slice(0, 3).map((challenge) => (
                    <div key={challenge.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {challenge.name}
                          </Typography>
                          <Typography variant="small" color="gray">
                            +{challenge.reward} points
                          </Typography>
                        </div>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {Number(challenge.progress || 0).toFixed(0)}%
                        </Typography>
                      </div>
                      <Progress
                        value={Math.min(challenge.progress || 0, 100)}
                        color="gray"
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="small" color="gray" className="text-center py-8">
                  Aucun challenge actif
                </Typography>
              )}
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
