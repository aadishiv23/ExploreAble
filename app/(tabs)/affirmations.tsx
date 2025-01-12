import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import AppGradient from '@/components/AppGradient';
import AFFIRMATION_GALLERY from '@/constants/affirmation-gallery';
import GuidedAffirmationsGallery from '@/components/GuidedAffirmationsGallery';
import { supabase } from '@/lib/supabase'; // Ensure the Supabase client is imported
import { useRouter } from 'expo-router';

const Affirmations = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out:', error.message);
      } else {
        console.log('User signed out successfully');
        router.replace('/splash'); // Redirect to splash screen
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppGradient colors={['#2e1f58', '#54426b', '#a790af']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Change your beliefs with affirmations</Text>
          <View>
            {AFFIRMATION_GALLERY.map((g) => (
              <GuidedAffirmationsGallery key={g.title} title={g.title} previews={g.data} />
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </AppGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  signOutButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Affirmations;
