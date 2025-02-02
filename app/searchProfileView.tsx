import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
}

type FriendshipStatus = 'not_friends' | 'pending' | 'friends';

export default function SearchProfileView() {
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('not_friends');
  const [friendStats, setFriendStats] = useState({
    activities: 0,
    following: 0,
    followers: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchFriendshipStatus();
    fetchFriendStats();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendshipStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('check_friendship_status', {
        user1: user.id,
        user2: userId
      });

      if (error) {
        console.error('Error checking friendship status:', error);
        return;
      }

      setFriendshipStatus(data as FriendshipStatus || 'not_friends');
    } catch (error) {
      console.error('Error fetching friendship status:', error);
    }
  };

  const fetchFriendStats = async () => {
    try {
      // Get friend count
      const { count: followingCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact' })
        .eq('user1_id', userId);

      const { count: followersCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact' })
        .eq('user2_id', userId);

      // Get activities count (you'll need to implement this based on your activities table)
      const activitiesCount = 0;

      setFriendStats({
        activities: activitiesCount,
        following: followingCount || 0,
        followers: followersCount || 0
      });
    } catch (error) {
      console.error('Error fetching friend stats:', error);
    }
  };

  const handleFriendRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to send friend requests');
        return;
      }

      const { error } = await supabase.rpc('send_friend_request', {
        sender: user.id,
        receiver: userId
      });

      if (error) throw error;

      setFriendshipStatus('pending');
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleCancelRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to cancel friend requests');
        return;
      }

      // Delete the friend request directly from the table
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .match({
          sender_id: user.id,
          receiver_id: userId
        });

      if (error) throw error;

      setFriendshipStatus('not_friends');
      Alert.alert('Success', 'Friend request cancelled!');
    } catch (error) {
      console.error('Error canceling friend request:', error);
      Alert.alert('Error', 'Failed to cancel friend request');
    }
  };

  const getFriendButtonText = () => {
    switch (friendshipStatus) {
      case 'friends':
        return 'Friends';
      case 'pending':
        return '• Pending';
      default:
        return 'Add Friend';
    }
  };

  const getFriendButtonStyle = () => {
    const baseStyle = styles.followButton;
    switch (friendshipStatus) {
      case 'friends':
        return [baseStyle, styles.friendsButton];
      case 'pending':
        return [baseStyle, styles.pendingButton];
      default:
        return baseStyle;
    }
  };

  const getFriendButtonTextStyle = () => {
    const baseStyle = styles.followButtonText;
    if (friendshipStatus === 'pending') {
      return [baseStyle, { color: '#FF9500' }];
    }
    return baseStyle;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendStats.activities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendStats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{friendStats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={getFriendButtonStyle()}
            onPress={handleFriendRequest}
            disabled={friendshipStatus === 'friends' || friendshipStatus === 'pending'}
          >
            <Text style={getFriendButtonTextStyle()}>
              {getFriendButtonText()}
            </Text>
          </TouchableOpacity>
          {friendshipStatus === 'pending' && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelRequest}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Age</Text>
          <Text style={styles.infoValue}>{profile.age}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Gender</Text>
          <Text style={styles.infoValue}>{profile.gender}</Text>
        </View>
        {/* Add more profile fields here as they become available */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
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
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  friendsButton: {
    backgroundColor: '#34C759',
  },
  pendingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
}); 