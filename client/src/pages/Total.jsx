import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stravaApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function Total() {
  const { user, accessToken, logout } = useAuth();
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    'Course à pied': true,
    'Vélo': true,
    'Natation': true,
    'Autre': true
  });

  useEffect(() => {
    loadAllActivities();
  }, [accessToken]);

  const loadAllActivities = async () => {
    try {
      let allActivities = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 50) {
        const activities = await stravaApi.getActivities(accessToken, 200, page);
        if (activities.length === 0) {
          hasMore = false;
        } else {
          allActivities = [...allActivities, ...activities];
          page++;
        }
      }

      const yearlyStats = {};

      allActivities.forEach(activity => {
        const year = new Date(activity.start_date).getFullYear();
        const sportType = getSportType(activity.type);

        if (sportType === 'Marche') return;

        if (!yearlyStats[year]) {
          yearlyStats[year] = {
            year,
            'Course à pied': 0,
            'Vélo': 0,
            'Natation': 0,
            'Autre': 0
          };
        }

        const distanceKm = activity.distance / 1000;
        yearlyStats[year][sportType] += distanceKm;
      });

      const data = Object.values(yearlyStats)
        .map(year => ({
          ...year,
          'Course à pied': Math.round(year['Course à pied'] * 10) / 10,
          'Vélo': Math.round(year['Vélo'] * 10) / 10,
          'Natation': Math.round(year['Natation'] * 10) / 10,
          'Autre': Math.round(year['Autre'] * 10) / 10
        }))
        .sort((a, b) => a.year - b.year);

      setYearlyData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoading(false);
    }
  };

  const getSportType = (type) => {
    if (['Run', 'Trail', 'TrailRun', 'VirtualRun'].includes(type)) return 'Course à pied';
    if (['Ride', 'VirtualRide', 'EBikeRide', 'MountainBikeRide', 'GravelRide'].includes(type)) return 'Vélo';
    if (['Swim', 'VirtualSwim'].includes(type)) return 'Natation';
    if (['Walk', 'Hike'].includes(type)) return 'Marche';
    return 'Autre';
  };

  const toggleFilter = (sport) => {
    setFilters(prev => ({ ...prev, [sport]: !prev[sport] }));
  };

  const getFilteredData = () => {
    return yearlyData.map(year => {
      const filtered = { year: year.year };
      if (filters['Course à pied']) filtered['Course à pied'] = year['Course à pied'];
      if (filters['Vélo']) filtered['Vélo'] = year['Vélo'];
      if (filters['Natation']) filtered['Natation'] = year['Natation'];
      if (filters['Autre']) filtered['Autre'] = year['Autre'];
      return filtered;
    });
  };

  const calculateTotals = () => {
    const totals = { 'Course à pied': 0, 'Vélo': 0, 'Natation': 0, 'Autre': 0, 'Total': 0 };
    yearlyData.forEach(year => {
      totals['Course à pied'] += year['Course à pied'];
      totals['Vélo'] += year['Vélo'];
      totals['Natation'] += year['Natation'];
      totals['Autre'] += year['Autre'];
    });
    totals['Total'] = totals['Course à pied'] + totals['Vélo'] + totals['Natation'] + totals['Autre'];
    return totals;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-strava mx-auto mb-4"></div>
          <p>Chargement de toutes vos activités...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{user?.firstname} {user?.lastname}</h1>
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Déconnexion</button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <Link to="/dashboard" className="text-gray-600 hover:text-strava">Tableau de bord</Link>
            <Link to="/stats" className="text-gray-600 hover:text-strava">Statistiques</Link>
            <Link to="/total" className="text-strava font-semibold border-b-2 border-strava pb-1">Total</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🏆 Total par année et par sport</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-lg shadow p-6">
            <p className="text-sm opacity-90">Course à pied</p>
            <p className="text-3xl font-bold">{totals['Course à pied'].toFixed(1)} km</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg shadow p-6">
            <p className="text-sm opacity-90">Vélo</p>
            <p className="text-3xl font-bold">{totals['Vélo'].toFixed(1)} km</p>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-green-500 text-white rounded-lg shadow p-6">
            <p className="text-sm opacity-90">Natation</p>
            <p className="text-3xl font-bold">{totals['Natation'].toFixed(1)} km</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg shadow p-6">
            <p className="text-sm opacity-90">Autre</p>
            <p className="text-3xl font-bold">{totals['Autre'].toFixed(1)} km</p>
          </div>
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-lg shadow p-6">
            <p className="text-sm opacity-90">TOTAL</p>
            <p className="text-3xl font-bold">{totals['Total'].toFixed(1)} km</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">📊 Distance par année et par sport (km)</h3>
            <div className="flex gap-2">
              <button
                onClick={() => toggleFilter('Course à pied')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                  filters['Course à pied']
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-500 line-through'
                }`}
              >
                🏃 Course
              </button>
              <button
                onClick={() => toggleFilter('Vélo')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                  filters['Vélo']
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500 line-through'
                }`}
              >
                🚴 Vélo
              </button>
              <button
                onClick={() => toggleFilter('Natation')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                  filters['Natation']
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500 line-through'
                }`}
              >
                🏊 Natation
              </button>
              <button
                onClick={() => toggleFilter('Autre')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                  filters['Autre']
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-500 line-through'
                }`}
              >
                💪 Autre
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Course à pied" stackId="a" fill="#EF4444" name="Course à pied" />
              <Bar dataKey="Vélo" stackId="a" fill="#3B82F6" name="Vélo" />
              <Bar dataKey="Natation" stackId="a" fill="#10B981" name="Natation" />
              <Bar dataKey="Autre" stackId="a" fill="#A855F7" name="Autre" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course à pied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vélo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Natation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearlyData.map((year) => (
                <tr key={year.year}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{year.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600">{year['Course à pied']} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600">{year['Vélo']} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">{year['Natation']} km</td>
                  <td className="px-6 py-4 whitespace-nowrap text-purple-600">{year['Autre']} km</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    {(year['Course à pied'] + year['Vélo'] + year['Natation'] + year['Autre']).toFixed(1)} km
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
