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
  Spinner,
} from "@material-tailwind/react";
import { HeartIcon } from '@heroicons/react/24/outline';
import { profileApi } from '../services/api';

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

  // HR zones state
  const [loadingHR, setLoadingHR] = useState(true);
  const [savingHR, setSavingHR] = useState(false);
  const [maxHeartRate, setMaxHeartRate] = useState(190);
  const [hrZones, setHrZones] = useState(null);
  const [hrError, setHrError] = useState(null);
  const [hrSuccess, setHrSuccess] = useState(null);

  useEffect(() => {
    // Charger les données du profil depuis le localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }

    // Charger les zones HR depuis l'API
    loadHRProfile();
  }, []);

  const loadHRProfile = async () => {
    try {
      setLoadingHR(true);
      const data = await profileApi.getProfile();
      setMaxHeartRate(data.user.max_heartrate);
      setHrZones(data.hr_zones);
    } catch (err) {
      console.error('Error loading HR profile:', err);
      setHrError('Erreur lors du chargement des zones FC');
    } finally {
      setLoadingHR(false);
    }
  };

  const handleMaxHRChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;

    setMaxHeartRate(value);

    // Recalculer les zones en temps réel
    const zones = {
      z1: { min: 0, max: Math.round(value * 0.60), name: 'Récupération', percentage: '0-60%' },
      z2: { min: Math.round(value * 0.60), max: Math.round(value * 0.70), name: 'Endurance', percentage: '60-70%' },
      z3: { min: Math.round(value * 0.70), max: Math.round(value * 0.80), name: 'Tempo', percentage: '70-80%' },
      z4: { min: Math.round(value * 0.80), max: Math.round(value * 0.90), name: 'Seuil', percentage: '80-90%' },
      z5: { min: Math.round(value * 0.90), max: value, name: 'VO2max', percentage: '90-100%' },
    };
    setHrZones(zones);
  };

  const handleSaveHR = async () => {
    try {
      setSavingHR(true);
      setHrError(null);
      setHrSuccess(null);

      await profileApi.updateMaxHeartRate(maxHeartRate);

      setHrSuccess('Zones FC mises à jour! Les analyses IA utiliseront vos nouvelles zones.');
      setTimeout(() => setHrSuccess(null), 5000);

      await loadHRProfile();
    } catch (err) {
      console.error('Error saving HR:', err);
      setHrError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingHR(false);
    }
  };

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

      {/* Zones de fréquence cardiaque */}
      <Card className="border border-gray-200 shadow-none mt-6">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 p-6 border-b border-gray-200 bg-red-50"
        >
          <div className="flex items-center gap-2">
            <HeartIcon className="h-6 w-6 text-red-600" />
            <Typography variant="h6" color="red">
              Zones de Fréquence Cardiaque
            </Typography>
          </div>
          <Typography variant="small" color="gray" className="mt-2">
            Configurez votre FC max pour des analyses IA personnalisées
          </Typography>
        </CardHeader>
        <CardBody>
          {loadingHR ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" color="red" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Typography variant="small" color="blue-gray" className="mb-4 font-medium">
                  Fréquence cardiaque maximale
                </Typography>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-48">
                    <Input
                      type="number"
                      label="FC Max (bpm)"
                      value={maxHeartRate}
                      onChange={handleMaxHRChange}
                      min={100}
                      max={220}
                      size="lg"
                      color="red"
                      icon={<HeartIcon className="h-5 w-5" />}
                    />
                  </div>
                  <Button
                    color="red"
                    onClick={handleSaveHR}
                    disabled={savingHR || maxHeartRate < 100 || maxHeartRate > 220}
                    className="flex items-center gap-2 normal-case"
                  >
                    {savingHR ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <HeartIcon className="h-5 w-5" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>

                {/* Test protocol */}
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
                  <Typography variant="small" color="blue-gray" className="font-semibold mb-2">
                    📊 Comment mesurer votre FC max (test terrain)
                  </Typography>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Échauffement 15 min facile</li>
                    <li>Trouvez une côte de 3-5% sur 400-800m</li>
                    <li>3 montées progressives (90%, 95%, 100% all-out) avec 2 min récup</li>
                    <li>Le pic FC atteint = votre FC max</li>
                  </ul>
                  <Typography variant="small" color="gray" className="mt-2">
                    <strong>Méthode:</strong> Zones Coggan/Friel à % de FC max.
                  </Typography>
                </div>

                {hrSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <Typography variant="small" color="green">
                      {hrSuccess}
                    </Typography>
                  </div>
                )}

                {hrError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <Typography variant="small" color="red">
                      {hrError}
                    </Typography>
                  </div>
                )}
              </div>

              {/* Zones display */}
              {hrZones && (
                <div className="border-t pt-6">
                  <Typography variant="h6" color="blue-gray" className="mb-4">
                    Vos zones d'entraînement
                  </Typography>
                  <div className="space-y-3">
                    {Object.entries(hrZones).map(([key, zone]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            key === 'z1' ? 'bg-blue-400' :
                            key === 'z2' ? 'bg-green-400' :
                            key === 'z3' ? 'bg-yellow-400' :
                            key === 'z4' ? 'bg-orange-400' :
                            'bg-red-500'
                          }`}>
                            {key.toUpperCase()}
                          </div>
                          <div>
                            <Typography variant="h6" color="blue-gray">
                              {zone.name}
                            </Typography>
                            <Typography variant="small" color="gray">
                              {zone.percentage} de FC max
                            </Typography>
                          </div>
                        </div>
                        <Typography variant="h6" color="blue-gray">
                          {zone.min} - {zone.max} bpm
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </Layout>
  );
}
