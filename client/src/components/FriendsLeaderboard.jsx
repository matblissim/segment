import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  ButtonGroup,
  Button,
  Chip,
  Spinner,
} from '@material-tailwind/react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { friendsApi } from '../services/api';

export default function FriendsLeaderboard() {
  const [sportType, setSportType] = useState('all');
  const [period, setPeriod] = useState('month');
  const [metric, setMetric] = useState('distance');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [period, metric, sportType]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await friendsApi.getLeaderboard(period, metric, sportType);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Erreur lors du chargement du classement');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    if (metric === 'distance') {
      return `${(value / 1000).toFixed(0)} km`;
    }
    return `${Math.round(value)} m`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Semaine';
      case 'month':
        return 'Mois';
      case 'year':
        return 'Année';
      default:
        return '';
    }
  };

  const getMetricLabel = () => {
    return metric === 'distance' ? 'Km' : 'D+';
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 0:
        return 'amber';
      case 1:
        return 'gray';
      case 2:
        return 'orange';
      default:
        return 'blue-gray';
    }
  };

  const getInitials = (username) => {
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <Card className="w-full h-fit sticky top-4">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="m-0 p-4 border-b border-gray-200"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrophyIcon className="h-6 w-6 text-amber-500" />
          <Typography variant="h6" color="blue-gray">
            Classement
          </Typography>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <Typography variant="small" color="gray" className="mb-2 font-medium">
              Sport
            </Typography>
            <ButtonGroup size="sm" fullWidth>
              <Button
                variant={sportType === 'all' ? 'filled' : 'outlined'}
                color={sportType === 'all' ? 'green' : 'gray'}
                onClick={() => setSportType('all')}
                className="normal-case"
              >
                Tous
              </Button>
              <Button
                variant={sportType === 'running' ? 'filled' : 'outlined'}
                color={sportType === 'running' ? 'green' : 'gray'}
                onClick={() => setSportType('running')}
                className="normal-case"
              >
                Course
              </Button>
              <Button
                variant={sportType === 'cycling' ? 'filled' : 'outlined'}
                color={sportType === 'cycling' ? 'green' : 'gray'}
                onClick={() => setSportType('cycling')}
                className="normal-case"
              >
                Vélo
              </Button>
            </ButtonGroup>
          </div>

          <div>
            <Typography variant="small" color="gray" className="mb-2 font-medium">
              Période
            </Typography>
            <ButtonGroup size="sm" fullWidth>
              <Button
                variant={period === 'week' ? 'filled' : 'outlined'}
                color={period === 'week' ? 'green' : 'gray'}
                onClick={() => setPeriod('week')}
                className="normal-case"
              >
                Semaine
              </Button>
              <Button
                variant={period === 'month' ? 'filled' : 'outlined'}
                color={period === 'month' ? 'green' : 'gray'}
                onClick={() => setPeriod('month')}
                className="normal-case"
              >
                Mois
              </Button>
              <Button
                variant={period === 'year' ? 'filled' : 'outlined'}
                color={period === 'year' ? 'green' : 'gray'}
                onClick={() => setPeriod('year')}
                className="normal-case"
              >
                Année
              </Button>
            </ButtonGroup>
          </div>

          <div>
            <Typography variant="small" color="gray" className="mb-2 font-medium">
              Métrique
            </Typography>
            <ButtonGroup size="sm" fullWidth>
              <Button
                variant={metric === 'distance' ? 'filled' : 'outlined'}
                color={metric === 'distance' ? 'green' : 'gray'}
                onClick={() => setMetric('distance')}
                className="normal-case"
              >
                Km
              </Button>
              <Button
                variant={metric === 'elevation' ? 'filled' : 'outlined'}
                color={metric === 'elevation' ? 'green' : 'gray'}
                onClick={() => setMetric('elevation')}
                className="normal-case"
              >
                D+
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <Typography variant="small" color="red">
              {error}
            </Typography>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-4 text-center">
            <Typography variant="small" color="gray">
              Aucune donnée pour cette période
            </Typography>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-2 bg-gray-50">
              <Typography variant="small" color="gray" className="font-semibold">
                {getPeriodLabel()} - {getMetricLabel()}
              </Typography>
            </div>
            {leaderboard.map((user, index) => (
              <div
                key={user.user_id}
                className={`px-4 py-3 transition-colors ${
                  user.is_current_user
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 text-center">
                    {index < 3 ? (
                      <Chip
                        value={index + 1}
                        size="sm"
                        color={getMedalColor(index)}
                        className="w-8 h-8 flex items-center justify-center font-bold"
                      />
                    ) : (
                      <Typography variant="small" color="gray" className="font-semibold">
                        {index + 1}
                      </Typography>
                    )}
                  </div>

                  <div className={`w-10 h-10 rounded-full ${
                    user.is_current_user ? 'bg-blue-600' : 'bg-blue-500'
                  } text-white flex items-center justify-center font-semibold text-sm flex-shrink-0`}>
                    {getInitials(user.username)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Typography variant="small" color="blue-gray" className={`truncate ${
                        user.is_current_user ? 'font-bold' : 'font-semibold'
                      }`}>
                        {user.username}
                      </Typography>
                      {user.is_current_user && (
                        <Chip
                          value="Vous"
                          size="sm"
                          color="blue"
                          className="px-2 py-0"
                        />
                      )}
                    </div>
                    <Typography variant="small" color="gray" className="truncate">
                      {formatValue(user.value)}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
