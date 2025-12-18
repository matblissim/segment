import { useState, useEffect } from 'react';
import { activitiesApi } from '../services/api';
import { useSportFilter } from '../contexts/SportFilterContext';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  Typography,
  Chip,
} from "@material-tailwind/react";

export default function Activities() {
  const { sportFilter } = useSportFilter();
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activitiesApi.getAllActivities();
      setAllActivities(data.activities || data);
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

  // Filtrer les activités selon le sport
  const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Trail'];
  const CYCLING_TYPES = ['Ride', 'VirtualRide', 'EBikeRide'];

  const filteredActivities = sportFilter === 'running'
    ? allActivities.filter(a => RUNNING_TYPES.includes(a.type))
    : allActivities.filter(a => CYCLING_TYPES.includes(a.type));

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
            <Typography variant="h6" color="gray">
              Chargement des activités...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" color="blue-gray" className="mb-6">
        Activités
      </Typography>

      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className="border border-gray-200 shadow-none hover:shadow-sm transition">
            <CardBody>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Typography variant="h6" color="blue-gray">
                      {activity.name}
                    </Typography>
                    <Chip
                      value={activity.type}
                      size="sm"
                      variant="ghost"
                      color="gray"
                      className="font-normal"
                    />
                  </div>
                  <Typography variant="small" color="gray" className="mb-4">
                    {formatDate(activity.start_date)}
                  </Typography>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Typography variant="small" color="gray" className="font-normal">
                        Distance
                      </Typography>
                      <Typography variant="h6" color="blue-gray">
                        {(Number(activity.distance || 0) / 1000).toFixed(2)} km
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" color="gray" className="font-normal">
                        Durée
                      </Typography>
                      <Typography variant="h6" color="blue-gray">
                        {formatDuration(activity.moving_time)}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" color="gray" className="font-normal">
                        Dénivelé
                      </Typography>
                      <Typography variant="h6" color="blue-gray">
                        {Number(activity.total_elevation_gain || 0).toFixed(0)} m
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" color="gray" className="font-normal">
                        Vitesse moy.
                      </Typography>
                      <Typography variant="h6" color="blue-gray">
                        {(Number(activity.distance || 0) / 1000 / (Number(activity.moving_time || 1) / 3600)).toFixed(1)} km/h
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center py-12">
            <Typography variant="h6" color="gray">
              Aucune activité trouvée
            </Typography>
          </CardBody>
        </Card>
      )}
    </Layout>
  );
}
