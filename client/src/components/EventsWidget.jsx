import { useState, useEffect } from 'react';
import { eventsApi } from '../services/api';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Chip,
} from "@material-tailwind/react";
import { CalendarIcon } from "@heroicons/react/24/outline";

export default function EventsWidget() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriorityAEvents();
  }, []);

  const loadPriorityAEvents = async () => {
    try {
      const data = await eventsApi.getEventsByPriority('A');
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading priority A events:', error);
    } finally {
      setLoading(false);
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
            Événements Prioritaires
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
        <div className="flex items-center justify-between">
          <Typography variant="h6" color="blue-gray">
            Événements Prioritaires
          </Typography>
          <Chip
            value="A"
            size="sm"
            color="red"
            className="font-bold"
          />
        </div>
      </CardHeader>
      <CardBody className="pt-4">
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => {
              const daysUntil = getDaysUntil(event.event_date);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {event.name}
                      </Typography>
                      <Chip
                        value={getCountdownText(daysUntil)}
                        size="sm"
                        color={getCountdownColor(daysUntil)}
                        className="font-bold"
                      />
                    </div>
                    <Typography variant="small" color="gray" className="text-xs">
                      {formatDate(event.event_date)}
                    </Typography>
                    {event.location && (
                      <Typography variant="small" color="gray" className="text-xs">
                        📍 {event.location}
                      </Typography>
                    )}
                    {(event.target_distance || event.target_elevation) && (
                      <Typography variant="small" color="blue" className="text-xs font-medium">
                        {event.target_distance && `🎯 ${(event.target_distance / 1000).toFixed(0)} km`}
                        {event.target_distance && event.target_elevation && ' • '}
                        {event.target_elevation && `⛰️ ${Math.round(event.target_elevation)} m D+`}
                      </Typography>
                    )}
                    {event.participants_count > 0 && (
                      <Typography variant="small" color="blue-gray" className="text-xs mt-1">
                        👥 {event.participants_count} participant{event.participants_count > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Typography variant="small" color="gray" className="text-center py-8">
            Aucun événement prioritaire
          </Typography>
        )}
      </CardBody>
    </Card>
  );
}
