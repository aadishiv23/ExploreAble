import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface ActivityLog {
  id: string;
  date: string;
  duration: number;
  distance: number | null;
  notes: string | null;
  activity: {
    id: string;
    name: string;
    category: string;
    description: string;
  };
}

export default function ActivityLogDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [activityLog, setActivityLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogDetails();
  }, []);

  const fetchActivityLogDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          activity:activity_id (
            id,
            name,
            category,
            description
          )
        `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setActivityLog(data);
    } catch (error) {
      console.error('Error fetching activity log details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color="#4B7BF5" />
        <Text style={styles.loadingText}>Loading activity details...</Text>
      </View>
    );
  }

  if (!activityLog) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen
          options={{
            title: 'Error',
            headerShadowVisible: false,
          }}
        />
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Activity log not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  const getGradientColors = (category: string): [string, string] => {
    switch (category.toLowerCase()) {
      case 'running':
        return ['#4B7BF5', '#2E5BDB'];
      case 'hiking':
        return ['#4CAF50', '#388E3C'];
      case 'biking':
        return ['#FF5722', '#E64A19'];
      case 'swimming':
        return ['#03A9F4', '#0288D1'];
      case 'weightlifting':
        return ['#9C27B0', '#7B1FA2'];
      case 'walking':
        return ['#FF9800', '#F57C00'];
      default:
        return ['#607D8B', '#455A64'];
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: activityLog.activity.name,
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={getGradientColors(activityLog.activity.category)}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons
                  name={getActivityIcon(activityLog.activity.category)}
                  size={48}
                  color="white"
                />
              </View>
              <Text style={styles.headerDate}>
                {new Date(activityLog.date).toLocaleDateString()}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color="#4B7BF5" />
            <Text style={styles.statValue}>{activityLog.duration}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          {activityLog.distance && (
            <View style={styles.statItem}>
              <Ionicons name="map-outline" size={24} color="#4B7BF5" />
              <Text style={styles.statValue}>{activityLog.distance}</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
          )}
        </View>

        {/* Notes Section */}
        {activityLog.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{activityLog.notes}</Text>
          </View>
        )}

        {/* Activity Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this Activity</Text>
          <Text style={styles.description}>
            {activityLog.activity.description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4B7BF5',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 140,
  },
  headerGradient: {
    flex: 1,
    padding: 20,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  headerDate: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notes: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});
