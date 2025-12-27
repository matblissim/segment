import { useState, useEffect } from 'react';
import { activitiesApi, gamificationApi } from '../services/api';
import { useSportFilter } from '../contexts/SportFilterContext';
import Layout from '../components/Layout';
import FeedWidget from '../components/FeedWidget';
import EventsWidget from '../components/EventsWidget';
import ChallengesWidget from '../components/ChallengesWidget';
import AIAnalysisDialog from '../components/AIAnalysisDialog';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Chip,
  Progress,
  Button,
} from "@material-tailwind/react";
import {
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { SparklesIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { sportFilter } = useSportFilter();
  const [allActivities, setAllActivities] = useState([]);
  const [runningBadges, setRunningBadges] = useState([]);
  const [cyclingBadges, setCyclingBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBadge, setExpandedBadge] = useState(null);
  const [showProfileAnalysis, setShowProfileAnalysis] = useState(false);

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
      {/* AI Profile Analysis Card - Compact sur mobile */}
      <Card className="mb-3 sm:mb-6 bg-gradient-to-r from-purple-500 to-purple-700 border-0 shadow-lg">
        <CardBody className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-full bg-white/20 p-1.5 sm:p-3">
                <SparklesIcon className="h-4 w-4 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <Typography variant="h6" color="white" className="font-bold text-sm sm:text-xl">
                  Analyse IA
                </Typography>
                <Typography variant="small" color="white" className="font-normal opacity-90 text-xs hidden sm:block">
                  Feedback personnalisé sur votre progression
                </Typography>
              </div>
            </div>
            <Button
              size="sm"
              variant="filled"
              className="bg-white text-purple-700 hover:bg-gray-100 flex items-center gap-2 normal-case font-semibold w-full sm:w-auto justify-center"
              onClick={() => setShowProfileAnalysis(true)}
            >
              <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Analyser</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards - 2x2 grid sur mobile, compact */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 mb-3 sm:mb-6">
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-2 sm:p-4">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <Typography className="text-xs font-normal text-gray-600">
                  Distance
                </Typography>
                <div className="rounded-full bg-gray-100 p-1 sm:p-2">
                  <ChartBarIcon className="h-3 w-3 text-gray-700" />
                </div>
              </div>
              <Typography className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {(stats.totalDistance / 1000).toFixed(0)}
              </Typography>
              <Typography className="text-xs text-gray-500">km</Typography>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-2 sm:p-4">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <Typography className="text-xs font-normal text-gray-600">
                  Dénivelé
                </Typography>
                <div className="rounded-full bg-gray-100 p-1 sm:p-2">
                  <ChartBarIcon className="h-3 w-3 text-gray-700" />
                </div>
              </div>
              <Typography className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {stats.totalElevation.toFixed(0)}
              </Typography>
              <Typography className="text-xs text-gray-500">m D+</Typography>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-2 sm:p-4">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <Typography className="text-xs font-normal text-gray-600">
                  Badges
                </Typography>
                <div className="rounded-full bg-gray-100 p-1 sm:p-2">
                  <ChartBarIcon className="h-3 w-3 text-gray-700" />
                </div>
              </div>
              <Typography className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {earnedBadges.length}
              </Typography>
              <Typography className="text-xs text-gray-500">débloqués</Typography>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 shadow-none">
          <CardBody className="p-2 sm:p-4">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <Typography className="text-xs font-normal text-gray-600">
                  Activités
                </Typography>
                <div className="rounded-full bg-gray-100 p-1 sm:p-2">
                  <ChartBarIcon className="h-3 w-3 text-gray-700" />
                </div>
              </div>
              <Typography className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {stats.activityCount}
              </Typography>
              <Typography className="text-xs text-gray-500">sorties</Typography>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2">
        {/* Badges */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 p-3 sm:p-6 border-b border-gray-200"
          >
            <Typography variant="h6" color="blue-gray" className="text-base sm:text-lg">
              Badges {sportFilter === 'running' ? 'Course à pied' : 'Vélo'}
            </Typography>
          </CardHeader>
          <CardBody className="pt-2 sm:pt-4 p-3 sm:p-4">
            {earnedBadges.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {earnedBadges.slice(0, 5).map((badge) => (
                  <div key={badge.id} className="space-y-2">
                    <div
                      className="flex items-center justify-between p-2 sm:p-4 rounded border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedBadge(expandedBadge === badge.id ? null : badge.id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="min-w-0">
                          <Typography variant="small" color="blue-gray" className="font-semibold text-xs sm:text-sm truncate">
                            {badge.name}
                          </Typography>
                          <Typography variant="small" color="gray" className="font-normal text-xs hidden sm:block">
                            {badge.description}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* Right column: Events + Feed + Challenges */}
        <div className="space-y-3 sm:space-y-6">
          {/* Events Widget */}
          <EventsWidget />

          {/* Challenges Widget */}
          <ChallengesWidget />

          {/* Feed Widget */}
          <FeedWidget />
        </div>
      </div>

      {/* AI Profile Analysis Dialog */}
      <AIAnalysisDialog
        open={showProfileAnalysis}
        onClose={() => setShowProfileAnalysis(false)}
        activityId={null}
        activityName={null}
        isProfileAnalysis={true}
      />
    </Layout>
  );
}
