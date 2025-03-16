import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface ActivityLog {
  id: string;
  date: string;
  duration: number;
  distance: number | null;
  notes: string | null;
  activity: {
    name: string;
    category: string;
  };
}

interface Profile {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  disability: string | null;
  pfpUrl: string | null;
}

interface FriendRequest {
  id: string;
  sender: {
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
    disability: string | null;
    pfpUrl: string | null;
  };
  receiver: {
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
    disability: string | null;
    pfpUrl: string | null;
  };
  status: string;
  created_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalDuration: 0,
    totalDistance: 0,
    friendsCount: 0,
  });
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchRecentActivityLogs();
  }, []);

  useEffect(() => {
    if (showFriendRequests) {
      fetchFriendRequests();
    }
  }, [showFriendRequests]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      console.log('Profile data:', profileData); // Add this for debugging
      setProfile(profileData);

      // Fetch friends count
      const { count: friendsCount, error: friendsError } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendsError) throw friendsError;

      setStats(prev => ({
        ...prev,
        friendsCount: friendsCount || 0
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRecentActivityLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          activity:activity_id (
            name,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentLogs(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const totalDuration = data.reduce((sum, log) => sum + log.duration, 0);
        const totalDistance = data.reduce((sum, log) => sum + (log.distance || 0), 0);

        setStats({
          totalActivities: data.length,
          totalDuration,
          totalDistance: Number(totalDistance.toFixed(2)),
          friendsCount: stats.friendsCount,
        });
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          status,
          created_at,
          sender:profiles!friend_requests_sender_id_fkey (
            id,
            name,
            age,
            gender,
            disability,
            pfpUrl:avatar_url
          ),
          receiver:profiles!friend_requests_receiver_id_fkey (
            id,
            name,
            age,
            gender,
            disability,
            pfpUrl:avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match FriendRequest interface
      const transformedData: FriendRequest[] = (data || []).map((request: any) => ({
        id: request.id,
        status: request.status,
        created_at: request.created_at,
        sender: {
          id: request.sender.id,
          name: request.sender.name,
          age: request.sender.age,
          gender: request.sender.gender,
          disability: request.sender.disability,
          pfpUrl: request.sender.pfpUrl
        },
        receiver: {
          id: request.receiver.id,
          name: request.receiver.name,
          age: request.receiver.age,
          gender: request.receiver.gender,
          disability: request.receiver.disability,
          pfpUrl: request.receiver.pfpUrl
        }
      }));

      setFriendRequests(transformedData);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (accept) {
        // First create the friendship
        const request = friendRequests.find(r => r.id === requestId);
        if (!request) return;

        const { error: friendshipError } = await supabase
          .from('friendships')
          .insert({
            user1_id: request.sender.id,
            user2_id: user.id,
            created_at: new Date().toISOString()
          });

        if (friendshipError) throw friendshipError;
      }

      // Update the request status
      const { error: requestError } = await supabase
        .from('friend_requests')
        .update({ 
          status: accept ? 'accepted' : 'rejected'
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Remove the request from the list
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));

      // Update friends count if accepted
      if (accept) {
        setStats(prev => ({
          ...prev,
          friendsCount: prev.friendsCount + 1
        }));
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      Alert.alert('Error', 'Failed to process friend request');
    }
  };

  const renderFriendRequestsModal = () => (
    <Modal
      visible={showFriendRequests}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFriendRequests(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Friend Requests</Text>
            <TouchableOpacity 
              onPress={() => setShowFriendRequests(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loadingRequests ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4B7BF5" />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : friendRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No pending friend requests</Text>
            </View>
          ) : (
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <View style={styles.requestProfile}>
                    {item.sender.pfpUrl ? (
                      <Image
                        source={{ uri: item.sender.pfpUrl }}
                        style={styles.requestAvatar}
                      />
                    ) : (
                      <View style={[styles.requestAvatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>{item.sender.name[0]}</Text>
                      </View>
                    )}
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{item.sender.name}</Text>
                      <Text style={styles.requestTime}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.acceptButton]}
                      onPress={() => handleFriendRequest(item.id, true)}
                    >
                      <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.rejectButton]}
                      onPress={() => handleFriendRequest(item.id, false)}
                    >
                      <Text style={[styles.buttonText, styles.rejectText]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.requestsList}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B7BF5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.pfpUrl ? (
              <Image
                source={{ uri: profile.pfpUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile?.name || 'Anonymous User'}</Text>
          <Text style={styles.username}>@{profile?.name?.split(' ')[0].toLowerCase() || 'user'}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(stats.totalDuration / 60)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalDistance}</Text>
            <Text style={styles.statLabel}>Kilometers</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/friendsList')}
          >
            <Text style={styles.statValue}>{stats.friendsCount}</Text>
            <Text style={[styles.statLabel, styles.clickableLabel]}>Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Add this after the stats container */}
        <TouchableOpacity
          style={styles.friendRequestsButton}
          onPress={() => setShowFriendRequests(true)}
        >
          <Ionicons name="people" size={24} color="#4B7BF5" />
          <Text style={styles.friendRequestsText}>Friend Requests</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No activities logged yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tracking your fitness journey today!
              </Text>
            </View>
          ) : (
            recentLogs.map((log) => (
              <TouchableOpacity
                key={log.id}
                style={styles.activityItem}
                onPress={() => router.push({
                  pathname: '/activityLogDetail',
                  params: { id: log.id }
                })}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{log.activity.name}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(log.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.activityStats}>
                    <View style={styles.statRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.statText}>{log.duration}m</Text>
                    </View>
                    {log.distance && (
                      <View style={styles.statRow}>
                        <Ionicons name="map-outline" size={16} color="#666" />
                        <Text style={styles.statText}>{log.distance}km</Text>
                      </View>
                    )}
                  </View>
                </View>
                {log.notes && (
                  <Text style={styles.activityNotes} numberOfLines={2}>
                    {log.notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {renderFriendRequestsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#4B7BF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activityNotes: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  friendRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  friendRequestsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  arrowContainer: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  requestsList: {
    padding: 16,
  },
  requestItem: {
    paddingVertical: 12,
  },
  requestProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  requestInfo: {
    marginLeft: 12,
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  requestTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4B7BF5',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rejectText: {
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  clickableLabel: {
    color: '#4B7BF5',
  },
});
