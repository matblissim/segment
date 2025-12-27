import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { plansApi } from '../services/api';
import Layout from '../components/Layout';
import { Card, CardBody, Typography, Button, Progress } from "@material-tailwind/react";
import { CalendarIcon, TrophyIcon, PlusIcon } from "@heroicons/react/24/solid";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await plansApi.getPlans();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
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

  return (
    <Layout showSportToggle={false}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <Typography variant="h3" color="blue-gray">
              Plans d'Entraînement
            </Typography>
          </div>
          <Typography variant="small" color="gray" className="sm:hidden">
            Plans personnalisés générés par IA selon vos objectifs
          </Typography>
        </div>

        {plans.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <Typography variant="h5" color="gray" className="mb-2">
                Aucun plan d'entraînement
              </Typography>
              <Typography color="gray" className="mb-6 max-w-md mx-auto">
                Créez votre premier plan personnalisé et intelligent pour atteindre vos objectifs sportifs
              </Typography>
              <Typography variant="small" color="gray" className="mb-4">
                💡 Astuce : Allez dans Événements et cliquez sur "Créer un plan" pour un plan adapté à votre course
              </Typography>
              <Link to="/events">
                <Button>Voir mes événements</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const progress = plan.total_sessions > 0
                ? (plan.completed_sessions / plan.total_sessions) * 100
                : 0;
              const daysUntilRace = Math.ceil(
                (new Date(plan.goal_date) - new Date()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <Typography variant="h6" color="blue-gray" className="truncate">
                          {plan.name}
                        </Typography>
                        {plan.event_name && (
                          <div className="flex items-center gap-2 mt-1">
                            <TrophyIcon className="h-4 w-4 text-yellow-700" />
                            <Typography variant="small" color="gray" className="truncate">
                              {plan.event_name}
                            </Typography>
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                        daysUntilRace > 14 ? 'bg-blue-100 text-blue-700' :
                        daysUntilRace > 7 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        J-{daysUntilRace}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div>
                        <Typography variant="small" color="gray">Distance</Typography>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {(plan.goal_distance / 1000).toFixed(0)} km
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="small" color="gray">Type</Typography>
                        <Typography variant="small" color="blue-gray" className="font-semibold capitalize">
                          {plan.race_type === 'trail' ? '🏔️ Trail' : plan.race_type === 'route' ? '🏃 Route' : '⛰️ Ultra'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="small" color="gray">Séances/sem</Typography>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {plan.sessions_per_week}x
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="small" color="gray">Durée</Typography>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {plan.weeks_duration} sem.
                        </Typography>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <Typography variant="small" color="gray">
                          Progression
                        </Typography>
                        <Typography variant="small" color="blue-gray" className="font-semibold">
                          {plan.completed_sessions}/{plan.total_sessions}
                        </Typography>
                      </div>
                      <Progress value={progress} color="blue" />
                    </div>

                    <Typography variant="small" color="gray" className="text-center">
                      📅 {formatDate(plan.goal_date)}
                    </Typography>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
