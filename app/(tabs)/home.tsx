import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppGradient from '@/components/AppGradient';

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

const ACTIVITY_OPTIONS = [
  { 
    id: 'running',
    name: "Running",
    icon: 'fitness' as const,
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#EE5253'] as [string, string]
  },
  { 
    id: 'walking',
    name: "Walking",
    icon: 'walk' as const,
    color: '#4CAF50',
    gradient: ['#4CAF50', '#388E3C'] as [string, string]
  },
  { 
    id: 'cycling',
    name: "Cycling",
    icon: 'bicycle' as const,
    color: '#2196F3',
    gradient: ['#2196F3', '#1976D2'] as [string, string]
  }
];

const EventCard = ({ event, onPress }: { event: Event, onPress: () => void }) => {
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const day = eventDate.getDate();

  return (
    <Pressable style={styles.eventCard} onPress={onPress}>
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
    </Pressable>
  );
};

const DailyUpdateCard = () => {
  return (
    <LinearGradient
      colors={['#7B68EE', '#9370DB']} // Purple gradient colors
      style={styles.cardContainer}
    >
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.headerTitle}>Weekly Progress</Text>
          <Text style={styles.progressText}>50% Complete</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressNumber}>5/10</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.nextActivitySection}>
        <View>
          <Text style={[styles.nextUpText, { opacity: 0.8 }]}>Next Up</Text>
          <Text style={styles.activityText}>Evening Run</Text>
        </View>
        <Text style={styles.timeText}>10:35 PM</Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>42.5 km</Text>
          <Text style={styles.statLabel}>Total Distance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>380</Text>
          <Text style={styles.statLabel}>Active Minutes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>2,450</Text>
          <Text style={styles.statLabel}>Calories Burned</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const QuickStartCard = ({ activity, onPress }: { activity: typeof ACTIVITY_OPTIONS[0]; onPress: () => void }) => {
  return (
    <TouchableOpacity 
      style={styles.quickStartCard}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: activity.color }]}>
        <Ionicons name={activity.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.activityLabel}>{activity.name}</Text>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // In a real app, this would fetch from the database
      // For demo purposes, we'll use sample data
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
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleActivitySelect = (activity: typeof ACTIVITY_OPTIONS[0]) => {
    router.push({
      pathname: '/activitiesByType',
      params: { 
        type: activity.id,
        name: activity.name
      }
    });
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/eventDetail?id=${eventId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <DailyUpdateCard />

        {/* Feed Section */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.sectionTitle}>Feed</Text>
            <TouchableOpacity 
              onPress={() => router.push('/feed')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#4B7BF5" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.createPostButton}
            onPress={() => router.push('/createPost')}
          >
            <View style={styles.createPostContent}>
              <View style={styles.createPostAvatar}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <Text style={styles.createPostText}>Share what you're up to...</Text>
            </View>
            <Ionicons name="add-circle" size={24} color="#4B7BF5" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickStartSection}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.quickStartGrid}>
            {ACTIVITY_OPTIONS.map((activity) => (
              <QuickStartCard
                key={activity.id}
                activity={activity}
                onPress={() => handleActivitySelect(activity)}
              />
            ))}
          </View>
        </View>

        {/* Upcoming Events Section */}
        {events.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onPress={() => handleEventPress(event.id)} 
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 20,
    marginLeft: 16,
  },
  cardContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 15,
  },
  nextActivitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  nextUpText: {
    fontSize: 14,
    color: 'white',
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
    color: 'white',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  quickStartSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 16,
    marginBottom: 15,
  },
  quickStartGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStartCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  eventsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  feedSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4B7BF5',
    fontWeight: '600',
    marginRight: 8,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B7BF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createPostText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;