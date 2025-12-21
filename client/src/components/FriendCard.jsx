import { Card, CardBody, Typography, Button, Chip } from '@material-tailwind/react';
import { UserMinusIcon, CheckIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function FriendCard({ friend, type = 'friend', onAction }) {
  // Type peut être: 'friend', 'pending', 'sent', 'search'

  const getInitials = (username) => {
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const renderActions = () => {
    switch (type) {
      case 'friend':
        return (
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
    </Card>
  );
}
