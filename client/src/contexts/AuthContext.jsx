import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au démarrage
    const checkAuth = async () => {
      if (authApi.isAuthenticated()) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Auth check error:', error);
          authApi.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (code) => {
    try {
      const data = await authApi.login(code);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    authApi.logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
