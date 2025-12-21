import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper pour ajouter le token JWT aux requêtes
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth API (nouvelle architecture)
export const authApi = {
  getAuthUrl: async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/strava/auth-url`);
    return response.data;
  },

  login: async (code) => {
    const response = await axios.post(`${API_BASE_URL}/auth/strava/callback`, { code });
    // Sauvegarder le JWT token
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
    }
    return response.data;
  },

  getMe: async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('jwt_token');
  },
};

// Activities API (nouvelle architecture - depuis BDD)
export const activitiesApi = {
  getActivities: async (limit = 30, offset = 0) => {
    const response = await axios.get(`${API_BASE_URL}/activities`, {
      headers: getAuthHeaders(),
      params: { limit, offset },
    });
    return response.data;
  },

  getAllActivities: async () => {
    const response = await axios.get(`${API_BASE_URL}/activities/all`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getWeeklyStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/activities/stats/weekly`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getYearlyStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/activities/stats/yearly`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getCount: async () => {
    const response = await axios.get(`${API_BASE_URL}/activities/count`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// Sync API (nouvelle architecture)
export const syncApi = {
  startSync: async (fullSync = false) => {
    const response = await axios.post(
      `${API_BASE_URL}/sync/start`,
      { fullSync },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getSyncInfo: async () => {
    const response = await axios.get(`${API_BASE_URL}/sync/info`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getJobStatus: async (jobId) => {
    const response = await axios.get(`${API_BASE_URL}/sync/status/${jobId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await axios.get(`${API_BASE_URL}/sync/history`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// Legacy Strava API (compatibilité)
export const stravaApi = {
  getAuthUrl: async () => {
    const response = await axios.get(`${API_BASE_URL}/strava/auth-url`);
    return response.data;
  },

  exchangeToken: async (code) => {
    const response = await axios.post(`${API_BASE_URL}/strava/exchange-token`, { code });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await axios.post(`${API_BASE_URL}/strava/refresh-token`, { refresh_token: refreshToken });
    return response.data;
  },

  getActivities: async (accessToken, perPage = 30, page = 1) => {
    const response = await axios.get(`${API_BASE_URL}/strava/activities`, {
      params: { access_token: accessToken, per_page: perPage, page }
    });
    return response.data;
  },

  getAthlete: async (accessToken) => {
    const response = await axios.get(`${API_BASE_URL}/strava/athlete`, {
      params: { access_token: accessToken }
    });
    return response.data;
  },

  getAthleteStats: async (accessToken, athleteId) => {
    const response = await axios.get(`${API_BASE_URL}/strava/athlete/stats/${athleteId}`, {
      params: { access_token: accessToken }
    });
    return response.data;
  }
};

// Gamification API
export const gamificationApi = {
  calculateStats: async () => {
    // Le backend récupère les activités depuis la DB avec le user ID du token
    const response = await axios.post(`${API_BASE_URL}/gamification/calculate-stats`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getBadges: async () => {
    const response = await axios.get(`${API_BASE_URL}/gamification/badges`);
    return response.data;
  },

  getChallenges: async () => {
    const response = await axios.get(`${API_BASE_URL}/gamification/challenges`);
    return response.data;
  },

  getLeaderboard: async (users) => {
    const response = await axios.post(`${API_BASE_URL}/gamification/leaderboard`, { users });
    return response.data;
  }
};

// Admin API (nécessite rôle admin)
export const adminApi = {
  getUsers: async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await axios.put(
      `${API_BASE_URL}/admin/users/${userId}/role`,
      { role },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  syncAllUsers: async () => {
    const response = await axios.post(
      `${API_BASE_URL}/admin/sync-all`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};

// Friends API (nécessite authentification)
export const friendsApi = {
  // Chercher des utilisateurs
  searchUsers: async (query) => {
    const response = await axios.get(`${API_BASE_URL}/friends/search`, {
      headers: getAuthHeaders(),
      params: { q: query },
    });
    return response.data;
  },

  // Obtenir la liste des amis
  getFriends: async () => {
    const response = await axios.get(`${API_BASE_URL}/friends`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les demandes reçues
  getPendingRequests: async () => {
    const response = await axios.get(`${API_BASE_URL}/friends/pending`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les demandes envoyées
  getSentRequests: async () => {
    const response = await axios.get(`${API_BASE_URL}/friends/sent`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer une demande d'ami
  sendRequest: async (friendId) => {
    const response = await axios.post(
      `${API_BASE_URL}/friends/request/${friendId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Accepter une demande
  acceptRequest: async (friendshipId) => {
    const response = await axios.post(
      `${API_BASE_URL}/friends/accept/${friendshipId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Rejeter une demande
  rejectRequest: async (friendshipId) => {
    const response = await axios.post(
      `${API_BASE_URL}/friends/reject/${friendshipId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Supprimer un ami
  removeFriend: async (friendshipId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/friends/remove/${friendshipId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Vérifier le statut d'amitié
  checkStatus: async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/friends/status/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir le classement des amis
  getLeaderboard: async (period = 'month', metric = 'distance', sportType = 'all') => {
    const response = await axios.get(`${API_BASE_URL}/friends/leaderboard`, {
      headers: getAuthHeaders(),
      params: { period, metric, sport_type: sportType },
    });
    return response.data;
  },
};

// Feed API (nécessite authentification)
export const feedApi = {
  // Obtenir le feed de l'utilisateur
  getFeed: async (limit = 50, offset = 0) => {
    const response = await axios.get(`${API_BASE_URL}/feed`, {
      headers: getAuthHeaders(),
      params: { limit, offset },
    });
    return response.data;
  },

  // Obtenir les détails d'une activité
  getActivityDetails: async (activityId) => {
    const response = await axios.get(`${API_BASE_URL}/feed/activity/${activityId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Liker une activité
  likeActivity: async (activityId) => {
    const response = await axios.post(
      `${API_BASE_URL}/feed/activity/${activityId}/like`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Retirer le like d'une activité
  unlikeActivity: async (activityId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/feed/activity/${activityId}/like`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Obtenir les likes d'une activité
  getActivityLikes: async (activityId) => {
    const response = await axios.get(
      `${API_BASE_URL}/feed/activity/${activityId}/likes`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Ajouter un commentaire
  addComment: async (activityId, comment) => {
    const response = await axios.post(
      `${API_BASE_URL}/feed/activity/${activityId}/comment`,
      { comment },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Modifier un commentaire
  updateComment: async (commentId, comment) => {
    const response = await axios.put(
      `${API_BASE_URL}/feed/comment/${commentId}`,
      { comment },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Supprimer un commentaire
  deleteComment: async (commentId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/feed/comment/${commentId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Obtenir les commentaires d'une activité
  getActivityComments: async (activityId) => {
    const response = await axios.get(
      `${API_BASE_URL}/feed/activity/${activityId}/comments`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Obtenir les notifications
  getNotifications: async (limit = 50, unreadOnly = false) => {
    const response = await axios.get(`${API_BASE_URL}/feed/notifications`, {
      headers: getAuthHeaders(),
      params: { limit, unread: unreadOnly },
    });
    return response.data;
  },

  // Marquer une notification comme lue
  markNotificationAsRead: async (notificationId) => {
    const response = await axios.put(
      `${API_BASE_URL}/feed/notifications/${notificationId}/read`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Marquer toutes les notifications comme lues
  markAllNotificationsAsRead: async () => {
    const response = await axios.put(
      `${API_BASE_URL}/feed/notifications/read-all`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};

// Events API (nécessite authentification)
export const eventsApi = {
  // Obtenir tous les événements
  getEvents: async () => {
    const response = await axios.get(`${API_BASE_URL}/events`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les événements par priorité (pour le dashboard)
  getEventsByPriority: async (priority) => {
    const response = await axios.get(`${API_BASE_URL}/events/priority/${priority}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Créer un événement
  createEvent: async (eventData) => {
    const response = await axios.post(
      `${API_BASE_URL}/events`,
      eventData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Participer à un événement
  participate: async (eventId, priority = 'B') => {
    const response = await axios.post(
      `${API_BASE_URL}/events/${eventId}/participate`,
      { priority },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Retirer sa participation
  unparticipate: async (eventId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/events/${eventId}/participate`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Obtenir les participants
  getParticipants: async (eventId) => {
    const response = await axios.get(
      `${API_BASE_URL}/events/${eventId}/participants`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Mettre à jour un événement
  updateEvent: async (eventId, updates) => {
    const response = await axios.put(
      `${API_BASE_URL}/events/${eventId}`,
      updates,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Supprimer un événement
  deleteEvent: async (eventId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/events/${eventId}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};
