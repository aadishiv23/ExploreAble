import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import AppGradient from '@/components/AppGradient'; // Reuse your gradient component if needed

const SplashScreen = () => {
  const router = useRouter();

  return (
    <ImageBackground
      source={{ uri: 'https://your-image-url.com/background.jpg' }} // Replace with a slick background image URL
      style={styles.background}
      resizeMode="cover"
    >
      <AppGradient colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to ExploreAble</Text>
          <Text style={styles.subtitle}>Find your friends and do activities!</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/authentication')} // Navigate to Authentication screen
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </AppGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF5733',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SplashScreen;
