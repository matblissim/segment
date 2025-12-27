import { useState } from 'react';
import { authApi } from '../services/api';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { url } = await authApi.getAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setLoading(false);
    }
  };

  const features = [
    {
      icon: '📊',
      title: 'Stats & Analytics',
      description: 'Analysez vos performances avec des graphiques détaillés par semaine, mois ou année',
    },
    {
      icon: '🏆',
      title: 'Badges',
      description: 'Débloquez des badges pour vos exploits : Marathon, Ultra 100K, semaines à 100K+...',
    },
    {
      icon: '🔥',
      title: 'Challenges',
      description: 'Défiez vos amis sur distance ou dénivelé. Premier à l\'objectif gagne !',
    },
    {
      icon: '❤️',
      title: 'Zones FC',
      description: 'Configurez vos zones cardio (Z1-Z5) et suivez vos entraînements par zone',
    },
    {
      icon: '👥',
      title: 'Social',
      description: 'Ajoutez des amis, consultez leur feed, comparez vos stats H2H',
    },
    {
      icon: '📅',
      title: 'Événements',
      description: 'Retrouvez toutes les courses auxquelles vous avez participé',
    },
    {
      icon: '📍',
      title: 'Géolocalisation',
      description: 'Visualisez les villes où vous vous êtes entraîné',
    },
    {
      icon: '⚡',
      title: 'Sync Auto',
      description: 'Synchronisation automatique avec Strava en temps réel',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        {/* Header - Compact sur mobile */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-4 tracking-tight">
            Strava Gamification
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Suivez vos performances, relevez des challenges et visualisez votre progression sportive
          </p>
        </div>

        {/* CTA Button - Visible immédiatement sur mobile */}
        <div className="mb-8 sm:mb-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center border-2 border-orange-100">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-strava hover:bg-orange-600 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                  </svg>
                  Se connecter avec Strava
                </>
              )}
            </button>

            <p className="mt-4 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              🔒 Connexion sécurisée • Vos données restent privées
              <br />
              <a href="/privacy" className="text-blue-600 hover:underline mt-2 inline-block">
                Politique de confidentialité
              </a>
            </p>
          </div>
        </div>

        {/* Features - Layout optimisé mobile */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-orange-500 to-blue-500">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
              Toutes les fonctionnalités
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-100 to-blue-100 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 space-y-3">
          <p className="text-xs sm:text-sm text-gray-500 px-4">
            ⚡ Synchronisation automatique • 📊 Données en temps réel • 🎯 100% gratuit
          </p>
          <p className="text-xs text-gray-400">
            <a href="/privacy" className="hover:text-blue-600 hover:underline">
              Politique de confidentialité
            </a>
            {' • '}
            <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
              Strava Privacy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
