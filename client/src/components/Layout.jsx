import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSportFilter } from '../contexts/SportFilterContext';
import { syncApi } from '../services/api';
import { useState, useEffect } from 'react';
import {
  Avatar,
  IconButton,
  Button,
  Chip,
  Typography,
} from "@material-tailwind/react";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";

export default function Layout({ children, showSportToggle = true }) {
  const { user, logout } = useAuth();
  const { sportFilter, setSportFilter } = useSportFilter();
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    try {
      const info = await syncApi.getSyncInfo();
      setSyncInfo(info);

      if (info.syncStatus === 'syncing') {
        setTimeout(loadSyncInfo, 5000);
      }
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncApi.startSync(false);

      setTimeout(async () => {
        await loadSyncInfo();
        setSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('Error starting sync:', error);
      setSyncing(false);
      alert('Erreur lors de la synchronisation');
    }
  };

  const getSyncChipColor = () => {
    if (!syncInfo) return "gray";
    const colors = {
      syncing: "blue-gray",
      completed: "gray",
      failed: "gray",
      pending: "gray",
    };
    return colors[syncInfo.syncStatus] || "gray";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.profile || 'https://via.placeholder.com/150'}
                alt={user?.firstname}
                size="md"
                className="ring-2 ring-gray-200"
              />
              <div>
                <Typography variant="h6" color="blue-gray">
                  {user?.firstname} {user?.lastname}
                </Typography>
                <Typography variant="small" color="gray" className="font-normal">
                  {syncInfo?.activityCount || 0} activités
                </Typography>
              </div>
            </div>

            {/* Sport Toggle - Only show on certain pages */}
            {showSportToggle && (
              <div className="flex items-center gap-2 border-l border-r border-gray-200 px-4">
                <Button
                  size="sm"
                  color="gray"
                  variant={sportFilter === 'running' ? 'filled' : 'outlined'}
                  onClick={() => setSportFilter('running')}
                  className="normal-case"
                >
                  Course
                </Button>
                <Button
                  size="sm"
                  color="gray"
                  variant={sportFilter === 'cycling' ? 'filled' : 'outlined'}
                  onClick={() => setSportFilter('cycling')}
                  className="normal-case"
                >
                  Vélo
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {syncInfo && (
                <Chip
                  value={syncInfo.syncStatus === 'syncing' ? 'Sync...' : 'Sync OK'}
                  color={getSyncChipColor()}
                  variant="ghost"
                  className="capitalize"
                />
              )}
              <Button
                size="sm"
                color="gray"
                variant="text"
                className="flex items-center gap-2"
                onClick={handleSync}
                disabled={syncing || syncInfo?.syncStatus === 'syncing'}
              >
                <ArrowPathIcon className={`h-4 w-4 ${syncing || syncInfo?.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <IconButton
                size="sm"
                color="gray"
                variant="text"
                onClick={logout}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="flex gap-1">
            <Link to="/dashboard">
              <Button
                color="gray"
                variant="text"
                size="sm"
                className={`rounded-none ${isActive('/dashboard') ? 'border-b-2 border-gray-900' : ''}`}
              >
                Tableau de bord
              </Button>
            </Link>
            <Link to="/activities">
              <Button
                color="gray"
                variant="text"
                size="sm"
                className={`rounded-none ${isActive('/activities') ? 'border-b-2 border-gray-900' : ''}`}
              >
                Activités
              </Button>
            </Link>
            <Link to="/badges">
              <Button
                color="gray"
                variant="text"
                size="sm"
                className={`rounded-none ${isActive('/badges') ? 'border-b-2 border-gray-900' : ''}`}
              >
                Badges
              </Button>
            </Link>
            <Link to="/stats">
              <Button
                color="gray"
                variant="text"
                size="sm"
                className={`rounded-none ${isActive('/stats') ? 'border-b-2 border-gray-900' : ''}`}
              >
                Statistiques
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                color="gray"
                variant="text"
                size="sm"
                className={`rounded-none ${isActive('/profile') ? 'border-b-2 border-gray-900' : ''}`}
              >
                Profil
              </Button>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin">
                <Button
                  color="gray"
                  variant="text"
                  size="sm"
                  className={`rounded-none ${isActive('/admin') ? 'border-b-2 border-gray-900' : ''}`}
                >
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
