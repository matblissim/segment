import { Card, CardBody, Typography, Button, Avatar } from '@material-tailwind/react';
import { UserMinusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
      <CardBody className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Avatar
            variant="circular"
            alt={friend.username || friend.friend_username}
            className="border border-gray-900"
            size="lg"
          >
            <div className="bg-blue-500 text-white w-full h-full flex items-center justify-center">
              {getInitials(friend.username || friend.friend_username)}
            </div>
          </Avatar>
          <div>
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
          </div>
        </div>
        {renderActions()}
      </CardBody>
    </Card>
  );
}
