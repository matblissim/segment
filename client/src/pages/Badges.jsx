import { useState, useEffect } from 'react';
import { activitiesApi, gamificationApi } from '../services/api';
import { useSportFilter } from '../contexts/SportFilterContext';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  Typography,
  Chip,
} from "@material-tailwind/react";

export default function Badges() {
  const { sportFilter } = useSportFilter();
  const [runningBadges, setRunningBadges] = useState([]);
  const [cyclingBadges, setCyclingBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBadge, setExpandedBadge] = useState(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      // Le backend récupère les activités depuis la DB
      const gamificationData = await gamificationApi.calculateStats();
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
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
            <Typography variant="h6" color="gray">
              Chargement des badges...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  const badges = sportFilter === 'running' ? runningBadges : cyclingBadges;
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <Layout>
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
                {badge.weekly ? (
                  // Affichage pour badges hebdomadaires: grouper par semaine
                  <>
                    <Typography variant="small" color="blue-gray" className="font-medium mb-3">
                      Semaines qualifiantes ({badge.count})
                    </Typography>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(() => {
                        // Grouper les activités par semaine
                        const weekGroups = {};
                        badge.activities.forEach(activity => {
                          const date = new Date(activity.start_date);
                          const day = date.getDay();
                          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                          const monday = new Date(date);
                          monday.setDate(diff);
                          const weekKey = monday.toISOString().split('T')[0];

                          if (!weekGroups[weekKey]) {
                            weekGroups[weekKey] = { distance: 0, elevation: 0, activities: [] };
                          }
                          weekGroups[weekKey].distance += Number(activity.distance) || 0;
                          weekGroups[weekKey].elevation += Number(activity.total_elevation_gain) || 0;
                          weekGroups[weekKey].activities.push(activity);
                        });

                        return Object.entries(weekGroups)
                          .sort(([a], [b]) => new Date(b) - new Date(a))
                          .map(([weekKey, week]) => (
                            <div key={weekKey} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition">
                              <div className="flex-1 mr-4">
                                <Typography variant="small" color="blue-gray" className="font-medium">
                                  Semaine du {new Date(weekKey).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </Typography>
                                <Typography variant="small" color="gray">
                                  {week.activities.length} activité{week.activities.length > 1 ? 's' : ''}
                                </Typography>
                              </div>
                              <Chip
                                value={
                                  badge.metric === 'elevation'
                                    ? `${Math.round(week.elevation)} D+`
                                    : `${(week.distance / 1000).toFixed(1)} km`
                                }
                                color="gray"
                                variant="ghost"
                                className="font-semibold"
                              />
                            </div>
                          ));
                      })()}
                    </div>
                  </>
                ) : (
                  // Affichage pour badges individuels: liste des activités
                  <>
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
                  </>
                )}
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
    </Layout>
  );
}
