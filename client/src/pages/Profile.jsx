import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Input,
  Textarea,
  Button,
  Avatar,
} from "@material-tailwind/react";

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    shoes: '',
    bike: '',
    instagram: '',
    bio: '',
  });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Charger les données du profil depuis le localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, []);

  const handleSave = () => {
    // Sauvegarder dans le localStorage
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
    setEditing(false);
  };

  return (
    <Layout showSportToggle={false}>
      <Typography variant="h4" color="blue-gray" className="mb-6">
        Mon Profil
      </Typography>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations Strava */}
        <Card className="border border-gray-200 shadow-none lg:col-span-1">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 p-6 border-b border-gray-200"
          >
            <Typography variant="h6" color="blue-gray">
              Informations Strava
            </Typography>
          </CardHeader>
          <CardBody className="text-center">
            <Avatar
              src={user?.profile || 'https://via.placeholder.com/150'}
              alt={user?.firstname}
              size="xxl"
              className="mx-auto mb-4 ring-4 ring-gray-100"
            />
            <Typography variant="h5" color="blue-gray" className="mb-2">
              {user?.firstname} {user?.lastname}
            </Typography>
            {user?.city && (
              <Typography variant="small" color="gray" className="mb-1">
                {user.city}, {user.country}
              </Typography>
            )}
            <Typography variant="small" color="gray">
              ID Strava: {user?.id}
            </Typography>
          </CardBody>
        </Card>

        {/* Informations personnelles */}
        <Card className="border border-gray-200 shadow-none lg:col-span-2">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 p-6 border-b border-gray-200"
          >
            <div className="flex items-center justify-between">
              <Typography variant="h6" color="blue-gray">
                Informations personnelles
              </Typography>
              {!editing && (
                <Button
                  size="sm"
                  color="gray"
                  variant="outlined"
                  onClick={() => setEditing(true)}
                  className="normal-case"
                >
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {saved && (
              <div className="mb-4 p-3 bg-gray-100 text-gray-900 rounded border border-gray-300">
                <Typography variant="small" className="font-medium">
                  Profil mis à jour avec succès
                </Typography>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Chaussures de course
                </Typography>
                {editing ? (
                  <Input
                    color="gray"
                    label="Modèle de chaussures"
                    value={profileData.shoes}
                    onChange={(e) => setProfileData({ ...profileData, shoes: e.target.value })}
                    className="!border-gray-300"
                  />
                ) : (
                  <Typography variant="small" color="gray">
                    {profileData.shoes || 'Non renseigné'}
                  </Typography>
                )}
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Vélo
                </Typography>
                {editing ? (
                  <Input
                    color="gray"
                    label="Modèle de vélo"
                    value={profileData.bike}
                    onChange={(e) => setProfileData({ ...profileData, bike: e.target.value })}
                    className="!border-gray-300"
                  />
                ) : (
                  <Typography variant="small" color="gray">
                    {profileData.bike || 'Non renseigné'}
                  </Typography>
                )}
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Instagram
                </Typography>
                {editing ? (
                  <Input
                    color="gray"
                    label="@username"
                    value={profileData.instagram}
                    onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                    className="!border-gray-300"
                  />
                ) : (
                  <Typography variant="small" color="gray">
                    {profileData.instagram ? `@${profileData.instagram.replace('@', '')}` : 'Non renseigné'}
                  </Typography>
                )}
              </div>

              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  À propos
                </Typography>
                {editing ? (
                  <Textarea
                    color="gray"
                    label="Parlez de vous, vos objectifs..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="!border-gray-300"
                    rows={4}
                  />
                ) : (
                  <Typography variant="small" color="gray">
                    {profileData.bio || 'Non renseigné'}
                  </Typography>
                )}
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    color="gray"
                    onClick={handleSave}
                    className="normal-case"
                  >
                    Enregistrer
                  </Button>
                  <Button
                    color="gray"
                    variant="outlined"
                    onClick={handleCancel}
                    className="normal-case"
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
