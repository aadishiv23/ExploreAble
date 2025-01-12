import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Input, Button } from '@rneui/themed';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Adjust the path based on your project structure


const Authentication = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signInWithEmail = () => {
    setLoading(true);
    console.log('Attempting to sign in with email:', email);
    setTimeout(() => {
      setLoading(false);
      console.log('Sign-in successful for email:', email);
      Alert.alert('Signed In', `Welcome back, ${email}`);
    }, 1000);
  };

  const navigateToTabs = () => {
    console.log('Navigating to tabs view');
    router.replace('/(tabs)/nature-meditate');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign into your account</Text>

      {/* Email Input */}
      <Input
        placeholder="Email"
        onChangeText={(text) => {
          setEmail(text);
          console.log('Email input changed:', text);
        }}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#888' }}
        inputStyle={styles.inputText}
        containerStyle={styles.inputContainer}
        inputContainerStyle={styles.inputField}
      />

      {/* Password Input */}
      <Input
        placeholder="Password"
        onChangeText={(text) => {
          setPassword(text);
          console.log('Password input changed');
        }}
        value={password}
        secureTextEntry
        leftIcon={{ type: 'font-awesome', name: 'lock', color: '#888' }}
        inputStyle={styles.inputText}
        containerStyle={styles.inputContainer}
        inputContainerStyle={styles.inputField}
      />

      {/* Sign In Button */}
      <Button
        title="Sign in"
        onPress={signInWithEmail}
        loading={loading}
        buttonStyle={styles.signInButton}
        titleStyle={styles.signInButtonText}
      />

      <Text style={styles.orText}>OR</Text>

      {/* Sign in with Apple */}
      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          style={styles.appleButton}
          onPress={async () => {
    console.log('Sign in with Apple button pressed');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('Apple sign-in credential:', credential);

      // Sign in via Supabase Auth.
      if (credential.identityToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          console.error('Error signing in with Supabase:', error.message);
          Alert.alert('Sign-In Failed', error.message);
          return;
        }

        console.log('User signed in successfully:', data);
        router.replace('/(tabs)/affirmations'); // Navigate to tabs
      } else {
        throw new Error('No identityToken received from Apple.');
      }
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple sign-in canceled by user');
      } else {
        console.error('Error during Apple sign-in:', e);
      }
    }
  }}
        />
      )}

      {/* Navigate to Tabs Button */}
      <Button
        title="Go to Tabs"
        onPress={navigateToTabs}
        buttonStyle={styles.navigateToTabsButton}
        titleStyle={styles.navigateToTabsButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputText: {
    fontSize: 16,
    paddingHorizontal: 10,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signInButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 12,
    borderRadius: 4,
    width: '100%',
    height: 50,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
    fontSize: 16,
  },
  appleButton: {
    width: '100%',
    height: 50,
    borderRadius: 4, // Rounded corners for Apple button
    overflow: 'hidden', // Ensure proper clipping of rounded edges
  },
  navigateToTabsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 4,
    width: '100%',
    marginTop: 20,
  },
  navigateToTabsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Authentication;
