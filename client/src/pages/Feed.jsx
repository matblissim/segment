import { useState, useEffect } from 'react';
import { Typography, Spinner, Button } from '@material-tailwind/react';
import { feedApi } from '../services/api';
import ActivityCard from '../components/ActivityCard';
import Layout from '../components/Layout';

export default function Feed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (loadMore = false) => {
    try {
      setLoading(true);
      setError('');

      const currentOffset = loadMore ? offset : 0;
      const data = await feedApi.getFeed(limit, currentOffset);

      if (loadMore) {
        setActivities([...activities, ...data.activities]);
      } else {
        setActivities(data.activities);
      }

      setHasMore(data.activities.length === limit);
      setOffset(currentOffset + data.activities.length);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Erreur lors du chargement du feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId) => {
    try {
      await feedApi.likeActivity(activityId);

      // Mettre à jour l'activité dans le state
      setActivities(activities.map(activity => {
        if (activity.strava_activity_id === activityId) {
          return {
            ...activity,
            user_has_liked: true,
            likes_count: (activity.likes_count || 0) + 1
          };
        }
        return activity;
      }));
    } catch (err) {
      console.error('Error liking activity:', err);
      if (err.response?.data?.error !== 'Already liked') {
        alert('Erreur lors du like');
      }
    }
  };

  const handleUnlike = async (activityId) => {
    try {
      await feedApi.unlikeActivity(activityId);

      // Mettre à jour l'activité dans le state
      setActivities(activities.map(activity => {
        if (activity.strava_activity_id === activityId) {
          return {
            ...activity,
            user_has_liked: false,
            likes_count: Math.max((activity.likes_count || 0) - 1, 0)
          };
        }
        return activity;
      }));
    } catch (err) {
      console.error('Error unliking activity:', err);
      alert('Erreur lors du retrait du like');
    }
  };

  const handleComment = async (activityId, commentText) => {
    try {
      const response = await feedApi.addComment(activityId, commentText);

      // Mettre à jour l'activité avec le nouveau commentaire
      setActivities(activities.map(activity => {
        if (activity.strava_activity_id === activityId) {
          const newComments = activity.comments || [];
          return {
            ...activity,
            comments: [...newComments, response.comment],
            comments_count: (activity.comments_count || 0) + 1
          };
        }
        return activity;
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleLoadMore = () => {
    loadFeed(true);
  };

  if (loading && activities.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Spinner className="h-12 w-12" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Typography variant="h3" color="blue-gray" className="mb-2">
            Feed d'activités
          </Typography>
          <Typography variant="paragraph" color="gray">
            Activités de vos amis et les vôtres
          </Typography>
        </div>

        {error && (
          <Typography variant="small" color="red" className="mb-4">
            {error}
          </Typography>
        )}

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Typography variant="h6" color="gray">
              Aucune activité à afficher
            </Typography>
            <Typography variant="small" color="gray" className="mt-2">
              Ajoutez des amis pour voir leurs activités !
            </Typography>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onComment={handleComment}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
