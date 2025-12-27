import { useState } from 'react';

export default function Privacy() {
  const [language, setLanguage] = useState('en'); // Default: English

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdate: "Last updated: December 27, 2025",
      backToHome: "← Back to home",

      sections: [
        {
          title: "1. Introduction",
          text: "Strava Gamification (\"we\", \"our\" or \"the application\") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use and protect your information when you use our application."
        },
        {
          title: "2. Data We Collect",
          text: "We collect the following data via the Strava API after your explicit authorization:",
          list: [
            "<strong>Profile information:</strong> first name, last name, profile picture, gender",
            "<strong>Sports activities:</strong> distance, duration, elevation gain, activity type (running/cycling), date and time, heart rate, GPS coordinates (for city geolocation)",
            "<strong>Training statistics:</strong> weekly, monthly and yearly totals",
            "<strong>Events:</strong> races you participated in"
          ]
        },
        {
          title: "3. How We Use Your Data",
          text: "Your data is used exclusively to:",
          list: [
            "Display your training statistics (distance, elevation, time)",
            "Calculate and award performance badges (Marathon, Ultra, etc.)",
            "Manage challenges with friends",
            "Configure your heart rate zones",
            "Display your activity feed and your friends' feed",
            "Locate cities where you trained",
            "Analyze your performance with detailed charts"
          ]
        },
        {
          title: "4. Data Storage and Security",
          items: [
            {
              subtitle: "Storage:",
              text: "Your data is securely stored on our servers and is only kept as long as your account is active."
            },
            {
              subtitle: "Security:",
              text: "We use industry-standard security measures to protect your data, including HTTPS encryption and secure storage of authentication tokens."
            },
            {
              subtitle: "Access:",
              text: "Only you have access to your personal data via your account. Administrators can only see aggregated and anonymized data."
            }
          ]
        },
        {
          title: "5. Data Sharing",
          highlight: "We NEVER sell your data to third parties.",
          text: "Your data may be visible to:",
          list: [
            "<strong>Your friends on the app:</strong> If they've added you as a friend, they can see your activity feed and public statistics (similar to Strava)",
            "<strong>Challenges:</strong> Challenge participants can see your progress on that specific challenge"
          ],
          footer: "We do not share your data with any other entity, except when legally required."
        },
        {
          title: "6. Your Rights (GDPR)",
          text: "In accordance with GDPR, you have the following rights:",
          list: [
            "<strong>Right of access:</strong> View all your data via your profile",
            "<strong>Right of rectification:</strong> Modify your profile information",
            "<strong>Right to erasure:</strong> Delete your account and all your data",
            "<strong>Right to data portability:</strong> Export your data (all your activities are synced from Strava)",
            "<strong>Right to withdraw consent:</strong> Revoke access to your Strava account at any time via Strava settings"
          ]
        },
        {
          title: "7. Account Deletion",
          text: "You can delete your account at any time by:",
          list: [
            "Revoking \"Strava Gamification\" access in your Strava settings → Connected Apps",
            "Contacting us directly to permanently delete all your data from our servers"
          ],
          footer: "Once your account is deleted, all your data will be permanently erased from our servers within a maximum of 30 days."
        },
        {
          title: "8. Cookies and Similar Technologies",
          text: "We only use essential cookies for:",
          list: [
            "Maintaining your logged-in session",
            "Storing your sport filter preferences (running/cycling)"
          ],
          footer: "No tracking or advertising cookies are used."
        },
        {
          title: "9. Third-Party Services",
          items: [
            {
              subtitle: "Strava API:",
              text: "Our application uses the official Strava API. See <a href='https://www.strava.com/legal/privacy' target='_blank' rel='noopener noreferrer' class='text-blue-600 hover:underline'>Strava's privacy policy</a> for more information."
            },
            {
              subtitle: "OpenCage Geocoding API:",
              text: "Used only to convert GPS coordinates to city names. No personal data is sent to this service."
            }
          ]
        },
        {
          title: "10. Changes to This Policy",
          text: "We may update this privacy policy occasionally. The \"last updated\" date at the top of this page indicates when this policy was last revised. We encourage you to review this page regularly."
        },
        {
          title: "11. Contact",
          text: "For any questions regarding this privacy policy or to exercise your rights, contact us at:",
          contact: "Email: privacy@strava-gamification.com"
        }
      ],

      summary: {
        title: "📋 Summary",
        items: [
          "✅ <strong>Your Strava data is used only to display your stats and manage app features</strong>",
          "✅ <strong>We NEVER sell your data</strong>",
          "✅ <strong>You can delete your account at any time</strong>",
          "✅ <strong>Data stored securely</strong>",
          "✅ <strong>Full GDPR compliance</strong>"
        ]
      }
    },

    fr: {
      title: "Politique de Confidentialité",
      lastUpdate: "Dernière mise à jour : 27 décembre 2025",
      backToHome: "← Retour à l'accueil",

      sections: [
        {
          title: "1. Introduction",
          text: "Strava Gamification (\"nous\", \"notre\" ou \"l'application\") respecte votre vie privée et s'engage à protéger vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre application."
        },
        {
          title: "2. Données Collectées",
          text: "Nous collectons les données suivantes via l'API Strava après votre autorisation explicite :",
          list: [
            "<strong>Informations de profil :</strong> nom, prénom, photo de profil, sexe",
            "<strong>Activités sportives :</strong> distance, durée, dénivelé, type d'activité (course/vélo), date et heure, fréquence cardiaque, coordonnées GPS (pour géolocalisation des villes)",
            "<strong>Statistiques d'entraînement :</strong> totaux hebdomadaires, mensuels et annuels",
            "<strong>Événements :</strong> courses auxquelles vous avez participé"
          ]
        },
        {
          title: "3. Utilisation des Données",
          text: "Vos données sont utilisées exclusivement pour :",
          list: [
            "Afficher vos statistiques d'entraînement (distance, dénivelé, temps)",
            "Calculer et attribuer des badges de performance (Marathon, Ultra, etc.)",
            "Gérer les challenges entre amis",
            "Configurer vos zones de fréquence cardiaque",
            "Afficher votre feed d'activités et celui de vos amis",
            "Localiser les villes où vous vous êtes entraîné",
            "Analyser vos performances avec des graphiques détaillés"
          ]
        },
        {
          title: "4. Stockage et Sécurité",
          items: [
            {
              subtitle: "Stockage :",
              text: "Vos données sont stockées de manière sécurisée sur nos serveurs et ne sont conservées que tant que votre compte est actif."
            },
            {
              subtitle: "Sécurité :",
              text: "Nous utilisons des mesures de sécurité standard de l'industrie pour protéger vos données, incluant le chiffrement HTTPS et le stockage sécurisé des tokens d'authentification."
            },
            {
              subtitle: "Accès :",
              text: "Seul vous avez accès à vos données personnelles via votre compte. Les administrateurs ne peuvent voir que des données agrégées et anonymisées."
            }
          ]
        },
        {
          title: "5. Partage des Données",
          highlight: "Nous ne vendons JAMAIS vos données à des tiers.",
          text: "Vos données peuvent être visibles par :",
          list: [
            "<strong>Vos amis sur l'application :</strong> S'ils vous ont ajouté comme ami, ils peuvent voir votre feed d'activités et vos statistiques publiques (similaire à Strava)",
            "<strong>Challenges :</strong> Les participants d'un challenge peuvent voir votre progression sur ce challenge spécifique"
          ],
          footer: "Nous ne partageons vos données avec aucune autre entité, sauf obligation légale."
        },
        {
          title: "6. Vos Droits (RGPD)",
          text: "Conformément au RGPD, vous disposez des droits suivants :",
          list: [
            "<strong>Droit d'accès :</strong> Consulter toutes vos données via votre profil",
            "<strong>Droit de rectification :</strong> Modifier vos informations de profil",
            "<strong>Droit à l'effacement :</strong> Supprimer votre compte et toutes vos données",
            "<strong>Droit à la portabilité :</strong> Exporter vos données (toutes vos activités sont synchronisées depuis Strava)",
            "<strong>Droit de révocation :</strong> Révoquer l'accès à votre compte Strava à tout moment via les paramètres Strava"
          ]
        },
        {
          title: "7. Suppression de Compte",
          text: "Vous pouvez supprimer votre compte à tout moment en :",
          list: [
            "Révoquant l'accès de \"Strava Gamification\" dans vos paramètres Strava → Applications Connectées",
            "Nous contactant directement pour supprimer définitivement toutes vos données de nos serveurs"
          ],
          footer: "Une fois votre compte supprimé, toutes vos données seront définitivement effacées de nos serveurs dans un délai de 30 jours maximum."
        },
        {
          title: "8. Cookies et Technologies Similaires",
          text: "Nous utilisons uniquement des cookies essentiels pour :",
          list: [
            "Maintenir votre session connectée",
            "Stocker vos préférences de filtre sportif (course/vélo)"
          ],
          footer: "Aucun cookie de tracking ou publicitaire n'est utilisé."
        },
        {
          title: "9. Services Tiers",
          items: [
            {
              subtitle: "Strava API :",
              text: "Notre application utilise l'API officielle Strava. Consultez la <a href='https://www.strava.com/legal/privacy' target='_blank' rel='noopener noreferrer' class='text-blue-600 hover:underline'>politique de confidentialité de Strava</a> pour plus d'informations."
            },
            {
              subtitle: "OpenCage Geocoding API :",
              text: "Utilisée uniquement pour convertir les coordonnées GPS en noms de villes. Aucune donnée personnelle n'est envoyée à ce service."
            }
          ]
        },
        {
          title: "10. Modifications de cette Politique",
          text: "Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. La date de \"dernière mise à jour\" en haut de cette page indique quand cette politique a été révisée pour la dernière fois. Nous vous encourageons à consulter régulièrement cette page."
        },
        {
          title: "11. Contact",
          text: "Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous à :",
          contact: "Email : privacy@strava-gamification.com"
        }
      ],

      summary: {
        title: "📋 Résumé",
        items: [
          "✅ <strong>Vos données Strava sont utilisées uniquement pour afficher vos stats et gérer les fonctionnalités de l'app</strong>",
          "✅ <strong>Nous ne vendons JAMAIS vos données</strong>",
          "✅ <strong>Vous pouvez supprimer votre compte à tout moment</strong>",
          "✅ <strong>Données stockées de manière sécurisée</strong>",
          "✅ <strong>Conformité RGPD complète</strong>"
        ]
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                language === 'fr'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🇫🇷 Français
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t.lastUpdate}
          </p>

          <div className="space-y-8 text-gray-700">
            {t.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>

                {section.text && (
                  <p className="leading-relaxed mb-3">{section.text}</p>
                )}

                {section.highlight && (
                  <p className="leading-relaxed mb-3">
                    <strong className="text-green-700">{section.highlight}</strong>
                  </p>
                )}

                {section.list && (
                  <ul className="list-disc pl-6 space-y-2">
                    {section.list.map((item, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                )}

                {section.items && (
                  <div className="space-y-3">
                    {section.items.map((item, i) => (
                      <p key={i} className="leading-relaxed">
                        <strong>{item.subtitle}</strong> <span dangerouslySetInnerHTML={{ __html: item.text }} />
                      </p>
                    ))}
                  </div>
                )}

                {section.footer && (
                  <p className="leading-relaxed mt-3">{section.footer}</p>
                )}

                {section.contact && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{section.contact}</p>
                  </div>
                )}
              </section>
            ))}

            {/* Summary */}
            <section className="border-t-2 border-gray-200 pt-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t.summary.title}
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                {t.summary.items.map((item, i) => (
                  <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t.backToHome}
          </a>
        </div>
      </div>
    </div>
  );
}
