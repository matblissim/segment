import { useState, useEffect } from 'react';
import { activitiesApi, gamificationApi } from '../services/api';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Progress,
  Chip,
} from "@material-tailwind/react";

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const data = await activitiesApi.getAllActivities();
      const activities = data.activities || data;
      const gamificationData = await gamificationApi.calculateStats(activities);
      setChallenges(gamificationData.challenges || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout showSportToggle={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
            <Typography variant="h6" color="gray">
              Chargement des challenges...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  const completedChallenges = challenges.filter(c => c.completed);
  const activeChallenges = challenges.filter(c => !c.completed);

  return (
    <Layout showSportToggle={false}>
      <Typography variant="h4" color="blue-gray" className="mb-6">
        Challenges
      </Typography>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center">
            <Typography variant="small" color="gray">Total</Typography>
            <Typography variant="h4" color="blue-gray">{challenges.length}</Typography>
          </CardBody>
        </Card>
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center">
            <Typography variant="small" color="gray">Complétés</Typography>
            <Typography variant="h4" color="blue-gray">{completedChallenges.length}</Typography>
          </CardBody>
        </Card>
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center">
            <Typography variant="small" color="gray">En cours</Typography>
            <Typography variant="h4" color="blue-gray">{activeChallenges.length}</Typography>
          </CardBody>
        </Card>
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center">
            <Typography variant="small" color="gray">Points gagnés</Typography>
            <Typography variant="h4" color="blue-gray">
              {completedChallenges.reduce((sum, c) => sum + c.reward, 0)}
            </Typography>
          </CardBody>
        </Card>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="mb-6">
          <Typography variant="h5" color="blue-gray" className="mb-4">
            Challenges Actifs
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChallenges.map((challenge) => (
              <Card key={challenge.id} className="border border-gray-200 shadow-none">
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <Typography variant="h6" color="blue-gray">
                      {challenge.name}
                    </Typography>
                    <Chip
                      value="En cours"
                      color="gray"
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                  <Typography variant="small" color="gray" className="mb-4">
                    {challenge.description}
                  </Typography>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <Typography variant="small" color="gray">Progression</Typography>
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {challenge.progress.toFixed(1)}%
                      </Typography>
                    </div>
                    <Progress
                      value={Math.min(challenge.progress || 0, 100)}
                      color="gray"
                      className="h-2"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <Typography variant="small" color="gray">Récompense</Typography>
                    <Typography variant="small" color="blue-gray" className="font-bold">
                      +{challenge.reward} points
                    </Typography>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <Typography variant="h5" color="blue-gray" className="mb-4">
            Challenges Complétés
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="border-2 border-gray-900 shadow-none bg-gray-50">
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <Typography variant="h6" color="blue-gray">
                      {challenge.name}
                    </Typography>
                    <Chip
                      value="Terminé"
                      color="gray"
                      size="sm"
                    />
                  </div>
                  <Typography variant="small" color="gray" className="mb-4">
                    {challenge.description}
                  </Typography>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                    <Typography variant="small" color="gray">Récompense obtenue</Typography>
                    <Typography variant="small" color="blue-gray" className="font-bold">
                      +{challenge.reward} points
                    </Typography>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center py-12">
            <Typography variant="h6" color="gray">
              Aucun challenge disponible pour le moment
            </Typography>
          </CardBody>
        </Card>
      )}
    </Layout>
  );
}
