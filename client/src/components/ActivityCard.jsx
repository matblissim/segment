import { useState } from 'react';
import { Card, CardBody, CardFooter, Typography, Button, Input, IconButton, Chip } from '@material-tailwind/react';
import { HeartIcon, ChatBubbleLeftIcon, ClockIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import AIAnalysisDialog from './AIAnalysisDialog';

export default function ActivityCard({ activity, onLike, onUnlike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const getInitials = (username) => {
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const formatDistance = (meters) => {
    const km = meters / 1000;
    return km.toFixed(2) + ' km';
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatPace = (metersPerSecond) => {
    if (!metersPerSecond) return '-';
    const minPerKm = 1000 / (metersPerSecond * 60);
    const minutes = Math.floor(minPerKm);
    const seconds = Math.floor((minPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `Il y a ${diffMins} min`;
    }
    if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    }
    if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleLikeClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (activity.user_has_liked) {
        await onUnlike(activity.strava_activity_id);
      } else {
        await onLike(activity.strava_activity_id);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      await onComment(activity.strava_activity_id, commentText);
      setCommentText('');
    } finally {
      setIsCommenting(false);
    }
  };

  const getSportIcon = (type) => {
    // Retourne une couleur selon le type d'activité
    const colors = {
      Run: 'orange',
      Ride: 'blue',
      Swim: 'cyan',
      Walk: 'green',
    };
    return colors[type] || 'gray';
  };

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        {/* Header avec utilisateur */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
            {getInitials(activity.username)}
          </div>
          <div className="flex-1">
            <Typography variant="h6" color="blue-gray" className="text-sm font-semibold">
              {activity.username}
            </Typography>
            <Typography variant="small" color="gray" className="text-xs">
              {formatDate(activity.start_date)}
            </Typography>
          </div>
          <Chip
            value={activity.sport_type || activity.type}
            color={getSportIcon(activity.type)}
            size="sm"
            className="rounded-full"
          />
        </div>

        {/* Nom de l'activité */}
        <Typography variant="h5" color="blue-gray" className="mb-3">
          {activity.name}
        </Typography>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <Typography variant="small" color="gray" className="text-xs mb-1">
              Distance
            </Typography>
            <Typography variant="h6" color="blue-gray" className="text-sm">
              {formatDistance(activity.distance)}
            </Typography>
          </div>
          <div>
            <Typography variant="small" color="gray" className="text-xs mb-1">
              Durée
            </Typography>
            <Typography variant="h6" color="blue-gray" className="text-sm">
              {formatDuration(activity.moving_time)}
            </Typography>
          </div>
          <div>
            <Typography variant="small" color="gray" className="text-xs mb-1">
              Allure
            </Typography>
            <Typography variant="h6" color="blue-gray" className="text-sm">
              {formatPace(activity.average_speed)}
            </Typography>
          </div>
        </div>

        {/* Statistiques supplémentaires */}
        {(activity.total_elevation_gain > 0 || activity.average_heartrate) && (
          <div className="flex gap-4 mb-4 text-xs text-gray-600">
            {activity.total_elevation_gain > 0 && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                <span>D+ {Math.round(activity.total_elevation_gain)}m</span>
              </div>
            )}
            {activity.average_heartrate && (
              <div className="flex items-center gap-1">
                <HeartIconSolid className="h-4 w-4 text-red-500" />
                <span>{Math.round(activity.average_heartrate)} bpm</span>
              </div>
            )}
          </div>
        )}
      </CardBody>

      <CardFooter className="pt-0 px-4 pb-4">
        {/* Actions (likes, comments, AI) */}
        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-200">
          <Button
            variant="text"
            size="sm"
            className="flex items-center gap-2 normal-case"
            onClick={handleLikeClick}
            disabled={isLiking}
          >
            {activity.user_has_liked ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
            <span>{activity.likes_count || 0}</span>
          </Button>

          <Button
            variant="text"
            size="sm"
            className="flex items-center gap-2 normal-case"
            onClick={() => setShowComments(!showComments)}
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span>{activity.comments_count || 0}</span>
          </Button>

          <Button
            variant="gradient"
            color="purple"
            size="sm"
            className="flex items-center gap-2 normal-case ml-auto"
            onClick={() => setShowAIAnalysis(true)}
          >
            <SparklesIcon className="h-4 w-4" />
            Analyse IA
          </Button>
        </div>

        {/* Section commentaires */}
        {showComments && (
          <div className="space-y-3">
            {/* Liste des commentaires */}
            {activity.comments && activity.comments.length > 0 && (
              <div className="space-y-2 mb-3">
                {activity.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {getInitials(comment.username)}
                    </div>
                    <div className="flex-1">
                      <Typography variant="small" className="font-semibold text-xs">
                        {comment.username}
                      </Typography>
                      <Typography variant="small" className="text-gray-700 text-xs">
                        {comment.comment}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'ajout de commentaire */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="!border-t-blue-gray-200 focus:!border-t-blue-500"
                labelProps={{
                  className: "before:content-none after:content-none",
                }}
                containerProps={{
                  className: "min-w-0",
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || isCommenting}
              >
                Publier
              </Button>
            </form>
          </div>
        )}
      </CardFooter>

      {/* Dialog d'analyse IA */}
      <AIAnalysisDialog
        open={showAIAnalysis}
        onClose={() => setShowAIAnalysis(false)}
        activityId={activity.strava_activity_id}
        activityName={activity.name}
        isProfileAnalysis={false}
      />
    </Card>
  );
}
