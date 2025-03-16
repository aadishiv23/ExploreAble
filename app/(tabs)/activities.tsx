import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const ACTIVITY_CATEGORIES = ['All', 'hiking', 'running', 'biking', 'swimming', 'weightlifting', 'walking', 'other'];

const ActivityCard = ({ activity }: { activity: Activity }) => {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const getActivityIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'running':
        return 'fitness';
      case 'hiking':
        return 'walk';
      case 'biking':
        return 'bicycle';
      case 'swimming':
        return 'water';
      case 'weightlifting':
        return 'barbell';
      case 'walking':
        return 'walk';
      default:
        return 'body';
    }
  };

  return (
    <Pressable 
      style={[
        styles.activityCard,
        pressed && styles.activityCardPressed
      ]}
      onPress={() => router.push(`/activityView?id=${activity.id}`)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={[styles.iconContainer, { backgroundColor: '#E8F1FF' }]}>
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
    </Pressable>
  );
};

const ActivitiesScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchActivities();
  }, [selectedCategory]);

  const fetchActivities = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('is_public', true);

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateActivity = () => {
    router.push('/createActivity');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <Text style={styles.title}>Activities</Text>
      
      {/* Category Pills */}
      <View style={styles.pillWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.pillContainer}
          contentContainerStyle={styles.pillContent}
        >
          {ACTIVITY_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.pill,
                selectedCategory === category && styles.pillSelected
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text 
                style={[
                  styles.pillText,
                  selectedCategory === category && styles.pillTextSelected
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activities Grid */}
      <View style={styles.mainContent}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B7BF5" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.activitiesContainer}
            contentContainerStyle={[
              styles.activitiesContent,
              activities.length === 0 && styles.emptyContentContainer
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4B7BF5']}
                tintColor="#4B7BF5"
              />
            }
          >
            {/* Activities Section */}
            <View style={styles.sectionContainer}>
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="fitness-outline" size={64} color="#CCCCCC" />
                  <Text style={styles.emptyStateTitle}>No Activities Found</Text>
                  <Text style={styles.emptyStateText}>
                    {selectedCategory === 'All' 
                      ? 'There are no activities available yet. Create one to get started!' 
                      : `No ${selectedCategory} activities found. Try selecting a different category.`}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Create Activity Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateActivity}
      >
        <Text style={styles.createButtonText}>Create Group Activity</Text>
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
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  pillWrapper: {
    height: 44,
    marginBottom: 8,
  },
  pillContainer: {
    maxHeight: 44,
  },
  pillContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: '#4B7BF5',
  },
  pillText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  activitiesContainer: {
    flex: 1,
  },
  activitiesContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  activityCardPressed: {
    backgroundColor: '#F0F0F0',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  createButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
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
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivitiesScreen; 