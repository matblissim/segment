export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Dernière mise à jour : 27 décembre 2025
          </p>

          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                Strava Gamification ("nous", "notre" ou "l'application") respecte votre vie privée et s'engage à protéger vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre application.
              </p>
            </section>

            {/* Données collectées */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Données Collectées
              </h2>
              <p className="leading-relaxed mb-3">
                Nous collectons les données suivantes via l'API Strava après votre autorisation explicite :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Informations de profil :</strong> nom, prénom, photo de profil, sexe</li>
                <li><strong>Activités sportives :</strong> distance, durée, dénivelé, type d'activité (course/vélo), date et heure, fréquence cardiaque, coordonnées GPS (pour géolocalisation des villes)</li>
                <li><strong>Statistiques d'entraînement :</strong> totaux hebdomadaires, mensuels et annuels</li>
                <li><strong>Événements :</strong> courses auxquelles vous avez participé</li>
              </ul>
            </section>

            {/* Utilisation des données */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Utilisation des Données
              </h2>
              <p className="leading-relaxed mb-3">
                Vos données sont utilisées exclusivement pour :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Afficher vos statistiques d'entraînement (distance, dénivelé, temps)</li>
                <li>Calculer et attribuer des badges de performance (Marathon, Ultra, etc.)</li>
                <li>Gérer les challenges entre amis</li>
                <li>Configurer vos zones de fréquence cardiaque</li>
                <li>Afficher votre feed d'activités et celui de vos amis</li>
                <li>Localiser les villes où vous vous êtes entraîné</li>
                <li>Analyser vos performances avec des graphiques détaillés</li>
              </ul>
            </section>

            {/* Stockage et sécurité */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Stockage et Sécurité
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong>Stockage :</strong> Vos données sont stockées de manière sécurisée sur nos serveurs et ne sont conservées que tant que votre compte est actif.
                </p>
                <p className="leading-relaxed">
                  <strong>Sécurité :</strong> Nous utilisons des mesures de sécurité standard de l'industrie pour protéger vos données, incluant le chiffrement HTTPS et le stockage sécurisé des tokens d'authentification.
                </p>
                <p className="leading-relaxed">
                  <strong>Accès :</strong> Seul vous avez accès à vos données personnelles via votre compte. Les administrateurs ne peuvent voir que des données agrégées et anonymisées.
                </p>
              </div>
            </section>

            {/* Partage des données */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Partage des Données
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong className="text-green-700">Nous ne vendons JAMAIS vos données à des tiers.</strong>
                </p>
                <p className="leading-relaxed">
                  Vos données peuvent être visibles par :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Vos amis sur l'application :</strong> S'ils vous ont ajouté comme ami, ils peuvent voir votre feed d'activités et vos statistiques publiques (similaire à Strava)</li>
                  <li><strong>Challenges :</strong> Les participants d'un challenge peuvent voir votre progression sur ce challenge spécifique</li>
                </ul>
                <p className="leading-relaxed mt-3">
                  Nous ne partageons vos données avec aucune autre entité, sauf obligation légale.
                </p>
              </div>
            </section>

            {/* Vos droits */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Vos Droits (RGPD)
              </h2>
              <p className="leading-relaxed mb-3">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Droit d'accès :</strong> Consulter toutes vos données via votre profil</li>
                <li><strong>Droit de rectification :</strong> Modifier vos informations de profil</li>
                <li><strong>Droit à l'effacement :</strong> Supprimer votre compte et toutes vos données</li>
                <li><strong>Droit à la portabilité :</strong> Exporter vos données (toutes vos activités sont synchronisées depuis Strava)</li>
                <li><strong>Droit de révocation :</strong> Révoquer l'accès à votre compte Strava à tout moment via les paramètres Strava</li>
              </ul>
            </section>

            {/* Suppression du compte */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Suppression de Compte
              </h2>
              <p className="leading-relaxed">
                Vous pouvez supprimer votre compte à tout moment en :
              </p>
              <ol className="list-decimal pl-6 space-y-2 mt-3">
                <li>Révoquant l'accès de "Strava Gamification" dans vos paramètres Strava → Applications Connectées</li>
                <li>Nous contactant directement pour supprimer définitivement toutes vos données de nos serveurs</li>
              </ol>
              <p className="leading-relaxed mt-3">
                Une fois votre compte supprimé, toutes vos données seront définitivement effacées de nos serveurs dans un délai de 30 jours maximum.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Cookies et Technologies Similaires
              </h2>
              <p className="leading-relaxed">
                Nous utilisons uniquement des cookies essentiels pour :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Maintenir votre session connectée</li>
                <li>Stocker vos préférences de filtre sportif (course/vélo)</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Aucun cookie de tracking ou publicitaire n'est utilisé.
              </p>
            </section>

            {/* Services tiers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Services Tiers
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong>Strava API :</strong> Notre application utilise l'API officielle Strava. Consultez la <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">politique de confidentialité de Strava</a> pour plus d'informations.
                </p>
                <p className="leading-relaxed">
                  <strong>OpenCage Geocoding API :</strong> Utilisée uniquement pour convertir les coordonnées GPS en noms de villes. Aucune donnée personnelle n'est envoyée à ce service.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Modifications de cette Politique
              </h2>
              <p className="leading-relaxed">
                Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. La date de "dernière mise à jour" en haut de cette page indique quand cette politique a été révisée pour la dernière fois. Nous vous encourageons à consulter régulièrement cette page.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Contact
              </h2>
              <p className="leading-relaxed">
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous à :
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">Email : privacy@strava-gamification.com</p>
              </div>
            </section>

            {/* Résumé */}
            <section className="border-t-2 border-gray-200 pt-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                📋 Résumé
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="leading-relaxed">
                  ✅ <strong>Vos données Strava sont utilisées uniquement pour afficher vos stats et gérer les fonctionnalités de l'app</strong>
                </p>
                <p className="leading-relaxed">
                  ✅ <strong>Nous ne vendons JAMAIS vos données</strong>
                </p>
                <p className="leading-relaxed">
                  ✅ <strong>Vous pouvez supprimer votre compte à tout moment</strong>
                </p>
                <p className="leading-relaxed">
                  ✅ <strong>Données stockées de manière sécurisée</strong>
                </p>
                <p className="leading-relaxed">
                  ✅ <strong>Conformité RGPD complète</strong>
                </p>
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
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
