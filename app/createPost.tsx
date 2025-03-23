import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Animated
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import 'react-native-gesture-handler';

interface Friend {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  category: string;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocusedActivity, setIsFocusedActivity] = useState(false);
  const [postType, setPostType] = useState<'activity_post' | 'community_event'>('activity_post');
  const [contentHeight, setContentHeight] = useState(120);

  // Update the animation configuration
  const slideAnim = useState(new Animated.Value(-300))[0];
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: showActivities || showEvents || showFriends ? 0 : -300,
      damping: 20,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
  }, [showActivities, showEvents, showFriends]);

  useEffect(() => {
    fetchActivities();
    fetchEvents();
    fetchFriends();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showActivities || showEvents || showFriends ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showActivities, showEvents, showFriends]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('id, title, description, location, date')
        .order('date');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user2:user2_id (id, name),
          user1:user1_id (id, name)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const friendsList: Friend[] = (data || []).map((friendship: any) => {
        const friend = friendship.user1.id === user.id ? friendship.user2 : friendship.user1;
        return {
          id: friend.id,
          name: friend.name
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    if (postType === 'activity_post' && !selectedActivity) {
      Alert.alert('Error', 'Please select an activity');
      return;
    }

    if (postType === 'community_event' && !selectedEvent) {
      Alert.alert('Error', 'Please select a community event');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a post');
        return;
      }

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          content_type: postType,
          activity_id: postType === 'activity_post' ? selectedActivity?.id : null,
          event_id: postType === 'community_event' ? selectedEvent?.id : null,
          is_focus: postType === 'activity_post' ? isFocusedActivity : false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add participants if any
      if (selectedFriends.length > 0 && post) {
        const participants = selectedFriends.map(friend => ({
          post_id: post.id,
          user_id: friend.id
        }));

        const { error: participantsError } = await supabase
          .from('post_participants')
          .insert(participants);

        if (participantsError) throw participantsError;
      }

      Alert.alert(
        'Success',
        'Your post has been created!',
        [{ text: 'OK', onPress: () => router.push('/feed') }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen 
        options={{
          title: 'Create Post',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentButton, postType === 'activity_post' && styles.activeSegment]}
            onPress={() => setPostType('activity_post')}
          >
            <Ionicons 
              name="fitness" 
              size={20} 
              color={postType === 'activity_post' ? '#fff' : '#666'} 
            />
            <Text style={[styles.segmentText, postType === 'activity_post' && styles.activeSegmentText]}>
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentButton, postType === 'community_event' && styles.activeSegment]}
            onPress={() => setPostType('community_event')}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={postType === 'community_event' ? '#fff' : '#666'} 
            />
            <Text style={[styles.segmentText, postType === 'community_event' && styles.activeSegmentText]}>
              Event
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TextInput
            style={[styles.contentInput, { height: Math.max(120, contentHeight) }]}
            placeholder={postType === 'activity_post' 
              ? "What activity are you up to?" 
              : "Share details about the community event"}
            placeholderTextColor="#999"
            multiline
            value={content}
            onChangeText={setContent}
            onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
          />

          {postType === 'activity_post' ? (
            <TouchableOpacity 
              style={[styles.selectionButton, selectedActivity && styles.selectedButton]}
              onPress={() => {
                setShowActivities(!showActivities);
                setShowEvents(false);
                setShowFriends(false);
              }}
            >
              <Ionicons 
                name="fitness" 
                size={24} 
                color={selectedActivity ? '#4B7BF5' : '#666'} 
              />
              <Text style={[styles.selectionButtonText, selectedActivity && styles.selectedButtonText]}>
                {selectedActivity ? selectedActivity.name : 'Select Activity'}
              </Text>
              <Ionicons 
                name={showActivities ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={selectedActivity ? '#4B7BF5' : '#666'} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.selectionButton, selectedEvent && styles.selectedButton]}
              onPress={() => {
                setShowEvents(!showEvents);
                setShowActivities(false);
                setShowFriends(false);
              }}
            >
              <Ionicons 
                name="calendar" 
                size={24} 
                color={selectedEvent ? '#4B7BF5' : '#666'} 
              />
              <Text style={[styles.selectionButtonText, selectedEvent && styles.selectedButtonText]}>
                {selectedEvent ? selectedEvent.title : 'Select Event'}
              </Text>
              <Ionicons 
                name={showEvents ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={selectedEvent ? '#4B7BF5' : '#666'} 
              />
            </TouchableOpacity>
          )}

          {postType === 'activity_post' && (
            <View style={styles.focusContainer}>
              <View style={styles.focusTextContainer}>
                <Ionicons name="eye" size={20} color="#666" />
                <Text style={styles.focusText}>Focused Activity</Text>
              </View>
              <Switch
                value={isFocusedActivity}
                onValueChange={setIsFocusedActivity}
                trackColor={{ false: '#ddd', true: '#4CAF50' }}
                thumbColor={isFocusedActivity ? '#fff' : '#f4f3f4'}
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.selectionButton, selectedFriends.length > 0 && styles.selectedButton]}
            onPress={() => {
              setShowFriends(!showFriends);
              setShowActivities(false);
              setShowEvents(false);
            }}
          >
            <Ionicons 
              name="people" 
              size={24} 
              color={selectedFriends.length > 0 ? '#4B7BF5' : '#666'} 
            />
            <Text style={[styles.selectionButtonText, selectedFriends.length > 0 && styles.selectedButtonText]}>
              {selectedFriends.length > 0 
                ? `${selectedFriends.length} Friend${selectedFriends.length > 1 ? 's' : ''} Tagged` 
                : 'Tag Friends'}
            </Text>
            <Ionicons 
              name={showFriends ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={selectedFriends.length > 0 ? '#4B7BF5' : '#666'} 
            />
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.selectionPanel,
            {
              transform: [{
                translateY: slideAnim
              }]
            }
          ]}
        >
          {showActivities && (
            <View style={styles.selectionList}>
              <Text style={styles.selectionTitle}>Select Activity</Text>
              <ScrollView style={styles.optionsList}>
                {activities.map(activity => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.optionItem,
                      selectedActivity?.id === activity.id && styles.selectedOptionItem
                    ]}
                    onPress={() => {
                      setSelectedActivity(activity);
                      setShowActivities(false);
                    }}
                  >
                    <Ionicons 
                      name={
                        activity.category === 'running' ? 'fitness' : 
                        activity.category === 'cycling' ? 'bicycle' : 
                        activity.category === 'walking' ? 'walk' : 'body'
                      } 
                      size={20} 
                      color={selectedActivity?.id === activity.id ? '#fff' : '#4B7BF5'} 
                    />
                    <Text style={[
                      styles.optionText,
                      selectedActivity?.id === activity.id && styles.selectedOptionText
                    ]}>
                      {activity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showEvents && (
            <View style={styles.selectionList}>
              <Text style={styles.selectionTitle}>Select Event</Text>
              <ScrollView style={styles.optionsList}>
                {events.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.optionItem,
                      selectedEvent?.id === event.id && styles.selectedOptionItem
                    ]}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowEvents(false);
                    }}
                  >
                    <Ionicons 
                      name="calendar" 
                      size={20} 
                      color={selectedEvent?.id === event.id ? '#fff' : '#4B7BF5'} 
                    />
                    <View style={styles.eventItemContent}>
                      <Text style={[
                        styles.optionText,
                        selectedEvent?.id === event.id && styles.selectedOptionText
                      ]}>
                        {event.title}
                      </Text>
                      <Text style={[
                        styles.eventDetails,
                        selectedEvent?.id === event.id && styles.selectedOptionText
                      ]}>
                        {event.location} • {new Date(event.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showFriends && (
            <View style={styles.selectionList}>
              <Text style={styles.selectionTitle}>Tag Friends</Text>
              <ScrollView style={styles.optionsList}>
                {friends.map(friend => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.optionItem,
                      selectedFriends.some(f => f.id === friend.id) && styles.selectedOptionItem
                    ]}
                    onPress={() => {
                      const isSelected = selectedFriends.some(f => f.id === friend.id);
                      setSelectedFriends(isSelected
                        ? selectedFriends.filter(f => f.id !== friend.id)
                        : [...selectedFriends, friend]
                      );
                    }}
                  >
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendInitial}>{friend.name[0]}</Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      selectedFriends.some(f => f.id === friend.id) && styles.selectedOptionText
                    ]}>
                      {friend.name}
                    </Text>
                    {selectedFriends.some(f => f.id === friend.id) && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.checkmark} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.postButton,
            (!content.trim() || 
             (postType === 'activity_post' && !selectedActivity) ||
             (postType === 'community_event' && !selectedEvent)) && styles.postButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.postButtonText}>Post</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.postButtonIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeSegment: {
    backgroundColor: '#4B7BF5',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeSegmentText: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contentInput: {
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 16,
    padding: 0,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedButton: {
    backgroundColor: '#E8F1FF',
  },
  selectionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  selectedButtonText: {
    color: '#4B7BF5',
  },
  focusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  focusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusText: {
    fontSize: 16,
    color: '#666',
  },
  selectionPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  selectionList: {
    maxHeight: 300,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsList: {
    maxHeight: 250,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOptionItem: {
    backgroundColor: '#4B7BF5',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedOptionText: {
    color: '#fff',
  },
  eventItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  eventDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B7BF5',
  },
  checkmark: {
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  postButton: {
    backgroundColor: '#4B7BF5',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  postButtonIcon: {
    marginLeft: 4,
  },
});