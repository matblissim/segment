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
  HomeIcon,
  RectangleStackIcon,
  TrophyIcon,
  UserGroupIcon,
  FireIcon,
  CalendarIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
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

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/activities', label: 'Activités', icon: RectangleStackIcon },
    { path: '/badges', label: 'Badges', icon: TrophyIcon },
    { path: '/friends', label: 'Amis', icon: UserGroupIcon },
    { path: '/challenges', label: 'Challenges', icon: FireIcon },
    { path: '/events', label: 'Événements', icon: CalendarIcon },
    { path: '/stats', label: 'Stats', icon: ChartBarIcon },
    { path: '/profile', label: 'Profil', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center sm:justify-between gap-3 py-3 sm:py-0">
            {/* Left: User info */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Avatar
                src={user?.profile_photo || 'https://via.placeholder.com/150'}
                alt={user?.firstname}
                size="sm"
                className="ring-2 ring-gray-200"
              />
              <div className="min-w-0 flex-1">
                <Typography variant="small" color="blue-gray" className="font-semibold truncate">
                  {user?.firstname} {user?.lastname}
                </Typography>
                <Typography variant="small" color="gray" className="font-normal text-xs">
                  {syncInfo?.activityCount || 0} activités
                </Typography>
              </div>
            </div>

            {/* Center: Sport Toggle - Show on larger screens */}
            {showSportToggle && (
              <div className="hidden sm:flex items-center gap-2 border-l border-r border-gray-200 px-4">
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

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {syncInfo && (
                <Chip
                  value={syncInfo.syncStatus === 'syncing' ? 'Sync...' : 'Sync OK'}
                  color={getSyncChipColor()}
                  variant="ghost"
                  size="sm"
                  className="capitalize hidden sm:inline-flex"
                />
              )}
              <Button
                size="sm"
                color="gray"
                variant="text"
                className="flex items-center gap-1 px-2"
                onClick={handleSync}
                disabled={syncing || syncInfo?.syncStatus === 'syncing'}
              >
                <ArrowPathIcon className={`h-4 w-4 ${syncing || syncInfo?.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </Button>
              <IconButton
                size="sm"
                color="gray"
                variant="text"
                onClick={logout}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </nav>

        {/* Sport Toggle - Mobile version */}
        {showSportToggle && (
          <div className="sm:hidden mx-auto max-w-7xl px-2 pb-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                color="gray"
                variant={sportFilter === 'running' ? 'filled' : 'outlined'}
                onClick={() => setSportFilter('running')}
                className="normal-case flex-1"
              >
                🏃 Course
              </Button>
              <Button
                size="sm"
                color="gray"
                variant={sportFilter === 'cycling' ? 'filled' : 'outlined'}
                onClick={() => setSportFilter('cycling')}
                className="normal-case flex-1"
              >
                🚴 Vélo
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Mobile-friendly */}
        <div className="mx-auto max-w-7xl px-1 sm:px-4 lg:px-8 border-t border-gray-200">
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} className="flex-shrink-0">
                  <Button
                    color="gray"
                    variant="text"
                    size="sm"
                    className={`rounded-none px-2 sm:px-4 min-w-0 ${active ? 'border-b-2 border-gray-900' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
                      <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
                      <span className="text-[10px] sm:text-sm whitespace-nowrap">{item.label}</span>
                    </div>
                  </Button>
                </Link>
              );
            })}
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex-shrink-0">
                <Button
                  color="gray"
                  variant="text"
                  size="sm"
                  className={`rounded-none px-2 sm:px-4 min-w-0 ${isActive('/admin') ? 'border-b-2 border-gray-900' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
                    <Cog6ToothIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-sm whitespace-nowrap">Admin</span>
                  </div>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
