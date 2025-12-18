import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Chip,
} from "@material-tailwind/react";

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdating(userId);
      setError(null);
      await adminApi.updateUserRole(userId, newRole);
      // Recharger la liste
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Erreur lors de la mise à jour du rôle');
    } finally {
      setUpdating(null);
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
        <div className="flex items-center justify-between">
          <Typography variant="h4" color="blue-gray">
            Administration
          </Typography>
          <Button
            size="sm"
            color="gray"
            variant="outlined"
            onClick={loadUsers}
            disabled={loading}
            className="normal-case"
          >
            Actualiser
          </Button>
        </div>

        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-none">
            <CardBody className="py-3">
              <Typography variant="small" color="red">
                {error}
              </Typography>
            </CardBody>
          </Card>
        )}

        <Card className="border border-gray-200 shadow-none">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 p-6 border-b border-gray-200"
          >
            <Typography variant="h6" color="blue-gray">
              Utilisateurs ({users.length})
            </Typography>
          </CardHeader>
          <CardBody className="p-0">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Typography variant="small" color="gray">
                  Aucun utilisateur
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-4 text-left">
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          Utilisateur
                        </Typography>
                      </th>
                      <th className="p-4 text-left">
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          Strava ID
                        </Typography>
                      </th>
                      <th className="p-4 text-left">
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          Inscription
                        </Typography>
                      </th>
                      <th className="p-4 text-left">
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          Dernière sync
                        </Typography>
                      </th>
                      <th className="p-4 text-left">
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          Rôle
                        </Typography>
                      </th>
                      <th className="p-4 text-left">
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          Actions
                        </Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.profile_photo && (
                              <img
                                src={user.profile_photo}
                                alt={user.username}
                                className="h-10 w-10 rounded-full"
                              />
                            )}
                            <div>
                              <Typography variant="small" color="blue-gray" className="font-semibold">
                                {user.firstname} {user.lastname}
                              </Typography>
                              <Typography variant="small" color="gray">
                                @{user.username}
                              </Typography>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <a
                            href={`https://www.strava.com/athletes/${user.strava_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <Typography variant="small" color="blue">
                              {user.strava_id}
                            </Typography>
                          </a>
                        </td>
                        <td className="p-4">
                          <Typography variant="small" color="gray">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography variant="small" color="gray">
                            {user.last_sync_at
                              ? new Date(user.last_sync_at).toLocaleDateString('fr-FR')
                              : 'Jamais'}
                          </Typography>
                        </td>
                        <td className="p-4">
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
                        </td>
                        <td className="p-4">
                          {user.id !== currentUser.id && (
                            <Button
                              size="sm"
                              color="gray"
                              variant="outlined"
                              onClick={() =>
                                handleRoleChange(
                                  user.id,
                                  user.role === 'admin' ? 'user' : 'admin'
                                )
                              }
                              disabled={updating === user.id}
                              className="normal-case"
                            >
                              {updating === user.id
                                ? 'Mise à jour...'
                                : user.role === 'admin'
                                ? 'Rétrograder'
                                : 'Promouvoir admin'}
                            </Button>
                          )}
                          {user.id === currentUser.id && (
                            <Typography variant="small" color="gray">
                              Vous
                            </Typography>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
