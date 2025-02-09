import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppGradient from '@/components/AppGradient';
import { router } from 'expo-router';

const ACTIVITY_OPTIONS = ["Running", "Walking", "Cycling"];

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

const QuickStartCard = ({ activity}: { activity: string; onPress: () => void }) => {
  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'Running':
        return 'fitness';
      case 'Walking':
        return 'walk';
      case 'Cycling':
        return 'bicycle';
      default:
        return 'walk';
    }
  };

  const handlePress = () => {
    router.push(`/(tabs)/configure/${activity.toLowerCase()}` as any);
  };

  return (
    <Pressable onPress={handlePress} style={styles.quickStartCard}>
      <View style={styles.quickStartCardContent}>
        <View style={styles.iconCircle}>
          <Ionicons name={getActivityIcon(activity)} size={24} color="#007AFF" />
        </View>
        <Text style={styles.activityLabel}>{activity}</Text>
      </View>
    </Pressable>
  );
};

const AllActivitiesCard = ({ activity, onPress }: { activity: string; onPress: () => void }) => {
  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'Running':
        return 'fitness';
      case 'Walking':
        return 'walk';
      case 'Cycling':
        return 'bicycle';
      default:
        return 'walk';
    }
  };

  const handlePress = () => {
    router.push(`/(tabs)/configure/${activity.toLowerCase()}` as any);
  };

  return (
    <Pressable onPress={handlePress} style={styles.allActivitiesCard}>
      <View style={styles.allActivitiesCardContent}>
        <View style={styles.iconRectangle}>
          <View style={styles.iconCircle}>
            <Ionicons name={getActivityIcon(activity)} size={24} color="#007AFF" />
          </View>
        </View>
        <Text style={styles.activityLabel}>{activity}</Text>
      </View>
    </Pressable>
  );
};

const HomeScreen = () => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    console.log('Selected activity:', activity);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <DailyUpdateCard />

        <View style={styles.quickStartSection}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickStartScrollContent}
          >
            {ACTIVITY_OPTIONS.map((activity) => (
              <QuickStartCard
                key={activity}
                activity={activity}
                onPress={() => handleActivitySelect(activity)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.allActivitiesSection}>
          <Text style={styles.sectionTitle}>All Activities</Text>
            {ACTIVITY_OPTIONS.map((activity) => (
              <AllActivitiesCard 
                key={activity} 
                activity={activity}
                onPress={() => handleActivitySelect(activity)} 
              />
            ))}
        </View>
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 16,
    marginBottom: 15,
  },
  quickStartScrollContent: {
    paddingHorizontal: 16,
  },
  quickStartCard: {
    width: 100,
    marginRight: 15,
  },
  quickStartCardContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  allActivitiesSection: {
    marginTop: 20,
  },  
  allActivitiesCard: {  
    margin: 16,
    borderRadius: 20,
  },
  iconRectangle: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    backgroundColor: 'rgba(0,122,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  allActivitiesCardContent: {
    alignItems: 'center',
  },
});

export default HomeScreen;