import { useState, useEffect } from 'react';
import { feedApi } from '../services/api';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Avatar,
} from "@material-tailwind/react";
import { HeartIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

export default function FeedWidget() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const data = await feedApi.getFeed(20, 0); // 20 activités avec scroll
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId, currentlyLiked) => {
    if (!activityId) return; // Skip pour les badges

    try {
      if (currentlyLiked) {
        await feedApi.unlikeActivity(activityId);
      } else {
        await feedApi.likeActivity(activityId);
      }

      setActivities(activities.map(item => {
        if (item.item_type === 'activity' && item.strava_activity_id === activityId) {
          return {
            ...item,
            user_has_liked: !currentlyLiked,
            likes_count: currentlyLiked
              ? (item.likes_count || 0) - 1
              : (item.likes_count || 0) + 1
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(1);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}min`;
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getUserInitials = (username) => {
    if (!username) return '?';
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-none">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 p-6 border-b border-gray-200"
        >
          <Typography variant="h6" color="blue-gray">
            Activités récentes
          </Typography>
        </CardHeader>
        <CardBody className="pt-4">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        className="m-0 p-6 border-b border-gray-200"
      >
        <Typography variant="h6" color="blue-gray">
          Activités récentes
        </Typography>
      </CardHeader>
      <CardBody className="pt-4">
        {activities.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {activities.map((item) => (
              <div key={`${item.item_type}-${item.id}`} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                    {getUserInitials(item.username)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {item.username}
                      </Typography>
                      <Typography variant="small" color="gray" className="text-xs">
                        {getRelativeTime(item.item_type === 'activity' ? item.start_date : item.created_at)}
                      </Typography>
                    </div>

                    {item.item_type === 'activity' ? (
                      <>
                        <Typography variant="small" color="blue-gray" className="mb-2">
                          {item.name}
                        </Typography>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{formatDistance(item.distance)} km</span>
                          <span>{formatDuration(item.moving_time)}</span>
                          {item.total_elevation_gain > 0 && (
                            <span>↑ {Math.round(item.total_elevation_gain)}m</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <button
                            onClick={() => handleLike(item.strava_activity_id, item.user_has_liked)}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition-colors"
                          >
                            {item.user_has_liked ? (
                              <HeartSolidIcon className="h-4 w-4 text-red-500" />
                            ) : (
                              <HeartIcon className="h-4 w-4" />
                            )}
                            <span>{item.likes_count || 0}</span>
                          </button>

                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <ChatBubbleLeftIcon className="h-4 w-4" />
                            <span>{item.comments_count || 0}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🏆</span>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            a débloqué un badge !
                          </Typography>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {item.badge_name} {item.badge_count > 1 && `×${item.badge_count}`}
                          </Typography>
                          <Typography variant="small" color="gray" className="text-xs">
                            {item.badge_description}
                          </Typography>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Typography variant="small" color="gray" className="text-center py-8">
            Aucune activité récente
          </Typography>
        )}
      </CardBody>
    </Card>
  );
}
