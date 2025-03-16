import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  participants: number;
  created_by: string;
  is_public: boolean;
  created_at: string;
}

const ActivityCard = ({ activity, onPress }: { activity: Activity; onPress: () => void }) => {
  const getActivityIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'running':
        return 'fitness';
      case 'walking':
        return 'walk';
      case 'cycling':
        return 'bicycle';
      default:
        return 'body';
    }
  };

  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getActivityIcon(activity.category)} 
          size={24} 
          color="#4B7BF5" 
        />
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <View style={styles.activityMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{activity.duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{activity.participants}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ActivitiesByTypeScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
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
        .eq('category', params.type)
        .eq('is_public', true);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityPress = (activityId: string) => {
    router.push(`/activityView?id=${activityId}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: `${String(params.name)} Activities`,
          headerShadowVisible: false,
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BF5" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            activities.length === 0 && styles.emptyContentContainer
          ]}
        >
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onPress={() => handleActivityPress(activity.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyStateTitle}>No Activities Found</Text>
              <Text style={styles.emptyStateText}>
                There are no {String(params.name).toLowerCase()} activities available yet.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  activityCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
});

export default ActivitiesByTypeScreen; 