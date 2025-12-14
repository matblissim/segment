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
  TrophyIcon,
  MapIcon,
  FireIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";

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
      const activitiesData = await activitiesApi.getActivities(30);
      setActivities(activitiesData.activities || activitiesData);

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
      syncing: "blue",
      completed: "green",
      failed: "red",
      pending: "amber",
    };
    return colors[syncInfo.syncStatus] || "gray";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
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
                  {syncInfo?.activityCount || 0} activités • {stats?.totalPoints || 0} points
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncInfo && (
                <Chip
                  value={syncInfo.syncStatus === 'syncing' ? 'Sync...' : 'Sync OK'}
                  color={getSyncChipColor()}
                  className="capitalize"
                />
              )}
              <Button
                size="sm"
                color="white"
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
                color="white"
                variant="text"
                onClick={logout}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex gap-4">
            <Link to="/dashboard">
              <Button color="white" size="sm">Tableau de bord</Button>
            </Link>
            <Link to="/activities">
              <Button color="white" variant="text" size="sm">Activités</Button>
            </Link>
            <Link to="/badges">
              <Button color="white" variant="text" size="sm">Badges</Button>
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
        {/* Welcome Message */}
        {syncInfo && syncInfo.activityCount === 0 && (
          <Card className="mb-6 border border-blue-gray-100 shadow-sm bg-gradient-to-r from-blue-500 to-blue-600">
            <CardBody className="flex items-center gap-4 text-white">
              <FireIcon className="h-12 w-12" />
              <div>
                <Typography variant="h5" color="white" className="mb-1">
                  Bienvenue! 🚀
                </Typography>
                <Typography color="white" className="opacity-90">
                  Cliquez sur "Sync" pour récupérer vos activités Strava!
                </Typography>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-blue-gray-600">
                    Points Total
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {stats?.totalPoints || 0}
                  </Typography>
                </div>
                <div className="rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 p-3">
                  <TrophyIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-blue-gray-600">
                    Distance
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {(Number(stats?.totalDistance || 0) / 1000).toFixed(0)} km
                  </Typography>
                </div>
                <div className="rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 p-3">
                  <MapIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-blue-gray-600">
                    Badges
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {badges.length}
                  </Typography>
                </div>
                <div className="rounded-full bg-gradient-to-tr from-pink-600 to-pink-400 p-3">
                  <FireIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-blue-gray-100 shadow-sm">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="small" className="font-normal text-blue-gray-600">
                    Dénivelé
                  </Typography>
                  <Typography variant="h4" color="blue-gray">
                    {Number(stats?.totalElevation || 0).toFixed(0)} m
                  </Typography>
                </div>
                <div className="rounded-full bg-gradient-to-tr from-green-600 to-green-400 p-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Badges */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6"
            >
              <Typography variant="h6" color="blue-gray">
                Badges Récents 🎖️
              </Typography>
            </CardHeader>
            <CardBody className="pt-0">
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {badges.slice(0, 4).map((badge) => (
                    <div key={badge.id} className="text-center rounded-lg bg-orange-50 p-4">
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        {badge.name}
                      </Typography>
                      <Typography variant="small" color="gray" className="font-normal">
                        {badge.description}
                      </Typography>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="small" color="gray" className="text-center py-8">
                  Aucun badge pour le moment. Continuez à vous entraîner!
                </Typography>
              )}
            </CardBody>
          </Card>

          {/* Challenges */}
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6"
            >
              <Typography variant="h6" color="blue-gray">
                Challenges Actifs 🎯
              </Typography>
            </CardHeader>
            <CardBody className="pt-0">
              {challenges.length > 0 ? (
                <div className="space-y-4">
                  {challenges.slice(0, 3).map((challenge) => (
                    <div key={challenge.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{challenge.icon}</span>
                          <div>
                            <Typography variant="small" color="blue-gray" className="font-bold">
                              {challenge.name}
                            </Typography>
                            <Typography variant="small" color="gray">
                              +{challenge.reward} points
                            </Typography>
                          </div>
                        </div>
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          {Number(challenge.progress || 0).toFixed(0)}%
                        </Typography>
                      </div>
                      <Progress
                        value={Math.min(challenge.progress || 0, 100)}
                        color="orange"
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
