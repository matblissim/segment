import { useState, useEffect } from 'react';
import { activitiesApi, gamificationApi } from '../services/api';
import { useSportFilter } from '../contexts/SportFilterContext';
import Layout from '../components/Layout';
import FeedWidget from '../components/FeedWidget';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Chip,
  Progress,
} from "@material-tailwind/react";
import {
  ChartBarIcon,
} from "@heroicons/react/24/solid";

export default function Dashboard() {
  const { sportFilter } = useSportFilter();
  const [allActivities, setAllActivities] = useState([]);
  const [runningBadges, setRunningBadges] = useState([]);
  const [cyclingBadges, setCyclingBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBadge, setExpandedBadge] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Récupérer toutes les activités pour des stats précises
      const activitiesData = await activitiesApi.getAllActivities();
      const activities = activitiesData.activities || activitiesData;
      setAllActivities(activities);

      // Calculer les badges (le backend récupère les activités depuis la DB)
      const gamificationData = await gamificationApi.calculateStats();
      setRunningBadges(gamificationData.runningBadges || []);
      setCyclingBadges(gamificationData.cyclingBadges || []);
      setChallenges(gamificationData.challenges || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les activités selon le sport
  const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Trail'];
  const CYCLING_TYPES = ['Ride', 'VirtualRide', 'EBikeRide'];

  const filteredActivities = sportFilter === 'running'
    ? allActivities.filter(a => RUNNING_TYPES.includes(a.type))
    : allActivities.filter(a => CYCLING_TYPES.includes(a.type));

  // Calculer les stats selon le sport sélectionné
  const stats = {
    totalDistance: Number(filteredActivities.reduce((sum, a) => sum + (Number(a.distance) || 0), 0)) || 0,
    totalElevation: Number(filteredActivities.reduce((sum, a) => sum + (Number(a.total_elevation_gain) || 0), 0)) || 0,
    activityCount: filteredActivities.length,
  };

  const badges = sportFilter === 'running' ? runningBadges : cyclingBadges;
  const earnedBadges = badges.filter(b => b.earned);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
            <Typography variant="h6" color="gray">
              Chargement...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
                  {(stats.totalDistance / 1000).toFixed(0)} km
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
                  {stats.totalElevation.toFixed(0)} m
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
                  {earnedBadges.length}
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
                  {stats.activityCount}
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
            {earnedBadges.length > 0 ? (
              <div className="space-y-3">
                {earnedBadges.map((badge) => (
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

        {/* Right column: Feed + Challenges */}
        <div className="space-y-6">
          {/* Feed Widget */}
          <FeedWidget />

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
      </div>
    </Layout>
  );
}
