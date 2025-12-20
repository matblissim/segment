import { useState, useEffect } from 'react';
import { Input, Typography, Spinner } from '@material-tailwind/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { friendsApi } from '../services/api';
import FriendCard from './FriendCard';

export default function FriendSearch({ onRequestSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger tous les users au démarrage
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setLoading(true);
    setError('');

    try {
      // Recherche avec une chaîne vide pour obtenir tous les users
      const data = await friendsApi.searchUsers('');
      setResults(data.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);

    // Si la recherche est vide, afficher tous les users
    if (searchQuery.length === 0) {
      loadAllUsers();
      return;
    }

    // Sinon, chercher avec le query
    if (searchQuery.length < 2) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await friendsApi.searchUsers(searchQuery);
      setResults(data.users);
    } catch (err) {
      console.error('Search error:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendsApi.sendRequest(userId);
      // Mettre à jour le statut dans les résultats
      setResults(results.map(user =>
        user.id === userId
          ? { ...user, friendship_status: 'pending' }
          : user
      ));
      onRequestSent?.();
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Erreur lors de l\'envoi de la demande');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Input
          type="text"
          label="Chercher un utilisateur"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          className="!border-t-blue-gray-200"
        />
        {query.length > 0 && query.length < 2 && (
          <Typography variant="small" color="gray" className="mt-2">
            Tapez au moins 2 caractères pour chercher
          </Typography>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <Typography variant="small" color="red" className="text-center py-4">
          {error}
        </Typography>
      )}

      {!loading && results.length === 0 && query.length >= 2 && (
        <Typography variant="small" color="gray" className="text-center py-4">
          Aucun utilisateur trouvé
        </Typography>
      )}

      <div className="space-y-3">
        {results.map((user) => (
          <FriendCard
            key={user.id}
            friend={user}
            type="search"
            onAction={(action, userId) => {
              if (action === 'send') {
                handleSendRequest(userId);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
