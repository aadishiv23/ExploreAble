import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Animated, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActivityLog {
  id: string;
  date: string;
  duration: number;
  distance: number | null;
  notes: string | null;
}

interface ActivityStats {
  totalSessions: number;
  averageDuration: number;
  totalDistance: number;
}

const ActivityView = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activity, setActivity] = React.useState<any>(null);
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<ActivityStats>({ 
    totalSessions: 0, 
    averageDuration: 0, 
    totalDistance: 0 
  });
  const scrollY = React.useRef(new Animated.Value(0)).current;
  
  // Animation values for fade-in effects
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    fetchActivityDetails();
    fetchActivityLogs();
    
    // Fade in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('activity_id', params.id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;

      setActivityLogs(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const totalDuration = data.reduce((sum, log) => sum + log.duration, 0);
        const totalDistance = data.reduce((sum, log) => sum + (log.distance || 0), 0);
        
        setStats({
          totalSessions: data.length,
          averageDuration: Math.round(totalDuration / data.length),
          totalDistance: Number(totalDistance.toFixed(2))
        });
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchActivityDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setActivity(data);
    } catch (error) {
      console.error('Error fetching activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !activity) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4B7BF5" />
        <Text style={styles.loadingText}>Loading activity details...</Text>
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
        return ['#4B7BF5', '#2E5BDB'] as [string, string];
      case 'hiking':
        return ['#4CAF50', '#388E3C'] as [string, string];
      case 'biking':
        return ['#FF5722', '#E64A19'] as [string, string];
      case 'swimming':
        return ['#03A9F4', '#0288D1'] as [string, string];
      case 'weightlifting':
        return ['#9C27B0', '#7B1FA2'] as [string, string];
      case 'walking':
        return ['#FF9800', '#F57C00'] as [string, string];
      default:
        return ['#607D8B', '#455A64'] as [string, string];
    }
  };

  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{
          title: activity.name,
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={getGradientColors(activity.category)}
            style={styles.headerGradient}
          >
            <View style={styles.headerIconContainer}>
              <Ionicons 
                name={getActivityIcon(activity.category)} 
                size={64} 
                color="rgba(255,255,255,0.9)" 
              />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.headerCategory}>{activity.category}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => router.push({
              pathname: '/logActivity',
              params: { id: activity.id, name: activity.name }
            })}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Log Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Coming Soon', 'Group events feature will be available soon!')}
          >
            <Ionicons name="people-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Create Group Event</Text>
          </TouchableOpacity>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>

        {/* Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>{stats.totalSessions}</Text>
              <Text style={styles.statsLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>{stats.averageDuration}m</Text>
              <Text style={styles.statsLabel}>Avg Duration</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>{stats.totalDistance}km</Text>
              <Text style={styles.statsLabel}>Total Distance</Text>
            </View>
          </View>
        </View>

        {/* Recent History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent History</Text>
          {activityLogs.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No activity logs yet</Text>
              <Text style={styles.emptyStateMessage}>Start logging your activities to see them here</Text>
            </View>
          ) : (
            activityLogs.map((log) => (
              <TouchableOpacity 
                key={log.id} 
                style={styles.historyItem}
                onPress={() => router.push({
                  pathname: '/activityLogDetail',
                  params: { id: log.id }
                })}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {new Date(log.date).toLocaleDateString()}
                  </Text>
                  <View style={styles.historyMeta}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.historyMetaText}>{log.duration}m</Text>
                    {log.distance && (
                      <>
                        <Ionicons name="map-outline" size={16} color="#666" />
                        <Text style={styles.historyMetaText}>{log.distance}km</Text>
                      </>
                    )}
                  </View>
                </View>
                {log.notes && (
                  <Text style={styles.historyNotes} numberOfLines={2}>{log.notes}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
    height: 140,
  },
  headerGradient: {
    flex: 1,
    padding: 20,
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
  headerContent: {
    alignItems: 'center',
  },
  headerCategory: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4B7BF5',
  },
  secondaryButton: {
    backgroundColor: '#2E5BDB',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyMetaText: {
    fontSize: 14,
    color: '#666',
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 10,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
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
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 320,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerCategory: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#4B7BF5',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    gap: 16,
    marginBottom: 8,
  },
  statsItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#F8F9FA',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B7BF5',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  historyItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyMetaText: {
    fontSize: 14,
    color: '#666',
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
  },
});

export default ActivityView; 