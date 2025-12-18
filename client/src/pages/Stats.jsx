import { useState, useEffect } from 'react';
import { activitiesApi } from '../services/api';
import { useSportFilter } from '../contexts/SportFilterContext';
import Layout from '../components/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
} from "@material-tailwind/react";

export default function Stats() {
  const { sportFilter } = useSportFilter();
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('semaine'); // 'semaine' ou 'annee'
  const [weekOffset, setWeekOffset] = useState(0); // Offset pour naviguer dans le temps
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Filtrer les activités selon le sport
  const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Trail'];
  const CYCLING_TYPES = ['Ride', 'VirtualRide', 'EBikeRide'];

  const filteredActivities = sportFilter === 'running'
    ? allActivities.filter(a => RUNNING_TYPES.includes(a.type))
    : allActivities.filter(a => CYCLING_TYPES.includes(a.type));

  // Calculer les stats hebdomadaires avec pagination
  const getWeeklyStats = () => {
    const weekGroups = {};

    filteredActivities.forEach(activity => {
      const date = new Date(activity.start_date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      const weekKey = monday.toISOString().split('T')[0];

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = {
          week: weekKey,
          distance: 0,
          elevation: 0,
          activities: 0
        };
      }

      weekGroups[weekKey].distance += (Number(activity.distance) || 0) / 1000;
      weekGroups[weekKey].elevation += Number(activity.total_elevation_gain) || 0;
      weekGroups[weekKey].activities += 1;
    });

    // Trier et paginer
    const sortedWeeks = Object.values(weekGroups)
      .sort((a, b) => new Date(b.week) - new Date(a.week))
      .slice(weekOffset * 12, (weekOffset + 1) * 12)
      .reverse();

    // Formater les données
    return sortedWeeks.map(week => ({
      period: formatWeekWithYear(new Date(week.week)),
      distance: Math.round(week.distance * 10) / 10,
      elevation: Math.round(week.elevation),
      activities: week.activities
    }));
  };

  // Calculer le nombre total de semaines
  const getTotalWeeks = () => {
    const weekGroups = {};
    filteredActivities.forEach(activity => {
      const date = new Date(activity.start_date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      const weekKey = monday.toISOString().split('T')[0];
      weekGroups[weekKey] = true;
    });
    return Object.keys(weekGroups).length;
  };

  // Calculer les stats annuelles
  const getYearlyStats = () => {
    const yearGroups = {};

    filteredActivities.forEach(activity => {
      const date = new Date(activity.start_date);
      const year = date.getFullYear();

      if (!yearGroups[year]) {
        yearGroups[year] = {
          year,
          distance: 0,
          elevation: 0,
          activities: 0
        };
      }

      yearGroups[year].distance += (Number(activity.distance) || 0) / 1000;
      yearGroups[year].elevation += Number(activity.total_elevation_gain) || 0;
      yearGroups[year].activities += 1;
    });

    // Trier par année
    return Object.values(yearGroups)
      .sort((a, b) => a.year - b.year)
      .map(year => ({
        period: year.year.toString(),
        distance: Math.round(year.distance * 10) / 10,
        elevation: Math.round(year.elevation),
        activities: year.activities
      }));
  };

  // Obtenir les années disponibles
  const getAvailableYears = () => {
    const years = new Set();
    filteredActivities.forEach(activity => {
      years.add(new Date(activity.start_date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const formatWeekWithYear = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
            <Typography variant="h6" color="gray">
              Chargement des statistiques...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  };

  const statsData = viewMode === 'semaine' ? getWeeklyStats() : getYearlyStats();
  const totalWeeks = getTotalWeeks();
  const maxWeekOffset = Math.max(0, Math.ceil(totalWeeks / 12) - 1);
  const availableYears = getAvailableYears();

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <Typography variant="h4" color="blue-gray">
          Statistiques
        </Typography>
        <div className="flex gap-2">
          <Button
            size="sm"
            color="gray"
            variant={viewMode === 'semaine' ? 'filled' : 'outlined'}
            onClick={() => {
              setViewMode('semaine');
              setWeekOffset(0);
            }}
            className="normal-case"
          >
            Par semaine
          </Button>
          <Button
            size="sm"
            color="gray"
            variant={viewMode === 'annee' ? 'filled' : 'outlined'}
            onClick={() => setViewMode('annee')}
            className="normal-case"
          >
            Par année
          </Button>
        </div>
      </div>

      {/* Navigation temporelle */}
      {viewMode === 'semaine' && totalWeeks > 12 && (
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            size="sm"
            color="gray"
            variant="outlined"
            onClick={() => setWeekOffset(Math.min(weekOffset + 1, maxWeekOffset))}
            disabled={weekOffset >= maxWeekOffset}
            className="normal-case"
          >
            ← Plus ancien
          </Button>
          <Typography variant="small" color="gray">
            Semaines {weekOffset * 12 + 1} - {Math.min((weekOffset + 1) * 12, totalWeeks)} sur {totalWeeks}
          </Typography>
          <Button
            size="sm"
            color="gray"
            variant="outlined"
            onClick={() => setWeekOffset(Math.max(weekOffset - 1, 0))}
            disabled={weekOffset === 0}
            className="normal-case"
          >
            Plus récent →
          </Button>
        </div>
      )}

      {statsData.length === 0 ? (
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center py-12">
            <Typography variant="h6" color="gray">
              Pas assez de données
            </Typography>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-none">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6 border-b border-gray-200"
            >
              <Typography variant="h6" color="blue-gray">
                Distance {viewMode === 'semaine' ? 'par semaine' : 'par année'} (km)
              </Typography>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="distance" fill="#374151" name="Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card className="border border-gray-200 shadow-none">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6 border-b border-gray-200"
            >
              <Typography variant="h6" color="blue-gray">
                Dénivelé {viewMode === 'semaine' ? 'par semaine' : 'par année'} (m)
              </Typography>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="elevation" stroke="#6b7280" strokeWidth={3} name="Dénivelé (m)" />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card className="border border-gray-200 shadow-none">
            <CardHeader
              floated={false}
              shadow={false}
              color="transparent"
              className="m-0 p-6 border-b border-gray-200"
            >
              <Typography variant="h6" color="blue-gray">
                Nombre d'activités {viewMode === 'semaine' ? 'par semaine' : 'par année'}
              </Typography>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activities" fill="#9ca3af" name="Activités" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}
    </Layout>
  );
}
