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
  Drawer,
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
  Bars3Icon,
  XMarkIcon,
  NewspaperIcon,
} from "@heroicons/react/24/solid";

export default function Layout({ children, showSportToggle = true }) {
  const { user, logout } = useAuth();
  const { sportFilter, setSportFilter } = useSportFilter();
  const location = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Bottom Nav (4 items max - most important pages)
  const bottomNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/activities', label: 'Activités', icon: RectangleStackIcon },
    { path: '/challenges', label: 'Challenges', icon: FireIcon },
    { path: '/profile', label: 'Profil', icon: UserCircleIcon },
  ];

  // Burger Menu (secondary pages)
  const drawerMenuItems = [
    { path: '/badges', label: 'Badges', icon: TrophyIcon },
    { path: '/friends', label: 'Amis', icon: UserGroupIcon },
    { path: '/events', label: 'Événements', icon: CalendarIcon },
    { path: '/stats', label: 'Stats', icon: ChartBarIcon },
    { path: '/feed', label: 'Feed', icon: NewspaperIcon },
  ];

  // Desktop menu (all items)
  const desktopMenuItems = [
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
              {/* Burger Menu Icon - Mobile only */}
              <div className="md:hidden">
                <IconButton
                  size="sm"
                  color="gray"
                  variant="text"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Bars3Icon className="h-5 w-5" />
                </IconButton>
              </div>
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

        {/* Navigation Tabs - Desktop only */}
        <div className="hidden md:block mx-auto max-w-7xl px-4 lg:px-8 border-t border-gray-200">
          <div className="flex gap-1">
            {desktopMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    color="gray"
                    variant="text"
                    size="sm"
                    className={`rounded-none px-4 ${active ? 'border-b-2 border-gray-900' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm whitespace-nowrap">{item.label}</span>
                    </div>
                  </Button>
                </Link>
              );
            })}
            {user?.role === 'admin' && (
              <Link to="/admin">
                <Button
                  color="gray"
                  variant="text"
                  size="sm"
                  className={`rounded-none px-4 ${isActive('/admin') ? 'border-b-2 border-gray-900' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span className="text-sm whitespace-nowrap">Admin</span>
                  </div>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 py-4 sm:py-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Burger Menu Drawer - Mobile only */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        className="p-4"
        size={280}
      >
        <div className="flex items-center justify-between mb-6">
          <Typography variant="h5" color="blue-gray">
            Menu
          </Typography>
          <IconButton
            variant="text"
            color="gray"
            onClick={() => setDrawerOpen(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="flex flex-col gap-2">
          {drawerMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
              >
                <Button
                  color="gray"
                  variant={active ? "filled" : "text"}
                  className="w-full justify-start normal-case"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                </Button>
              </Link>
            );
          })}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setDrawerOpen(false)}
            >
              <Button
                color="gray"
                variant={isActive('/admin') ? "filled" : "text"}
                className="w-full justify-start normal-case"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span>Admin</span>
                </div>
              </Button>
            </Link>
          )}
        </div>
      </Drawer>

      {/* Bottom Navigation Bar - Mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1"
              >
                <button
                  className={`w-full flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors ${
                    active
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
