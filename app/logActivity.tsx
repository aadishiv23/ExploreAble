import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LogActivityFormData {
  date: Date;
  duration: string;
  distance: string;
  notes: string;
  selectedFriends: string[];
}

interface Friend {
  id: string;
  name: string;
  full_name: string;
  avatar_url: string | null;
}

interface FriendshipResponse {
  user1: {
    id: string;
    name: string;
    full_name: string;
    avatar_url: string | null;
  };
  user2: {
    id: string;
    name: string;
    full_name: string;
    avatar_url: string | null;
  };
}

const LogActivityScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activityId = params.id as string;
  const activityName = params.name as string;

  const [formData, setFormData] = useState<LogActivityFormData>({
    date: new Date(),
    duration: '',
    distance: '',
    notes: '',
    selectedFriends: [],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handleInputChange = (field: keyof LogActivityFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.duration) {
      Alert.alert('Error', 'Please enter a duration');
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user2:user2_id (id, name, full_name, avatar_url),
          user1:user1_id (id, name, full_name, avatar_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .returns<FriendshipResponse[]>();

      if (error) throw error;

      const friendsList: Friend[] = data.map(friendship => {
        const friend = friendship.user1.id === user.id ? friendship.user2 : friendship.user1;
        return {
          id: friend.id,
          name: friend.name,
          full_name: friend.full_name,
          avatar_url: friend.avatar_url
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFriends: prev.selectedFriends.includes(friendId)
        ? prev.selectedFriends.filter(id => id !== friendId)
        : [...prev.selectedFriends, friendId]
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert activity log
      const logData = {
        activity_id: activityId,
        user_id: user.id,
        date: formData.date.toISOString(),
        duration: parseInt(formData.duration, 10) || 0,
        distance: parseFloat(formData.distance) || null,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
      };

      const { data: activityLog, error: logError } = await supabase
        .from('activity_logs')
        .insert(logData)
        .select()
        .single();

      if (logError) throw logError;

      // Create friend invites
      if (formData.selectedFriends.length > 0) {
        const invites = formData.selectedFriends.map(friendId => ({
          sender_id: user.id,
          receiver_id: friendId,
          activity_log_id: activityLog.id,
          created_at: new Date().toISOString(),
        }));

        const { error: inviteError } = await supabase
          .from('friend_invites')
          .insert(invites);

        if (inviteError) throw inviteError;
      }

      Alert.alert(
        'Success',
        'Activity logged successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error logging activity:', error);
      Alert.alert('Error', 'Failed to log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Stack.Screen
          options={{
            title: 'Log Activity',
            headerShown: true,
            headerBackTitle: 'Back',
            headerTitleStyle: styles.headerTitle,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: '#fff',
            },
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.activityNameContainer}>
            <Ionicons name="fitness-outline" size={24} color="#4B7BF5" />
            <Text style={styles.activityName}>{activityName}</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Date Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (minutes) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(value) => handleInputChange('duration', value)}
                placeholder="Enter duration in minutes"
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>

            {/* Distance */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Distance (miles)</Text>
              <TextInput
                style={styles.input}
                value={formData.distance}
                onChangeText={(value) => handleInputChange('distance', value)}
                placeholder="Enter distance"
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder="Add notes about your activity"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Friends Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Invite Friends</Text>
              {loadingFriends ? (
                <ActivityIndicator size="small" color="#4B7BF5" />
              ) : friends.length > 0 ? (
                <View style={styles.friendsContainer}>
                  {friends.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendItem,
                        formData.selectedFriends.includes(friend.id) && styles.friendItemSelected
                      ]}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <View style={styles.friendAvatar}>
                        {friend.avatar_url ? (
                          <Image
                            source={{ uri: friend.avatar_url }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {friend.full_name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.friendName}>{friend.full_name}</Text>
                      {formData.selectedFriends.includes(friend.id) && (
                        <Ionicons name="checkmark-circle" size={20} color="#4B7BF5" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noFriendsText}>No friends to invite</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Save Activity Log</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  activityNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    marginLeft: 12,
  },
  formContainer: {
    gap: 20,
  },
  formGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#E53935',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#4B7BF5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B7BF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
});

export default LogActivityScreen;
