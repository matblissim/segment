import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Input,
  Button,
  Spinner,
} from '@material-tailwind/react';
import { HeartIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { profileApi } from '../services/api';
import Layout from '../components/Layout';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [maxHeartRate, setMaxHeartRate] = useState(190);
  const [hrZones, setHrZones] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getProfile();
      setProfile(data.user);
      setMaxHeartRate(data.user.max_heartrate);
      setHrZones(data.hr_zones);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await profileApi.updateMaxHeartRate(maxHeartRate);

      setSuccess('Profil mis à jour avec succès! Les analyses IA utiliseront désormais vos nouvelles zones.');

      // Reload profile to confirm
      await loadProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout showSportToggle={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="h-12 w-12" color="purple" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSportToggle={false}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Typography variant="h3" color="blue-gray" className="flex items-center gap-2">
          <UserCircleIcon className="h-8 w-8" />
          Paramètres du profil
        </Typography>
        <Typography color="gray" className="mt-2">
          Configurez vos zones de fréquence cardiaque pour des analyses IA plus précises
        </Typography>
      </div>

      {/* Profil utilisateur */}
      <Card className="mb-6">
        <CardHeader color="purple" className="p-4">
          <Typography variant="h5" color="white" className="flex items-center gap-2">
            <UserCircleIcon className="h-6 w-6" />
            Informations personnelles
          </Typography>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4 mb-4">
            {profile?.profile_photo && (
              <img
                src={profile.profile_photo}
                alt={profile.username}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <Typography variant="h6" color="blue-gray">
                {profile?.firstname} {profile?.lastname}
              </Typography>
              <Typography variant="small" color="gray">
                @{profile?.username}
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Configuration FC Max */}
      <Card className="mb-6">
        <CardHeader color="red" className="p-4">
          <Typography variant="h5" color="white" className="flex items-center gap-2">
            <HeartIcon className="h-6 w-6" />
            Fréquence cardiaque maximale
          </Typography>
        </CardHeader>
        <CardBody>
          <div className="mb-6">
            <Typography color="gray" className="mb-4">
              Entrez votre FC max mesurée (test d'effort, course, etc.). Les zones d'entraînement seront automatiquement calculées.
            </Typography>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-64">
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
              <Typography variant="small" color="gray">
                Valeur recommandée : 100-220 bpm
              </Typography>
            </div>

            <Typography variant="small" color="gray" className="italic">
              💡 Si vous ne connaissez pas votre FC max, utilisez la formule : 220 - votre âge
            </Typography>
          </div>

          {/* Zones FC calculées automatiquement */}
          {hrZones && (
            <div className="mt-6 border-t pt-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Zones d'entraînement calculées
              </Typography>

              <div className="space-y-3">
                {Object.entries(hrZones).map(([key, zone]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                    <div className="text-right">
                      <Typography variant="h6" color="blue-gray">
                        {zone.min} - {zone.max} bpm
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Typography color="red" variant="small">
                {error}
              </Typography>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Typography color="green" variant="small">
                {success}
              </Typography>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="gradient"
              color="purple"
              onClick={handleSave}
              disabled={saving || maxHeartRate < 100 || maxHeartRate > 220}
              className="flex items-center gap-2"
            >
              {saving ? (
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
            <Button
              variant="outlined"
              color="gray"
              onClick={loadProfile}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>

          <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
            <Typography variant="small" color="purple" className="font-semibold mb-2">
              ℹ️ Information importante
            </Typography>
            <Typography variant="small" color="gray">
              Ces zones seront utilisées par l'IA pour analyser vos activités et détecter si vous êtes en sous-régime, surentraînement, ou si votre gestion cardiaque est optimale.
            </Typography>
          </div>
        </CardBody>
      </Card>
    </div>
    </Layout>
  );
}
