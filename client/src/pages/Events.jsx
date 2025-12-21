import { useState, useEffect } from 'react';
import { eventsApi } from '../services/api';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
  Chip,
  Select,
  Option,
} from "@material-tailwind/react";
import { PlusIcon, CalendarIcon, MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    event_date: '',
    description: '',
    location: '',
    target_distance: '',
    target_elevation: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getEvents();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // Convertir les valeurs en nombre pour distance et elevation
      const eventData = {
        ...newEvent,
        target_distance: newEvent.target_distance ? parseFloat(newEvent.target_distance) * 1000 : null,
        target_elevation: newEvent.target_elevation ? parseFloat(newEvent.target_elevation) : null
      };
      await eventsApi.createEvent(eventData);
      setCreateDialogOpen(false);
      setNewEvent({ name: '', event_date: '', description: '', location: '', target_distance: '', target_elevation: '' });
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    }
  };

  const handleParticipate = async (eventId, priority) => {
    try {
      await eventsApi.participate(eventId, priority);
      loadEvents();
    } catch (error) {
      console.error('Error participating in event:', error);
    }
  };

  const handleUnparticipate = async (eventId) => {
    try {
      await eventsApi.unparticipate(eventId);
      loadEvents();
    } catch (error) {
      console.error('Error unparticipating from event:', error);
    }
  };

  const getDaysUntil = (eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCountdownColor = (days) => {
    if (days < 0) return 'gray';
    if (days <= 7) return 'red';
    if (days <= 30) return 'orange';
    return 'green';
  };

  const getCountdownText = (days) => {
    if (days < 0) return 'Passé';
    if (days === 0) return "Aujourd'hui !";
    if (days === 1) return 'Demain !';
    return `J-${days}`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'A': return 'red';
      case 'B': return 'orange';
      case 'C': return 'green';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Layout showSportToggle={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
            <Typography variant="h6" color="gray">
              Chargement des événements...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSportToggle={false}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h4" color="blue-gray">
            Événements
          </Typography>
          <Typography variant="small" color="gray">
            Créez et participez aux événements sportifs
          </Typography>
        </div>
        <Button
          className="flex items-center gap-2"
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Créer un événement
        </Button>
      </div>

      {/* Events List */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const daysUntil = getDaysUntil(event.event_date);
            const isPast = daysUntil < 0;

            return (
              <Card key={event.id} className={`border border-gray-200 shadow-none ${isPast ? 'opacity-60' : ''}`}>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Typography variant="h6" color="blue-gray" className="mb-1">
                        {event.name}
                      </Typography>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {(event.target_distance || event.target_elevation) && (
                        <div className="flex items-center gap-3 text-sm text-blue-600 mt-1 font-medium">
                          {event.target_distance && (
                            <span>🎯 {(event.target_distance / 1000).toFixed(0)} km</span>
                          )}
                          {event.target_elevation && (
                            <span>⛰️ {Math.round(event.target_elevation)} m D+</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Chip
                      value={getCountdownText(daysUntil)}
                      size="sm"
                      color={getCountdownColor(daysUntil)}
                      className="font-bold"
                    />
                  </div>

                  {event.description && (
                    <Typography variant="small" color="gray" className="mb-3">
                      {event.description}
                    </Typography>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{event.participants_count || 0} participant{event.participants_count > 1 ? 's' : ''}</span>
                      <span className="text-xs text-gray-400">• {event.creator_username}</span>
                    </div>

                    {!isPast && (
                      <div className="flex items-center gap-2">
                        {event.is_participating ? (
                          <>
                            <Chip
                              value={`Priorité ${event.user_priority}`}
                              size="sm"
                              color={getPriorityColor(event.user_priority)}
                              className="font-semibold"
                            />
                            <select
                              value={event.user_priority}
                              onChange={(e) => handleParticipate(event.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                            </select>
                            <Button
                              size="sm"
                              variant="outlined"
                              color="red"
                              onClick={() => handleUnparticipate(event.id)}
                            >
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleParticipate(event.id, 'B')}
                          >
                            Participer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-none">
          <CardBody className="text-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <Typography variant="h6" color="gray" className="mb-2">
              Aucun événement
            </Typography>
            <Typography variant="small" color="gray" className="mb-4">
              Créez le premier événement pour votre communauté
            </Typography>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Créer un événement
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} handler={() => setCreateDialogOpen(false)} size="sm">
        <DialogHeader>Créer un événement</DialogHeader>
        <DialogBody className="space-y-4">
          <Input
            label="Nom de l'événement *"
            value={newEvent.name}
            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
          />
          <Input
            type="date"
            label="Date *"
            value={newEvent.event_date}
            onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
          />
          <Input
            label="Lieu"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Distance cible (km)"
              value={newEvent.target_distance}
              onChange={(e) => setNewEvent({ ...newEvent, target_distance: e.target.value })}
            />
            <Input
              type="number"
              label="D+ cible (m)"
              value={newEvent.target_elevation}
              onChange={(e) => setNewEvent({ ...newEvent, target_elevation: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button variant="text" onClick={() => setCreateDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateEvent}
            disabled={!newEvent.name || !newEvent.event_date}
          >
            Créer
          </Button>
        </DialogFooter>
      </Dialog>
    </Layout>
  );
}
