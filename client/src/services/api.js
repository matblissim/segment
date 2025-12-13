import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Strava API
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
  calculateStats: async (activities) => {
    const response = await axios.post(`${API_BASE_URL}/gamification/calculate-stats`, { activities });
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
