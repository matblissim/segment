import { useState, useEffect } from 'react';
import { Card, CardBody, Typography, Tabs, TabsHeader, Tab, TabsBody, TabPanel, Button, Progress, Chip } from '@material-tailwind/react';
import { TrophyIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { challengesApi } from '../services/api';
import Layout from '../components/Layout';

export default function Challenges() {
  const [activeTab, setActiveTab] = useState('active');
  const [challenges, setChallenges] = useState({
    active: [],
    pending: [],
    all: []
  });
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const [active, pending, all] = await Promise.all([
        challengesApi.getActiveChallenges(),
        challengesApi.getPendingChallenges(),
        challengesApi.getChallenges()
      ]);

      setChallenges({
        active: active.challenges || [],
        pending: pending.challenges || [],
        all: all.challenges || []
      });

      // Load progress for active challenges
      for (const challenge of active.challenges || []) {
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

      // Si le challenge est passé à "completed", recharger la liste
      if (prog.challenge.status === 'completed') {
        // Petit délai pour laisser le temps à la BDD de se mettre à jour
        setTimeout(() => loadChallenges(), 500);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleAccept = async (challengeId) => {
    try {
      await challengesApi.acceptChallenge(challengeId);
      loadChallenges();
    } catch (error) {
      console.error('Error accepting challenge:', error);
      alert('Erreur lors de l\'acceptation du challenge');
    }
  };

  const handleDecline = async (challengeId) => {
    try {
      await challengesApi.declineChallenge(challengeId);
      loadChallenges();
    } catch (error) {
      console.error('Error declining challenge:', error);
      alert('Erreur lors du refus du challenge');
    }
  };

  const handleCancel = async (challengeId) => {
    try {
      await challengesApi.cancelChallenge(challengeId);
      loadChallenges();
    } catch (error) {
      console.error('Error canceling challenge:', error);
      alert('Erreur lors de l\'annulation du challenge');
    }
  };

  const formatMetric = (metric) => {
    return metric === 'distance' ? 'Distance' : 'Dénivelé';
  };

  const formatValue = (value, metric) => {
    if (metric === 'distance') {
      return `${(value / 1000).toFixed(0)} km`;
    }
    return `${Math.round(value)} m D+`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'blue';
      case 'pending':
        return 'orange';
      case 'completed':
        return 'green';
      case 'declined':
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'En cours';
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Terminé';
      case 'declined':
        return 'Refusé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const renderChallengeCard = (challenge, showActions = false) => {
    const prog = progress[challenge.id];
    const isChallenger = challenge.challenger_username !== undefined;

    return (
      <Card key={challenge.id} className="mb-4">
        <CardBody>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="h-5 w-5 text-yellow-700" />
                <Typography variant="h6" color="blue-gray">
                  {challenge.challenger_username} vs {challenge.challenged_username}
                </Typography>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold">{formatMetric(challenge.metric)}</span>
                <span>•</span>
                <span>Objectif: {formatValue(challenge.target_value, challenge.metric)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {challenge.end_date
                    ? `${new Date(challenge.start_date).toLocaleDateString('fr-FR')} - ${new Date(challenge.end_date).toLocaleDateString('fr-FR')}`
                    : `Depuis le ${new Date(challenge.start_date).toLocaleDateString('fr-FR')} • Premier à l'objectif`
                  }
                </span>
              </div>
            </div>
            <Chip
              value={getStatusText(challenge.status)}
              color={getStatusColor(challenge.status)}
              size="sm"
              className="font-semibold"
            />
          </div>

          {/* Progress for active challenges */}
          {challenge.status === 'active' && prog && (
            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    {challenge.challenger_username}
                  </Typography>
                  <Typography variant="small" color="blue" className="font-semibold">
                    {formatValue(prog.challenger_value, challenge.metric)} ({prog.challenger_percentage.toFixed(0)}%)
                  </Typography>
                </div>
                <Progress value={Math.min(prog.challenger_percentage, 100)} color="blue" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    {challenge.challenged_username}
                  </Typography>
                  <Typography variant="small" color="green" className="font-semibold">
                    {formatValue(prog.challenged_value, challenge.metric)} ({prog.challenged_percentage.toFixed(0)}%)
                  </Typography>
                </div>
                <Progress value={Math.min(prog.challenged_percentage, 100)} color="green" />
              </div>
            </div>
          )}

          {/* Winner for completed challenges */}
          {challenge.status === 'completed' && challenge.winner_id && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <Typography variant="small" color="green" className="font-semibold">
                Victoire de {challenge.winner_id === challenge.challenger_id ? challenge.challenger_username : challenge.challenged_username}
              </Typography>
            </div>
          )}

          {/* Draw */}
          {challenge.status === 'completed' && !challenge.winner_id && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Typography variant="small" color="gray" className="font-semibold">
                Match nul
              </Typography>
            </div>
          )}

          {/* Actions for pending challenges */}
          {showActions && challenge.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                color="green"
                onClick={() => handleAccept(challenge.id)}
                className="flex items-center gap-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Accepter
              </Button>
              <Button
                size="sm"
                color="red"
                variant="outlined"
                onClick={() => handleDecline(challenge.id)}
                className="flex items-center gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                Refuser
              </Button>
            </div>
          )}

          {/* Cancel button for active challenges (only challenger) */}
          {challenge.status === 'active' && isChallenger && (
            <div className="mt-4">
              <Button
                size="sm"
                color="red"
                variant="text"
                onClick={() => handleCancel(challenge.id)}
              >
                Annuler le challenge
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout showSportToggle={false}>
        <div className="container mx-auto p-4 max-w-4xl">
          <Typography variant="h4" color="blue-gray" className="mb-6">
            Challenges
          </Typography>
          <Typography>Chargement...</Typography>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSportToggle={false}>
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <TrophyIcon className="h-8 w-8 text-yellow-700" />
          <Typography variant="h4" color="blue-gray">
            Challenges
          </Typography>
        </div>

        <Tabs value={activeTab}>
          <TabsHeader>
            <Tab value="active" onClick={() => setActiveTab('active')}>
              En cours ({challenges.active.length})
            </Tab>
            <Tab value="pending" onClick={() => setActiveTab('pending')}>
              En attente ({challenges.pending.length})
            </Tab>
            <Tab value="all" onClick={() => setActiveTab('all')}>
              Tous ({challenges.all.length})
            </Tab>
          </TabsHeader>
          <TabsBody>
            <TabPanel value="active" className="p-0 pt-4">
              {challenges.active.length === 0 ? (
                <Typography color="gray">Aucun challenge actif</Typography>
              ) : (
                challenges.active.map(challenge => renderChallengeCard(challenge))
              )}
            </TabPanel>
            <TabPanel value="pending" className="p-0 pt-4">
              {challenges.pending.length === 0 ? (
                <Typography color="gray">Aucun challenge en attente</Typography>
              ) : (
                challenges.pending.map(challenge => renderChallengeCard(challenge, true))
              )}
            </TabPanel>
            <TabPanel value="all" className="p-0 pt-4">
              {challenges.all.length === 0 ? (
                <Typography color="gray">Aucun challenge</Typography>
              ) : (
                challenges.all.map(challenge => renderChallengeCard(challenge))
              )}
            </TabPanel>
          </TabsBody>
        </Tabs>
      </div>
    </Layout>
  );
}
