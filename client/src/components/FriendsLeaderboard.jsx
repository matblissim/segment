import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Select,
  Option,
  Chip,
  Spinner,
} from '@material-tailwind/react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { friendsApi } from '../services/api';

export default function FriendsLeaderboard() {
  const [period, setPeriod] = useState('month');
  const [metric, setMetric] = useState('distance');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [period, metric]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await friendsApi.getLeaderboard(period, metric);
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
        return 'Cette semaine';
      case 'month':
        return 'Ce mois';
      case 'year':
        return 'Cette année';
      default:
        return '';
    }
  };

  const getMetricLabel = () => {
    return metric === 'distance' ? 'Kilométrage' : 'D+';
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
          <Select
            label="Période"
            value={period}
            onChange={(val) => setPeriod(val)}
            size="md"
          >
            <Option value="week">Semaine</Option>
            <Option value="month">Mois</Option>
            <Option value="year">Année</Option>
          </Select>

          <Select
            label="Métrique"
            value={metric}
            onChange={(val) => setMetric(val)}
            size="md"
          >
            <Option value="distance">Kilométrage</Option>
            <Option value="elevation">D+</Option>
          </Select>
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
            {leaderboard.map((friend, index) => (
              <div
                key={friend.friend_id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
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

                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {getInitials(friend.friend_username)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Typography variant="small" color="blue-gray" className="font-semibold truncate">
                      {friend.friend_username}
                    </Typography>
                    <Typography variant="small" color="gray" className="truncate">
                      {formatValue(friend.value)}
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
