import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Pressable,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  created_by: string;
  is_public: boolean;
  created_at: string;
}

type FriendshipStatus = 'not_friends' | 'pending' | 'friends';

interface FriendshipStatuses {
  [key: string]: FriendshipStatus;
}

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [activityResults, setActivityResults] = useState<Activity[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendshipStatuses, setFriendshipStatuses] = useState<FriendshipStatuses>({});
  const clearButtonOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (userResults.length > 0) {
      fetchFriendshipStatuses();
    }
  }, [userResults]);

  const loadRecentSearches = async () => {
    try {
      const savedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updatedSearches = [
        query,
        ...recentSearches.filter(search => search !== query)
      ].slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const fetchFriendshipStatuses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const statuses: FriendshipStatuses = {};
      for (const result of userResults) {
        const { data, error } = await supabase.rpc('check_friendship_status', {
          user1: user.id,
          user2: result.id
        });

        if (error) {
          console.error('Error checking friendship status:', error);
          continue;
        }
        
        if (data !== null) {
          statuses[result.id] = data as FriendshipStatus;
        } else {
          statuses[result.id] = 'not_friends';
        }
      }
      setFriendshipStatuses(statuses);
    } catch (error) {
      console.error('Error fetching friendship status:', error);
    }
  };

  const handleFriendRequest = async (receiverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to send friend requests');
        return;
      }

      const { error } = await supabase.rpc('send_friend_request', {
        sender: user.id,
        receiver: receiverId
      });

      if (error) throw error;

      // Update local state immediately
      setFriendshipStatuses(prev => ({
        ...prev,
        [receiverId]: 'pending'
      }));
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleCancelRequest = async (receiverId: string) => {
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
          receiver_id: receiverId
        });

      if (error) throw error;

      // Update local state immediately
      setFriendshipStatuses(prev => ({
        ...prev,
        [receiverId]: 'not_friends'
      }));
    } catch (error) {
      console.error('Error canceling friend request:', error);
      Alert.alert('Error', 'Failed to cancel friend request');
    }
  };

  // Function to handle search
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      setLoading(true);
      try {
        // Search for users
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, name, age, gender')
          .ilike('name', `%${text}%`)
          .limit(5);

        if (userError) throw userError;
        setUserResults(userData || []);

        // Search for activities
        const { data: activityData, error: activityError } = await supabase.rpc('search_activities', {
          search_query: text
        });

        if (activityError) throw activityError;
        setActivityResults(activityData || []);
      } catch (error) {
        console.error('Search error:', error);
        setUserResults([]);
        setActivityResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setUserResults([]);
      setActivityResults([]);
    }
  };

  const handleSearchSubmit = async () => {
    if (searchQuery.trim()) {
      await saveRecentSearch(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setUserResults([]);
    setActivityResults([]);
  };

  const handleUserSelect = async (user: User) => {
    await saveRecentSearch(user.name);
    handleUserPress(user);
  };

  // Function to remove recent search
  const removeRecentSearch = async (search: string) => {
    try {
      const updatedSearches = recentSearches.filter(item => item !== search);
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  };

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/searchProfileView',
      params: { userId: user.id }
    });
  };

  const getFriendButtonText = (userId: string) => {
    switch (friendshipStatuses[userId]) {
      case 'friends':
        return 'Friends';
      case 'pending':
        return '• Pending';
      default:
        return 'Add Friend';
    }
  };

  const getFriendButtonStyle = (userId: string) => {
    const baseStyle = styles.followButton;
    switch (friendshipStatuses[userId]) {
      case 'friends':
        return [baseStyle, styles.friendsButton];
      case 'pending':
        return [baseStyle, styles.pendingButton];
      default:
        return baseStyle;
    }
  };

  const getFriendButtonTextStyle = (userId: string) => {
    const baseStyle = styles.followButtonText;
    if (friendshipStatuses[userId] === 'pending') {
      return [baseStyle, { color: '#FF9500' }];
    }
    return baseStyle;
  };

  useEffect(() => {
    Animated.timing(clearButtonOpacity, {
      toValue: searchQuery.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities or users"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        <Animated.View style={{ opacity: clearButtonOpacity }}>
          <TouchableOpacity 
            onPress={clearSearch}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* Loading Indicator */}
        {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />}

        {/* No Matches Found */}
        {!loading && searchQuery && userResults.length === 0 && activityResults.length === 0 && (
          <Text style={styles.noMatchesText}>No matches found</Text>
        )}

        {/* Recent Searches Section */}
        {!searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearches.map((search, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.recentSearchItem}
                onPress={() => handleSearch(search)}
              >
                <View style={styles.recentSearchLeft}>
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.recentSearchText}>{search}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeRecentSearch(search)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Search Results */}
        {searchQuery && (
          <>
            {/* Users Section */}
            {userResults.length > 0 && (
              <>
                <Text style={styles.resultsSectionTitle}>People</Text>
                {userResults.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userCard}
                    onPress={() => handleUserSelect(user)}
                  >
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userAge}>{user.age} years old</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={getFriendButtonStyle(user.id)}
                        onPress={() => handleFriendRequest(user.id)}
                        disabled={friendshipStatuses[user.id] === 'friends' || friendshipStatuses[user.id] === 'pending'}
                      >
                        <Text style={getFriendButtonTextStyle(user.id)}>
                          {getFriendButtonText(user.id)}
                        </Text>
                      </TouchableOpacity>
                      {friendshipStatuses[user.id] === 'pending' && (
                        <TouchableOpacity 
                          style={styles.cancelButton}
                          onPress={() => handleCancelRequest(user.id)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Activities Section */}
            {activityResults.length > 0 && (
              <>
                <Text style={styles.resultsSectionTitle}>Activities</Text>
                {activityResults.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.activityCard}
                    onPress={() => router.push(`/activityView?id=${activity.id}`)}
                  >
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      <Text style={styles.activityDescription} numberOfLines={2}>
                        {activity.description}
                      </Text>
                      <View style={styles.activityMeta}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{activity.category}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 50,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  noMatchesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    marginBottom: 8,
    borderRadius: 12,
  },
  recentSearchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSearchText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 100,
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
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default SearchScreen; 