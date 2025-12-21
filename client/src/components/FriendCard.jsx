import { Card, CardBody, Typography, Button, Chip, Dialog, DialogHeader, DialogBody, DialogFooter, Input, Select, Option } from '@material-tailwind/react';
import { UserMinusIcon, CheckIcon, XMarkIcon, CalendarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { challengesApi } from '../services/api';

export default function FriendCard({ friend, type = 'friend', onAction }) {
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [h2hStats, setH2hStats] = useState(null);
  const [challengeData, setChallengeData] = useState({
    metric: 'distance',
    target_value: '',
    start_date: ''
  });
  // Type peut être: 'friend', 'pending', 'sent', 'search'

  // Charger les stats H2H pour les amis
  useEffect(() => {
    if (type === 'friend' && friend.id) {
      loadH2HStats();
    }
  }, [type, friend.id]);

  const loadH2HStats = async () => {
    try {
      const stats = await challengesApi.getH2HStats(friend.id);
      setH2hStats(stats);
    } catch (error) {
      console.error('Error loading H2H stats:', error);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      const data = {
        challenged_id: friend.id,
        metric: challengeData.metric,
        target_value: challengeData.metric === 'distance'
          ? parseFloat(challengeData.target_value) * 1000 // Convert km to meters
          : parseFloat(challengeData.target_value), // D+ already in meters
        start_date: challengeData.start_date
        // end_date est auto-généré par le backend (start_date + 30 jours)
      };

      await challengesApi.createChallenge(data);
      setShowChallengeDialog(false);
      setChallengeData({
        metric: 'distance',
        target_value: '',
        start_date: ''
      });

      if (onAction) {
        onAction('challengeCreated');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Erreur lors de la création du challenge');
    }
  };

  const getInitials = (username) => {
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const renderActions = () => {
    switch (type) {
      case 'friend':
        return (
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              color="green"
              variant="gradient"
              onClick={() => setShowChallengeDialog(true)}
              className="flex items-center gap-2"
            >
              <TrophyIcon className="h-4 w-4" />
              Défier
            </Button>
            <Button
              size="sm"
              color="red"
              variant="text"
              onClick={() => onAction('remove', friend.id)}
              className="flex items-center gap-2"
            >
              <UserMinusIcon className="h-4 w-4" />
              Retirer
            </Button>
          </div>
        );

      case 'pending':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="green"
              onClick={() => onAction('accept', friend.id)}
              className="flex items-center gap-1"
            >
              <CheckIcon className="h-4 w-4" />
              Accepter
            </Button>
            <Button
              size="sm"
              color="red"
              variant="outlined"
              onClick={() => onAction('reject', friend.id)}
              className="flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Refuser
            </Button>
          </div>
        );

      case 'sent':
        return (
          <Typography variant="small" color="blue-gray" className="font-normal">
            En attente...
          </Typography>
        );

      case 'search':
        return (
          <Button
            size="sm"
            color="blue"
            onClick={() => onAction('send', friend.id)}
            disabled={friend.friendship_status}
          >
            {friend.friendship_status === 'pending' && 'En attente'}
            {friend.friendship_status === 'accepted' && 'Déjà ami'}
            {!friend.friendship_status && 'Ajouter'}
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-lg border-2 border-gray-300 flex-shrink-0">
              {getInitials(friend.username || friend.friend_username)}
            </div>
            <div className="flex-1">
              <Typography variant="h6" color="blue-gray">
                {friend.username || friend.friend_username}
              </Typography>
              <Typography variant="small" color="gray" className="font-normal">
                Strava ID: {friend.strava_id || friend.friend_strava_id}
              </Typography>
              {type === 'friend' && friend.accepted_at && (
                <Typography variant="small" color="gray" className="font-normal">
                  Amis depuis: {new Date(friend.accepted_at).toLocaleDateString('fr-FR')}
                </Typography>
              )}
              {type === 'pending' && friend.requested_at && (
                <Typography variant="small" color="gray" className="font-normal">
                  Demande reçue: {new Date(friend.requested_at).toLocaleDateString('fr-FR')}
                </Typography>
              )}

              {/* Stats mensuelles pour les amis */}
              {type === 'friend' && (friend.monthly_distance !== undefined || friend.monthly_elevation !== undefined) && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-blue-gray-700">📊 Ce mois:</span>
                    <span className="text-blue-600 font-semibold">
                      {(friend.monthly_distance / 1000).toFixed(0)} km
                    </span>
                    <span className="text-orange-600 font-semibold">
                      {Math.round(friend.monthly_elevation)} m D+
                    </span>
                  </div>
                </div>
              )}

              {/* Stats H2H */}
              {type === 'friend' && h2hStats && (
                <div className="flex items-center gap-2 mt-2">
                  <TrophyIcon className="h-4 w-4 text-yellow-700" />
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    H2H: {h2hStats.user1_wins}-{h2hStats.user2_wins}
                    {parseInt(h2hStats.draws) > 0 && ` (${h2hStats.draws} nuls)`}
                  </Typography>
                </div>
              )}

              {/* Prochain événement */}
              {type === 'friend' && friend.next_event && (
                <div className="flex items-center gap-2 mt-2">
                  <CalendarIcon className="h-4 w-4 text-gray-600" />
                  <Typography variant="small" color="blue-gray" className="font-semibold">
                    {friend.next_event.name}
                  </Typography>
                  <Chip
                    value={`J-${friend.next_event.days_until}`}
                    size="sm"
                    color={friend.next_event.priority === 'A' ? 'red' : friend.next_event.priority === 'B' ? 'orange' : 'green'}
                    className="font-bold"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {renderActions()}
          </div>
        </div>
      </CardBody>

      {/* Dialog de création de challenge */}
      <Dialog open={showChallengeDialog} handler={setShowChallengeDialog}>
        <DialogHeader>Défier {friend.username || friend.friend_username}</DialogHeader>
        <DialogBody className="space-y-4">
          <Typography variant="small" color="gray" className="mb-2">
            Premier arrivé, premier gagnant ! Défiez votre ami d'atteindre un objectif avant vous.
          </Typography>

          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
              Type de challenge
            </Typography>
            <Select
              label="Métrique"
              value={challengeData.metric}
              onChange={(val) => setChallengeData({ ...challengeData, metric: val })}
            >
              <Option value="distance">Distance (km)</Option>
              <Option value="elevation">Dénivelé (m D+)</Option>
            </Select>
          </div>

          <Input
            type="number"
            label={challengeData.metric === 'distance' ? 'Objectif (km)' : 'Objectif (m D+)'}
            value={challengeData.target_value}
            onChange={(e) => setChallengeData({ ...challengeData, target_value: e.target.value })}
          />

          <Input
            type="date"
            label="Date de début"
            value={challengeData.start_date}
            onChange={(e) => setChallengeData({ ...challengeData, start_date: e.target.value })}
          />

          <Typography variant="small" color="gray" className="text-xs">
            Le challenge sera automatiquement clôturé après 30 jours. Le premier à atteindre l'objectif gagne !
          </Typography>
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button variant="text" color="red" onClick={() => setShowChallengeDialog(false)}>
            Annuler
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={handleCreateChallenge}
            disabled={!challengeData.target_value || !challengeData.start_date}
          >
            Créer le challenge
          </Button>
        </DialogFooter>
      </Dialog>
    </Card>
  );
}
