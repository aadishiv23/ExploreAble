import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Activity {
  id: string;
  name: string;
  category: string;
}

const CreateCommunityEventScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [accessibilityFeatures, setAccessibilityFeatures] = useState('');
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('is_public', true);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedActivity) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_events')
        .insert({
          title,
          description,
          location,
          date: date.toISOString(),
          max_participants: parseInt(maxParticipants),
          activity_id: selectedActivity.id,
          created_by: user.id,
          accessibility_features: accessibilityFeatures.split(',').map(f => f.trim()),
        });

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const ActivityPicker = () => (
    <Modal
      visible={showActivityPicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowActivityPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Activity</Text>
            <TouchableOpacity 
              onPress={() => setShowActivityPicker(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.activityItem}
                onPress={() => {
                  setSelectedActivity(item);
                  setShowActivityPicker(false);
                }}
              >
                <View style={styles.activityItemContent}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={item.category === 'running' ? 'fitness' : 
                            item.category === 'cycling' ? 'bicycle' : 
                            item.category === 'walking' ? 'walk' : 'body'} 
                      size={24} 
                      color="#4B7BF5" 
                    />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityName}>{item.name}</Text>
                    <Text style={styles.activityCategory}>{item.category}</Text>
                  </View>
                  {selectedActivity?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#4B7BF5" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Create Community Event',
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.form}>
        <Text style={styles.label}>Activity</Text>
        <TouchableOpacity
          style={styles.activitySelector}
          onPress={() => setShowActivityPicker(true)}
        >
          {selectedActivity ? (
            <View style={styles.selectedActivityContainer}>
              <Ionicons 
                name={selectedActivity.category === 'running' ? 'fitness' : 
                      selectedActivity.category === 'cycling' ? 'bicycle' : 
                      selectedActivity.category === 'walking' ? 'walk' : 'body'} 
                size={24} 
                color="#4B7BF5" 
              />
              <Text style={styles.selectedActivityText}>{selectedActivity.name}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select an activity</Text>
          )}
          <Ionicons name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter event description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter event location"
        />

        <Text style={styles.label}>Date and Time</Text>
        <DateTimePicker
          value={date}
          mode="datetime"
          onChange={(event, selectedDate) => {
            setDate(selectedDate || date);
          }}
        />

        <Text style={styles.label}>Maximum Participants</Text>
        <TextInput
          style={styles.input}
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          placeholder="Enter max participants"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Accessibility Features</Text>
        <TextInput
          style={styles.input}
          value={accessibilityFeatures}
          onChangeText={setAccessibilityFeatures}
          placeholder="Enter features (comma-separated)"
        />

        <TouchableOpacity 
          style={[styles.submitButton, !selectedActivity && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={!selectedActivity}
        >
          <Text style={styles.submitButtonText}>Create Event</Text>
        </TouchableOpacity>
      </ScrollView>

      <ActivityPicker />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  activitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedActivityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedActivityText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
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
  activityItem: {
    padding: 16,
  },
  activityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activityCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#4B7BF5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateCommunityEventScreen; 