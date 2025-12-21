import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Typography, Button, Progress, Chip } from '@material-tailwind/react';
import { TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { challengesApi } from '../services/api';

export default function ChallengesWidget() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await challengesApi.getActiveChallenges();
      const activeChallenges = data.challenges || [];
      setChallenges(activeChallenges.slice(0, 3)); // Show only top 3

      // Load progress for each challenge
      for (const challenge of activeChallenges.slice(0, 3)) {
        loadProgress(challenge.id);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (challengeId) => {
    try {
      const prog = await challengesApi.getProgress(challengeId);
      setProgress(prev => ({ ...prev, [challengeId]: prog }));
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const formatValue = (value, metric) => {
    if (metric === 'distance') {
      return `${(value / 1000).toFixed(0)} km`;
    }
    return `${Math.round(value)} m D+`;
  };

  const formatMetric = (metric) => {
    return metric === 'distance' ? 'Distance' : 'D+';
  };

  const getDaysLeft = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return null;
  }

  if (challenges.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader floated={false} shadow={false} className="rounded-none pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-yellow-700" />
            <Typography variant="h6" color="blue-gray">
              Challenges actifs
            </Typography>
          </div>
          <Button
            size="sm"
            variant="text"
            className="flex items-center gap-2"
            onClick={() => navigate('/challenges')}
          >
            Voir tout
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const prog = progress[challenge.id];
            const daysLeft = getDaysLeft(challenge.end_date);

            return (
              <div
                key={challenge.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => navigate('/challenges')}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Typography variant="small" color="blue-gray" className="font-semibold">
                      {challenge.challenger_username} vs {challenge.challenged_username}
                    </Typography>
                    <div className="flex items-center gap-2 mt-1">
                      <Typography variant="small" color="gray">
                        {formatMetric(challenge.metric)} • {formatValue(challenge.target_value, challenge.metric)}
                      </Typography>
                    </div>
                  </div>
                  <Chip
                    value={`J-${daysLeft}`}
                    size="sm"
                    color={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'orange' : 'blue'}
                    className="font-semibold"
                  />
                </div>

                {prog && (
                  <div className="space-y-2 mt-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Typography variant="small" color="blue-gray" className="text-xs">
                          {challenge.challenger_username}
                        </Typography>
                        <Typography variant="small" color="blue" className="text-xs font-semibold">
                          {prog.challenger_percentage.toFixed(0)}%
                        </Typography>
                      </div>
                      <Progress value={Math.min(prog.challenger_percentage, 100)} color="blue" size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Typography variant="small" color="blue-gray" className="text-xs">
                          {challenge.challenged_username}
                        </Typography>
                        <Typography variant="small" color="green" className="text-xs font-semibold">
                          {prog.challenged_percentage.toFixed(0)}%
                        </Typography>
                      </div>
                      <Progress value={Math.min(prog.challenged_percentage, 100)} color="green" size="sm" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
