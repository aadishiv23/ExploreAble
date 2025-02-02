import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { Input, Button } from '@rneui/themed';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const Authentication = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAppleAuthAvailability = async () => {
      try {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleAuthAvailable(isAvailable);
      } catch (error) {
        console.log('Apple Authentication not available:', error);
        setAppleAuthAvailable(false);
      }
    };

    if (Platform.OS === 'ios') {
      checkAppleAuthAvailability();
    }
  }, []);

  const handleProfileCheck = async (userId: string) => {
    try {
      console.log('Checking profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No profile found, redirecting to setup');
          router.replace('/profileSetup');
        } else {
          throw error;
        }
      } else {
        console.log('Profile exists, redirecting to home');
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Profile check error:', error);
      Alert.alert('Error', 'Failed to check user profile. Please try again.');
    }
  };

  const signInWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      
      if (data?.user) {
        console.log('User signed in:', data.user);
        await handleProfileCheck(data.user.id);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert('Sign In Error', error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;
        
        if (data?.user) {
          console.log('Apple sign-in successful:', data.user);
          await handleProfileCheck(data.user.id);
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple sign-in was canceled');
      } else {
        console.error('Apple sign-in error:', error);
        Alert.alert('Authentication Error', error.message || 'Failed to sign in with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#2E3192', '#1BFFFF']} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🌐</Text>
          </View>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>ExploreAble</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder="Email"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            inputStyle={styles.inputText}
            containerStyle={styles.inputContainer}
            inputContainerStyle={styles.inputField}
            disabled={loading}
          />

          <Input
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            inputStyle={styles.inputText}
            containerStyle={styles.inputContainer}
            inputContainerStyle={styles.inputField}
            disabled={loading}
          />

          <Button
            title="Sign in"
            onPress={signInWithEmail}
            loading={loading}
            disabled={loading}
            buttonStyle={styles.signInButton}
            titleStyle={styles.signInButtonText}
          />

          {Platform.OS === 'ios' && appleAuthAvailable && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoIcon: {
    fontSize: 30,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 5,
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  inputContainer: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  inputText: {
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#2E3192',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 10,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    color: '#666',
    paddingHorizontal: 10,
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
});

export default Authentication;