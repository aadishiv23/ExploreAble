import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  description?: string;
  participants: number;
  accessibility_features: string[];
  activity_id: string;
  created_by: string;
  max_participants?: number;
}

const EventDetailScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);
  const [creatorName, setCreatorName] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from the database
      // For demo purposes, we'll use sample data
      if (params.id === '1') {
        setEvent({
          id: '1',
          title: 'Adaptive Hiking Meetup',
          location: 'Green Hill Park',
          date: '2025-02-23T10:00:00Z',
          description: 'Join us for an inclusive hiking experience at Green Hill Park. This event is designed for all ability levels with accessible trails and support staff available.',
          participants: 12,
          accessibility_features: ['Wheelchair Ramp', 'Paved Trails'],
          activity_id: '123',
          created_by: 'user1',
          max_participants: 20
        });
        setCreatorName('John Doe');
      } else if (params.id === '2') {
        setEvent({
          id: '2',
          title: 'Kayaking for All',
          location: 'River Bend',
          date: '2025-02-24T09:00:00Z',
          description: 'Experience the joy of kayaking with our adaptive equipment and trained staff. All skill levels welcome!',
          participants: 8,
          accessibility_features: ['Life Jackets', 'Assistance Available'],
          activity_id: '124',
          created_by: 'user2',
          max_participants: 15
        });
        setCreatorName('Jane Smith');
      }
      
      // Check if user is participating
      setIsParticipating(Math.random() > 0.5); // Random for demo
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = () => {
    if (isParticipating) {
      Alert.alert(
        'Leave Event',
        'Are you sure you want to leave this event?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              // In a real app, this would update the database
              setIsParticipating(false);
              if (event) {
                setEvent({
                  ...event,
                  participants: event.participants - 1
                });
              }
            },
          },
        ]
      );
    } else {
      // In a real app, this would update the database
      setIsParticipating(true);
      if (event) {
        setEvent({
          ...event,
          participants: event.participants + 1
        });
      }
    }
  };

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4B7BF5" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{
          title: event?.title || '',
          headerTransparent: true,
          headerTintColor: 'white',
          headerShadowVisible: false,
          headerBackground: () => (
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']}
              style={{ flex: 1 }}
            />
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#4B7BF5', '#2E5BDB']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Text style={styles.timeText}>{formattedTime}</Text>
              </View>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={24} color="white" />
                <Text style={styles.locationText}>{event.location}</Text>
              </View>
              <View style={styles.participantsContainer}>
                <Ionicons name="people" size={24} color="white" />
                <Text style={styles.participantsText}>
                  {event.participants} / {event.max_participants || 'Unlimited'} participants
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Accessibility Features */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Accessibility Features</Text>
            <View style={styles.featuresContainer}>
              {event.accessibility_features.map((feature, index) => (
                <View key={index} style={styles.featureTag}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.featureIcon} />
                  <Text style={styles.featureTagText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About this Event</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Map Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <Ionicons name="map" size={48} color="#4B7BF5" />
              <Text style={styles.mapPlaceholderText}>Map view coming soon</Text>
            </View>
          </View>

          {/* Organizer */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Organizer</Text>
            <View style={styles.organizerContainer}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerInitials}>{creatorName.charAt(0)}</Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{creatorName}</Text>
                <Text style={styles.organizerRole}>Event Host</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Join Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.joinButton,
            isParticipating ? styles.leaveButton : {}
          ]}
          onPress={handleJoinEvent}
        >
          <Text style={styles.joinButtonText}>
            {isParticipating ? 'Leave Event' : 'Join Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  headerContainer: {
    height: 280,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContent: {
    marginTop: 60,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 18,
    color: 'white',
    marginLeft: 8,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 18,
    color: 'white',
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureIcon: {
    marginRight: 8,
  },
  featureTagText: {
    fontSize: 16,
    color: '#333',
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4B7BF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  organizerInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  organizerRole: {
    fontSize: 14,
    color: '#666',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  joinButton: {
    backgroundColor: '#4B7BF5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
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
});

export default EventDetailScreen; 