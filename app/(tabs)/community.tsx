import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  participants: number;
  accessibility_features: string[];
  activity_id: string;
  created_by: string;
}

const FeaturedEventCard = ({ event, onPress }: { event: Event, onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.featuredEventCard} onPress={onPress}>
      <Text style={styles.featuredEventLabel}>Featured Event</Text>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <View style={styles.eventDetails}>
        <View style={styles.eventDetail}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
        <View style={styles.eventDetail}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.eventDetailText}>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
        </View>
      </View>
      <View style={styles.accessibilityFeatures}>
        {event.accessibility_features.map((feature, index) => (
          <View key={index} style={styles.featureTag}>
            <Text style={styles.featureTagText}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const EventCard = ({ event, onPress }: { event: Event, onPress: () => void }) => {
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      <View style={styles.dateContainer}>
        <Text style={styles.monthText}>{month}</Text>
        <Text style={styles.dayText}>{day}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventCardTitle}>{event.title}</Text>
        <View style={styles.eventCardDetail}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.eventCardDetailText}>{event.location}</Text>
        </View>
        <View style={styles.accessibilityTags}>
          {event.accessibility_features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureTagText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );
};

const CommunityScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const formattedEvents = data?.map(event => ({
        ...event,
        accessibility_features: event.accessibility_features || []
      })) || [];
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/eventDetail?id=${eventId}`);
  };

  // For demo purposes, let's add some sample events if none exist
  useEffect(() => {
    if (!loading && events.length === 0) {
      const sampleEvents: Event[] = [
        {
          id: '1',
          title: 'Adaptive Hiking Meetup',
          location: 'Green Hill Park',
          date: '2025-02-23T10:00:00Z',
          participants: 12,
          accessibility_features: ['Wheelchair Ramp', 'Paved Trails'],
          activity_id: '123',
          created_by: 'user1'
        },
        {
          id: '2',
          title: 'Kayaking for All',
          location: 'River Bend',
          date: '2025-02-24T09:00:00Z',
          participants: 8,
          accessibility_features: ['Life Jackets', 'Assistance Available'],
          activity_id: '124',
          created_by: 'user2'
        }
      ];
      setEvents(sampleEvents);
    }
  }, [loading, events]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <Text style={styles.title}>Community</Text>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B7BF5" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : (
          <>
            {/* Featured Event */}
            {events.length > 0 && (
              <FeaturedEventCard 
                event={events[0]} 
                onPress={() => handleEventPress(events[0].id)} 
              />
            )}

            {/* Upcoming Events */}
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {events.length > 0 ? (
              events.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onPress={() => handleEventPress(event.id)} 
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateTitle}>No Events Found</Text>
                <Text style={styles.emptyStateText}>
                  There are no community events scheduled yet. Create one from an activity to get started!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => router.push('/createCommunityEvent')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  featuredEventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featuredEventLabel: {
    color: '#4B7BF5',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  eventDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDetailText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  accessibilityFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  featureTagText: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dateContainer: {
    width: 50,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  monthText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dayText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  eventInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  eventCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCardDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  accessibilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  createButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4B7BF5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CommunityScreen; 