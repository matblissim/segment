import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi, activitiesApi, gamificationApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Avatar,
  Chip,
} from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function AdminUserView() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState({ running: [], cycling: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les infos utilisateur
      const userData = await adminApi.getUser(userId);
      setUser(userData.user);

      // Pour l'instant, on ne peut pas récupérer les activités d'un autre user
      // Donc on affiche juste les infos basiques
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Erreur lors du chargement des données utilisateur');
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
              Chargement...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout showSportToggle={false}>
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center py-12">
            <Typography variant="h6" color="gray">
              {error || 'Utilisateur non trouvé'}
            </Typography>
            <Link to="/admin">
              <Button size="sm" color="gray" variant="outlined" className="mt-4 normal-case">
                Retour
              </Button>
            </Link>
          </CardBody>
        </Card>
      </Layout>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Layout showSportToggle={false}>
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center py-12">
            <Typography variant="h6" color="gray">
              Accès non autorisé
            </Typography>
          </CardBody>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout showSportToggle={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button size="sm" color="gray" variant="text" className="flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <Typography variant="h4" color="blue-gray">
            Profil utilisateur
          </Typography>
        </div>

        {/* User Info Card */}
        <Card className="border border-gray-200 shadow-none">
          <CardBody>
            <div className="flex items-center gap-6">
              {user.profile_photo && (
                <Avatar
                  src={user.profile_photo}
                  alt={user.username}
                  size="xxl"
                  className="ring-4 ring-gray-200"
                />
              )}
              <div className="flex-1">
                <Typography variant="h5" color="blue-gray" className="mb-2">
                  {user.firstname} {user.lastname}
                </Typography>
                <Typography variant="small" color="gray" className="mb-4">
                  @{user.username}
                </Typography>
                <div className="flex items-center gap-4">
                  <Chip
                    value={user.role}
                    size="sm"
                    variant="ghost"
                    className={
                      user.role === 'admin'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }
                  />
                  <Typography variant="small" color="gray">
                    Strava ID: {user.strava_id}
                  </Typography>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Stats Card */}
        <Card className="border border-gray-200 shadow-none">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 p-6 border-b border-gray-200"
          >
            <Typography variant="h6" color="blue-gray">
              Informations
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="small" color="gray" className="mb-1">
                  Inscription
                </Typography>
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="mb-1">
                  Dernière synchronisation
                </Typography>
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  {user.last_sync_at
                    ? new Date(user.last_sync_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Jamais'}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="mb-1">
                  Statut synchronisation
                </Typography>
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  {user.sync_status || 'N/A'}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="mb-1">
                  Profil Strava
                </Typography>
                <a
                  href={`https://www.strava.com/athletes/${user.strava_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  <Typography variant="small" color="blue">
                    Voir sur Strava →
                  </Typography>
                </a>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Note */}
        <Card className="border border-gray-200 bg-gray-50 shadow-none">
          <CardBody className="py-3">
            <Typography variant="small" color="gray">
              Note: L'affichage des activités et statistiques d'autres utilisateurs sera disponible prochainement.
            </Typography>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
