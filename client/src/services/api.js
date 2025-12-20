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
};
