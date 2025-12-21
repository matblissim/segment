import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Spinner,
  Badge
} from '@material-tailwind/react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  BellAlertIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { friendsApi } from '../services/api';
import FriendCard from '../components/FriendCard';
import FriendSearch from '../components/FriendSearch';
import FriendsLeaderboard from '../components/FriendsLeaderboard';
import Layout from '../components/Layout';

export default function Friends() {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    {
      label: 'Mes amis',
      value: 'friends',
      icon: UserGroupIcon,
    },
    {
      label: 'Reçues',
      value: 'pending',
      icon: BellAlertIcon,
      badge: pendingRequests.length,
    },
    {
      label: 'Envoyées',
      value: 'sent',
      icon: PaperAirplaneIcon,
      badge: sentRequests.length,
    },
    {
      label: 'Chercher',
      value: 'search',
      icon: MagnifyingGlassIcon,
    },
  ];

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadSentRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await friendsApi.getFriends();
      setFriends(data.friends);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Erreur lors du chargement des amis');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await friendsApi.getPendingRequests();
      setPendingRequests(data.requests);
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  };

  const loadSentRequests = async () => {
    try {
      const data = await friendsApi.getSentRequests();
      setSentRequests(data.requests);
    } catch (err) {
      console.error('Error loading sent requests:', err);
    }
  };

  const handleAction = async (action, friendshipId) => {
    try {
      switch (action) {
        case 'accept':
          await friendsApi.acceptRequest(friendshipId);
          await loadFriends();
          await loadPendingRequests();
          break;

        case 'reject':
          await friendsApi.rejectRequest(friendshipId);
          await loadPendingRequests();
          break;

        case 'remove':
          if (confirm('Êtes-vous sûr de vouloir retirer cet ami ?')) {
            await friendsApi.removeFriend(friendshipId);
            await loadFriends();
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('Error performing action:', err);
      alert('Une erreur est survenue');
    }
  };

  const handleRequestSent = () => {
    // Rafraîchir la liste des demandes envoyées
    loadSentRequests();
  };

  if (loading && activeTab === 'friends') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Typography variant="h3" color="blue-gray" className="mb-2">
            Amis
          </Typography>
          <Typography variant="paragraph" color="gray">
            Gérez vos amis et retrouvez vos partenaires d'entraînement
          </Typography>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2/3 of the width on large screens */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody>
                <Tabs value={activeTab} onChange={(value) => setActiveTab(value)}>
                  <TabsHeader
                    className="rounded-none border-b border-blue-gray-50 bg-transparent p-0"
                    indicatorProps={{
                      className: "bg-transparent border-b-2 border-blue-500 shadow-none rounded-none",
                    }}
                  >
                    {tabs.map(({ label, value, icon: Icon, badge }) => (
                      <Tab
                        key={value}
                        value={value}
                        onClick={() => setActiveTab(value)}
                        className={activeTab === value ? "text-blue-500" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          {label}
                          {badge > 0 && (
                            <Badge content={badge} className="min-w-[20px] min-h-[20px]">
                              <span></span>
                            </Badge>
                          )}
                        </div>
                      </Tab>
                    ))}
                  </TabsHeader>

                  <TabsBody>
                    {/* Onglet Mes amis */}
                    <TabPanel value="friends" className="p-0 pt-6">
                      {error && (
                        <Typography variant="small" color="red" className="mb-4">
                          {error}
                        </Typography>
                      )}

                      {friends.length === 0 ? (
                        <div className="text-center py-12">
                          <UserGroupIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <Typography variant="h6" color="gray">
                            Vous n'avez pas encore d'amis
                          </Typography>
                          <Typography variant="small" color="gray" className="mt-2">
                            Utilisez l'onglet "Chercher" pour ajouter des amis
                          </Typography>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {friends.map((friend) => (
                            <FriendCard
                              key={friend.id}
                              friend={friend}
                              type="friend"
                              onAction={handleAction}
                            />
                          ))}
                        </div>
                      )}
                    </TabPanel>

                    {/* Onglet Demandes reçues */}
                    <TabPanel value="pending" className="p-0 pt-6">
                      {pendingRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <BellAlertIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <Typography variant="h6" color="gray">
                            Aucune demande reçue
                          </Typography>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingRequests.map((request) => (
                            <FriendCard
                              key={request.id}
                              friend={request}
                              type="pending"
                              onAction={handleAction}
                            />
                          ))}
                        </div>
                      )}
                    </TabPanel>

                    {/* Onglet Demandes envoyées */}
                    <TabPanel value="sent" className="p-0 pt-6">
                      {sentRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <PaperAirplaneIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <Typography variant="h6" color="gray">
                            Aucune demande envoyée
                          </Typography>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sentRequests.map((request) => (
                            <FriendCard
                              key={request.id}
                              friend={request}
                              type="sent"
                              onAction={handleAction}
                            />
                          ))}
                        </div>
                      )}
                    </TabPanel>

                    {/* Onglet Recherche */}
                    <TabPanel value="search" className="p-0 pt-6">
                      <FriendSearch onRequestSent={handleRequestSent} />
                    </TabPanel>
                  </TabsBody>
                </Tabs>
              </CardBody>
            </Card>
          </div>

          {/* Leaderboard sidebar - 1/3 of the width on large screens */}
          <div className="lg:col-span-1">
            <FriendsLeaderboard />
          </div>
        </div>
      </div>
    </Layout>
  );
}
