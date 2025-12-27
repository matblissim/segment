import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { plansApi, eventsApi } from '../services/api';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  Select,
  Option,
  Checkbox,
  Textarea,
} from "@material-tailwind/react";
import { CalendarIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    goalDistance: '',
    goalElevation: '',
    goalDate: '',
    goalPace: '',
    raceType: 'route',
    weeksDuration: '12',
    sessionsPerWeek: '4',
    availableDays: [0, 2, 4, 6], // Lundi, Mercredi, Vendredi, Dimanche
    crossTraining: [],
    userLevel: 'intermediate',
    maxHeartRate: '',
    vma: '',
    currentWeeklyKm: '',
    constraints: '',
  });

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventsApi.getEvents();
      const foundEvent = data.events.find(e => e.id === parseInt(eventId));
      if (foundEvent) {
        setEvent(foundEvent);
        setFormData(prev => ({
          ...prev,
          name: `Plan ${foundEvent.name}`,
          goalDistance: foundEvent.target_distance ? (foundEvent.target_distance / 1000).toString() : '',
          goalElevation: foundEvent.target_elevation ? foundEvent.target_elevation.toString() : '',
          goalDate: foundEvent.event_date,
          raceType: foundEvent.target_elevation && foundEvent.target_distance
            ? (foundEvent.target_elevation / foundEvent.target_distance * 1000 > 40 ? 'trail' : 'route')
            : 'route',
        }));
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day].sort((a, b) => a - b)
    }));
  };

  const handleCrossTrainingToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      crossTraining: prev.crossTraining.includes(type)
        ? prev.crossTraining.filter(t => t !== type)
        : [...prev.crossTraining, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const planConfig = {
        eventId: eventId ? parseInt(eventId) : null,
        name: formData.name,
        goalDistance: parseFloat(formData.goalDistance) * 1000, // Convert km to m
        goalElevation: formData.goalElevation ? parseInt(formData.goalElevation) : 0,
        goalDate: formData.goalDate,
        goalPace: formData.goalPace ? parseInt(formData.goalPace) : null,
        raceType: formData.raceType,
        weeksDuration: parseInt(formData.weeksDuration),
        sessionsPerWeek: parseInt(formData.sessionsPerWeek),
        availableDays: formData.availableDays,
        crossTraining: formData.crossTraining,
        userLevel: formData.userLevel,
        maxHeartRate: formData.maxHeartRate ? parseInt(formData.maxHeartRate) : null,
        vma: formData.vma ? parseFloat(formData.vma) : null,
        currentWeeklyKm: formData.currentWeeklyKm ? parseInt(formData.currentWeeklyKm) : null,
        constraints: formData.constraints || null,
      };

      await plansApi.createPlan(planConfig);
      navigate('/plans');
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Erreur lors de la création du plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSportToggle={false}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="text"
            className="flex items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <Typography variant="h3" color="blue-gray">
              Créer un Plan d'Entraînement
            </Typography>
          </div>
        </div>

        {event && (
          <Card className="mb-6 border-l-4 border-blue-500">
            <CardBody className="p-4">
              <Typography variant="h6" color="blue-gray" className="mb-1">
                📅 Événement : {event.name}
              </Typography>
              <div className="flex gap-4 text-sm text-gray-600">
                {event.target_distance && (
                  <span>🎯 {(event.target_distance / 1000).toFixed(0)} km</span>
                )}
                {event.target_elevation && (
                  <span>⛰️ {Math.round(event.target_elevation)} m D+</span>
                )}
                <span>📆 {new Date(event.event_date).toLocaleDateString('fr-FR')}</span>
              </div>
            </CardBody>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardBody>
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Informations de base
              </Typography>

              <div className="space-y-4">
                <Input
                  label="Nom du plan *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    step="0.1"
                    label="Distance objectif (km) *"
                    value={formData.goalDistance}
                    onChange={(e) => setFormData({ ...formData, goalDistance: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    label="Dénivelé positif (m)"
                    value={formData.goalElevation}
                    onChange={(e) => setFormData({ ...formData, goalElevation: e.target.value })}
                  />
                </div>

                <Input
                  type="date"
                  label="Date de l'objectif *"
                  value={formData.goalDate}
                  onChange={(e) => setFormData({ ...formData, goalDate: e.target.value })}
                  required
                />

                <Select
                  label="Type de course *"
                  value={formData.raceType}
                  onChange={(value) => setFormData({ ...formData, raceType: value })}
                >
                  <Option value="route">🏃 Route</Option>
                  <Option value="trail">🏔️ Trail</Option>
                  <Option value="ultra">⛰️ Ultra</Option>
                </Select>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Configuration du plan
              </Typography>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    min="4"
                    max="52"
                    label="Durée (semaines) *"
                    value={formData.weeksDuration}
                    onChange={(e) => setFormData({ ...formData, weeksDuration: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    min="3"
                    max="7"
                    label="Séances/semaine *"
                    value={formData.sessionsPerWeek}
                    onChange={(e) => setFormData({ ...formData, sessionsPerWeek: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Typography variant="small" color="gray" className="mb-2">
                    Jours disponibles *
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={formData.availableDays.includes(index) ? "filled" : "outlined"}
                        onClick={() => handleDayToggle(index)}
                        type="button"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <Select
                  label="Niveau *"
                  value={formData.userLevel}
                  onChange={(value) => setFormData({ ...formData, userLevel: value })}
                >
                  <Option value="beginner">Débutant</Option>
                  <Option value="intermediate">Intermédiaire</Option>
                  <Option value="advanced">Avancé</Option>
                  <Option value="expert">Expert</Option>
                </Select>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Cross-training (optionnel)
              </Typography>

              <div className="flex flex-wrap gap-2">
                {['cycling', 'swimming', 'crossfit', 'hyrox', 'strength'].map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={formData.crossTraining.includes(type) ? "filled" : "outlined"}
                    onClick={() => handleCrossTrainingToggle(type)}
                    type="button"
                  >
                    {type === 'cycling' && '🚴 Vélo'}
                    {type === 'swimming' && '🏊 Natation'}
                    {type === 'crossfit' && '🏋️ CrossFit'}
                    {type === 'hyrox' && '💪 Hyrox'}
                    {type === 'strength' && '🏋️‍♀️ Musculation'}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Paramètres avancés (optionnel)
              </Typography>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    label="FC max (bpm)"
                    value={formData.maxHeartRate}
                    onChange={(e) => setFormData({ ...formData, maxHeartRate: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    label="VMA (km/h)"
                    value={formData.vma}
                    onChange={(e) => setFormData({ ...formData, vma: e.target.value })}
                  />
                  <Input
                    type="number"
                    label="Km actuels/sem"
                    value={formData.currentWeeklyKm}
                    onChange={(e) => setFormData({ ...formData, currentWeeklyKm: e.target.value })}
                  />
                </div>

                <Input
                  type="number"
                  label="Allure cible (sec/km)"
                  value={formData.goalPace}
                  onChange={(e) => setFormData({ ...formData, goalPace: e.target.value })}
                />

                <Textarea
                  label="Contraintes spécifiques"
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                />
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              type="button"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Génération en cours...' : 'Générer le plan'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
