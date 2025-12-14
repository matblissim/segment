import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stravaApi, gamificationApi } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function Stats() {
  const { user, accessToken, logout } = useAuth();
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyStats();
  }, [accessToken]);

  const loadWeeklyStats = async () => {
    try {
      const activities = await stravaApi.getActivities(accessToken, 200);

      const weeklyStats = {};

      activities.forEach(activity => {
        const date = new Date(activity.start_date);
        const weekStart = getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyStats[weekKey]) {
          weeklyStats[weekKey] = {
            weekDate: weekStart,
            week: formatWeek(weekStart),
            distance: 0,
            activities: 0,
            elevation: 0,
            points: 0
          };
        }

        weeklyStats[weekKey].distance += (activity.distance / 1000);
        weeklyStats[weekKey].elevation += (activity.total_elevation_gain || 0);
        weeklyStats[weekKey].activities += 1;
        weeklyStats[weekKey].points += calculatePoints(activity);
      });

      const allWeeks = Object.values(weeklyStats)
        .sort((a, b) => a.weekDate - b.weekDate);

      const last8Weeks = allWeeks.slice(-8);

      const data = last8Weeks.map(week => ({
        week: week.week,
        distance: Math.round(week.distance * 10) / 10,
        activities: week.activities,
        elevation: Math.round(week.elevation),
        points: Math.round(week.points)
      }));

      setWeeklyData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
      setLoading(false);
    }
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatWeek = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const calculatePoints = (activity) => {
    let points = Math.floor((activity.distance / 1000) * 10);
    if (activity.total_elevation_gain) {
      points += Math.floor(activity.total_elevation_gain / 10);
    }
    return points;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstname} {user?.lastname}
            </h1>
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <Link to="/dashboard" className="text-gray-600 hover:text-strava">
              Tableau de bord
            </Link>
            <Link to="/stats" className="text-strava font-semibold border-b-2 border-strava pb-1">
              Statistiques
            </Link>
            <Link to="/total" className="text-gray-600 hover:text-strava">
              Total
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          📊 Évolution des 8 dernières semaines
        </h2>

        {weeklyData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Pas assez de données. Continuez à vous entraîner!</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🚴 Distance par semaine (km)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="distance" fill="#FC4C02" name="Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Points par semaine</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="points" stroke="#FC4C02" strokeWidth={3} name="Points" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Activités par semaine</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activities" fill="#10B981" name="Activités" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">⛰️ Dénivelé par semaine (m)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="elevation" stroke="#8B5CF6" strokeWidth={3} name="Dénivelé (m)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
