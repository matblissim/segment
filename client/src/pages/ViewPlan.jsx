import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plansApi } from '../services/api';
import Layout from '../components/Layout';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Progress,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  CalendarIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

export default function ViewPlan() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openWeek, setOpenWeek] = useState(null);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      const data = await plansApi.getPlan(planId);
      setPlan(data.plan);

      // Ouvrir automatiquement la semaine en cours
      if (data.plan.sessions) {
        const currentWeek = getCurrentWeek(data.plan.sessions);
        setOpenWeek(currentWeek);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeek = (sessions) => {
    const today = new Date();
    const currentSession = sessions.find(s => {
      const sessionDate = new Date(s.session_date);
      return sessionDate >= today && !s.completed;
    });
    return currentSession ? currentSession.week_number : 1;
  };

  const groupSessionsByWeek = (sessions) => {
    const weeks = {};
    sessions.forEach(session => {
      if (!weeks[session.week_number]) {
        weeks[session.week_number] = [];
      }
      weeks[session.week_number].push(session);
    });
    return weeks;
  };

  const handleToggleSession = async (sessionId, currentStatus) => {
    try {
      if (!currentStatus) {
        await plansApi.completeSession(sessionId, {
          distance: null,
          duration: null,
          pace: null,
          notes: null,
        });
      }
      loadPlan();
    } catch (error) {
      console.error('Error toggling session:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getDayName = (dayNum) => {
    // dayNum: 1=Lun, 2=Mar... 6=Sam, 0=Dim
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayNum];
  };

  const getSessionTypeLabel = (type) => {
    const labels = {
      endurance: '🏃 Endurance',
      threshold: '⚡ Seuil',
      intervals: '💨 Fractionné',
      long_run: '📏 Sortie longue',
      recovery: '😌 Récupération',
      hill_repeats: '⛰️ Côtes',
      tempo: '🎯 Tempo',
      cross_training: '🚴 Cross-training',
      rest: '😴 Repos',
      race_pace: '🏁 Allure course',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Layout showSportToggle={false}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
        </div>
      </Layout>
    );
  }

  if (!plan) {
    return (
      <Layout showSportToggle={false}>
        <div className="text-center py-12">
          <Typography variant="h5" color="gray">
            Plan non trouvé
          </Typography>
          <Button className="mt-4" onClick={() => navigate('/plans')}>
            Retour aux plans
          </Button>
        </div>
      </Layout>
    );
  }

  const progress = plan.total_sessions > 0
    ? (plan.completed_sessions / plan.total_sessions) * 100
    : 0;
  const daysUntilRace = Math.ceil(
    (new Date(plan.goal_date) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const weeklyGroups = groupSessionsByWeek(plan.sessions || []);

  return (
    <Layout showSportToggle={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="text"
            className="flex items-center gap-2"
            onClick={() => navigate('/plans')}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Plan Info Card */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Typography variant="h4" color="blue-gray" className="mb-2">
                  {plan.name}
                </Typography>
                {plan.event_name && (
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-700" />
                    <Typography variant="h6" color="gray">
                      {plan.event_name}
                    </Typography>
                  </div>
                )}
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                daysUntilRace > 14 ? 'bg-blue-100 text-blue-700' :
                daysUntilRace > 7 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                J-{daysUntilRace}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <Typography variant="small" color="gray">Distance</Typography>
                <Typography variant="h6" color="blue-gray">
                  {(plan.goal_distance / 1000).toFixed(0)} km
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">D+</Typography>
                <Typography variant="h6" color="blue-gray">
                  {plan.goal_elevation} m
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">Type</Typography>
                <Typography variant="h6" color="blue-gray" className="capitalize">
                  {plan.race_type === 'trail' ? '🏔️ Trail' : plan.race_type === 'route' ? '🏃 Route' : '⛰️ Ultra'}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray">Date objectif</Typography>
                <Typography variant="h6" color="blue-gray">
                  {formatDate(plan.goal_date)}
                </Typography>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <Typography variant="small" color="gray">
                  Progression
                </Typography>
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  {plan.completed_sessions}/{plan.total_sessions} séances
                </Typography>
              </div>
              <Progress value={progress} color="blue" size="lg" />
            </div>
          </CardBody>
        </Card>

        {/* Sessions by Week */}
        <Typography variant="h5" color="blue-gray" className="mb-4">
          Programme d'entraînement
        </Typography>

        {Object.keys(weeklyGroups).sort((a, b) => a - b).map((weekNum) => {
          const weekSessions = weeklyGroups[weekNum];
          const weekCompleted = weekSessions.every(s => s.completed);
          const weekProgress = (weekSessions.filter(s => s.completed).length / weekSessions.length) * 100;

          return (
            <Accordion
              key={weekNum}
              open={openWeek === parseInt(weekNum)}
              icon={
                weekCompleted ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : null
              }
            >
              <AccordionHeader
                onClick={() => setOpenWeek(openWeek === parseInt(weekNum) ? null : parseInt(weekNum))}
                className={weekCompleted ? 'bg-green-50' : ''}
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <Typography variant="h6" color="blue-gray">
                      Semaine {weekNum}
                    </Typography>
                    <Chip
                      value={`${weekSessions.filter(s => s.completed).length}/${weekSessions.length}`}
                      size="sm"
                      color={weekCompleted ? 'green' : 'blue'}
                    />
                  </div>
                  <div className="w-32 hidden sm:block">
                    <Progress value={weekProgress} color={weekCompleted ? 'green' : 'blue'} size="sm" />
                  </div>
                </div>
              </AccordionHeader>
              <AccordionBody>
                <div className="space-y-3">
                  {weekSessions.sort((a, b) => a.day_of_week - b.day_of_week).map((session) => (
                    <Card
                      key={session.id}
                      className={`${session.completed ? 'bg-green-50 border-green-200' : 'bg-white'} border`}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Typography variant="small" className="font-semibold text-gray-600">
                                {getDayName(session.day_of_week)} {formatDate(session.session_date)}
                              </Typography>
                              <Chip
                                value={getSessionTypeLabel(session.session_type)}
                                size="sm"
                                variant="outlined"
                              />
                            </div>
                            <Typography variant="small" color="blue-gray" className="mb-2">
                              {session.description}
                            </Typography>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              {session.distance_km && (
                                <span>📏 {session.distance_km} km</span>
                              )}
                              {session.duration_minutes && (
                                <span><ClockIcon className="h-3 w-3 inline" /> {session.duration_minutes} min</span>
                              )}
                              {session.elevation_gain > 0 && (
                                <span>⛰️ {session.elevation_gain} m D+</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={session.completed ? "filled" : "outlined"}
                            color={session.completed ? "green" : "blue"}
                            onClick={() => handleToggleSession(session.id, session.completed)}
                          >
                            {session.completed ? '✓ Fait' : 'Marquer'}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </AccordionBody>
            </Accordion>
          );
        })}
      </div>
    </Layout>
  );
}
