import { createContext, useContext, useState, useEffect } from 'react';
import { stravaApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les tokens du localStorage au démarrage
    const storedAccessToken = localStorage.getItem('strava_access_token');
    const storedRefreshToken = localStorage.getItem('strava_refresh_token');
    const storedUser = localStorage.getItem('strava_user');

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (code) => {
    try {
      const data = await stravaApi.exchangeToken(code);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);

      // Récupérer les infos de l'athlète
      const athlete = await stravaApi.getAthlete(data.access_token);
      setUser(athlete);

      // Sauvegarder dans le localStorage
      localStorage.setItem('strava_access_token', data.access_token);
      localStorage.setItem('strava_refresh_token', data.refresh_token);
      localStorage.setItem('strava_user', JSON.stringify(athlete));

      return athlete;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('strava_access_token');
    localStorage.removeItem('strava_refresh_token');
    localStorage.removeItem('strava_user');
  };

  const refresh = async () => {
    try {
      const data = await stravaApi.refreshToken(refreshToken);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem('strava_access_token', data.access_token);
      localStorage.setItem('strava_refresh_token', data.refresh_token);
    } catch (error) {
      console.error('Refresh token error:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refresh, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
