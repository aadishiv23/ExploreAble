import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccessibilityFeature {
  id: string;
  name: string;
  selected: boolean;
}

interface Friend {
  id: string;
  name: string;
}

interface FriendshipResponse {
  user1: {
    id: string;
    name: string;
  };
  user2: {
    id: string;
    name: string;
  };
}

const CreateGroupEventScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activityName, setActivityName] = useState('');
  const [activityCategory, setActivityCategory] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<AccessibilityFeature[]>([
    { id: '1', name: 'Wheelchair Ramp', selected: false },
    { id: '2', name: 'Paved Trails', selected: false },
    { id: '3', name: 'Assistance Available', selected: false },
    { id: '4', name: 'Life Jackets', selected: false },
    { id: '5', name: 'Adaptive Equipment', selected: false },
    { id: '6', name: 'Sign Language', selected: false },
    { id: '7', name: 'Audio Description', selected: false },
    { id: '8', name: 'Sensory-Friendly', selected: false },
    { id: '9', name: 'Service Animals Welcome', selected: false },
    { id: '10', name: 'Accessible Parking', selected: false },
    { id: '11', name: 'Accessible Restrooms', selected: false },
    { id: '12', name: 'Rest Areas Available', selected: false },
  ]);
  const [customFeature, setCustomFeature] = useState('');
  const [showCustomFeatureInput, setShowCustomFeatureInput] = useState(false);
  
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    fetchActivityDetails();
    fetchFriends();
  }, []);

  const fetchActivityDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('name, category')
        .eq('id', params.activityId)
        .single();

      if (error) throw error;
      
      if (data) {
        setActivityName(data.name);
        setActivityCategory(data.category);
        // Pre-populate the title with the activity name
        setTitle(`${data.name} Group Event`);
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user2:user2_id (id, name),
          user1:user1_id (id, name)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`) as { data: FriendshipResponse[] | null, error: any };

      if (error) throw error;

      const friendsList: Friend[] = data?.map(friendship => {
        const friend = friendship.user1.id === user.id ? friendship.user2 : friendship.user1;
        return {
          id: friend.id,
          name: friend.name
        };
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleAccessibilityFeature = (id: string) => {
    setAccessibilityFeatures(
      accessibilityFeatures.map(feature => 
        feature.id === id 
          ? { ...feature, selected: !feature.selected } 
          : feature
      )
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter an event location');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description for your event');
      return false;
    }
    if (isNaN(parseInt(maxParticipants)) || parseInt(maxParticipants) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of participants');
      return false;
    }
    return true;
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create an event');
        return;
      }

      // Get selected accessibility features
      const selectedFeatures = accessibilityFeatures
        .filter(feature => feature.selected)
        .map(feature => feature.name);

      // Create the event
      const { data: event, error: eventError } = await supabase
        .from('community_events')
        .insert({
          title,
          description,
          location,
          date: date.toISOString(),
          max_participants: parseInt(maxParticipants),
          accessibility_features: selectedFeatures,
          created_by: user.id,
          activity_id: params.activityId,
          is_public: isPublic,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create friend invites
      if (selectedFriends.length > 0) {
        const invites = selectedFriends.map(friendId => ({
          sender_id: user.id,
          receiver_id: friendId,
          event_id: event.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: inviteError } = await supabase
          .from('friend_invites')
          .insert(invites);

        if (inviteError) throw inviteError;
      }

      Alert.alert(
        'Success',
        'Your event has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/community')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      const newFeature: AccessibilityFeature = {
        id: `custom-${Date.now()}`,
        name: customFeature.trim(),
        selected: true,
      };
      setAccessibilityFeatures([...accessibilityFeatures, newFeature]);
      setCustomFeature('');
      setShowCustomFeatureInput(false);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.friendItem,
        selectedFriends.includes(item.id) && styles.friendItemSelected
      ]}
      onPress={() => toggleFriendSelection(item.id)}
    >
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <Text style={styles.friendName}>{item.name}</Text>
      {selectedFriends.includes(item.id) && (
        <Ionicons name="checkmark-circle" size={20} color="#4B7BF5" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B7BF5" />
        <Text style={styles.loadingText}>Loading activity details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen 
        options={{
          title: 'Create Group Event',
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Activity Info */}
          <View style={styles.activityInfoContainer}>
            <Text style={styles.sectionLabel}>Based on Activity</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{activityName}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{activityCategory}</Text>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Event Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter event location"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date & Time</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Maximum Participants</Text>
              <TextInput
                style={[styles.textInput, styles.numberInput]}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your event, including any special instructions for participants"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Accessibility Features */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Accessibility Features</Text>
            <Text style={styles.helperText}>
              Select all accessibility features that will be available at your event
            </Text>
            
            <View style={styles.featuresGrid}>
              {accessibilityFeatures.map(feature => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureItem,
                    feature.selected && styles.featureItemSelected
                  ]}
                  onPress={() => toggleAccessibilityFeature(feature.id)}
                >
                  <Text 
                    style={[
                      styles.featureText,
                      feature.selected && styles.featureTextSelected
                    ]}
                  >
                    {feature.name}
                  </Text>
                  {feature.selected && (
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Add Custom Feature Button */}
              <TouchableOpacity
                style={[styles.featureItem, styles.addFeatureButton]}
                onPress={() => setShowCustomFeatureInput(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4B7BF5" />
                <Text style={styles.addFeatureText}>Add Custom Feature</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Feature Input */}
            {showCustomFeatureInput && (
              <View style={styles.customFeatureContainer}>
                <TextInput
                  style={styles.customFeatureInput}
                  value={customFeature}
                  onChangeText={setCustomFeature}
                  placeholder="Enter custom accessibility feature"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  onSubmitEditing={addCustomFeature}
                />
                <View style={styles.customFeatureButtons}>
                  <TouchableOpacity
                    style={[styles.customFeatureButton, styles.cancelButton]}
                    onPress={() => {
                      setShowCustomFeatureInput(false);
                      setCustomFeature('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.customFeatureButton, styles.addButton]}
                    onPress={addCustomFeature}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Friends Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Invite Friends</Text>
            {loadingFriends ? (
              <ActivityIndicator size="small" color="#4B7BF5" />
            ) : friends.length > 0 ? (
              <View style={styles.friendsContainer}>
                {friends.map(friend => renderFriend({ item: friend }))}
              </View>
            ) : (
              <Text style={styles.noFriendsText}>No friends to invite</Text>
            )}
          </View>

          {/* Visibility */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Visibility</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Make this event public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: '#D1D1D6', true: '#4CAF50' }}
                thumbColor={isPublic ? '#fff' : '#fff'}
              />
            </View>
            <Text style={styles.helperText}>
              {isPublic 
                ? 'Your event will be visible to all users in the community tab' 
                : 'Your event will only be visible to people you invite'}
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Create Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  activityInfoContainer: {
    marginBottom: 24,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  categoryBadge: {
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#4B7BF5',
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  numberInput: {
    width: '30%',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureItemSelected: {
    backgroundColor: '#4B7BF5',
    borderColor: '#4B7BF5',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  featureTextSelected: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  addFeatureButton: {
    backgroundColor: '#F0F4FF',
    borderColor: '#4B7BF5',
    borderStyle: 'dashed',
  },
  addFeatureText: {
    color: '#4B7BF5',
    marginLeft: 8,
  },
  customFeatureContainer: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  customFeatureInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  customFeatureButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  customFeatureButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4B7BF5',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  friendsContainer: {
    marginTop: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  friendItemSelected: {
    backgroundColor: '#E8F1FF',
    borderColor: '#4B7BF5',
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  noFriendsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B7BF5',
  },
});

export default CreateGroupEventScreen; 