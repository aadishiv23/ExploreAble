import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' }, 
  { id: 'non-binary', label: 'Non-binary'},
  { id: 'undisclosed', label: 'Prefer not to say'}
];

const ProfileSetup = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isFormValid = name.trim() && gender.trim();

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting profile creation...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error(authError?.message || 'User not authenticated');
      }

      console.log('Creating profile for user:', user.id);
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          name,
          age: parseInt(age, 10),
          gender,
        }]);

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      console.log('Profile created successfully, redirecting...');
      router.replace('/(tabs)/affirmations');
    } catch (err) {
      console.error('Profile setup error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const GenderOption = ({ option, selected, onSelect }: { option: typeof GENDER_OPTIONS[0], selected: boolean, onSelect: () => void }) => (
    <Pressable 
      style={[styles.genderOption, selected && styles.selectedGenderOption]}
      onPress={onSelect}
    >
      <Text style={[styles.genderOptionText, selected && styles.selectedGenderOptionText]}>
        {option.label}
      </Text>
    </Pressable>
  );

  return (
    <LinearGradient colors={['#2E3192', '#1BFFFF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageCircle}>
            <Ionicons name="person" size={60} color="white" />
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter name here"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.ageContainer}>
            <Text style={styles.label}>Age: {age}</Text>
            <View style={styles.sliderContainer}>
              <TextInput 
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Age"
                placeholderTextColor="rgba(255,255,255,0.7)"
              />
            </View>
          </View>

          <View style={styles.genderContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderOptionsContainer}>
              {GENDER_OPTIONS.map((option) => (
                <GenderOption
                  key={option.id}
                  option={option}
                  selected={gender === option.id}
                  onSelect={() => setGender(option.id)}
                />
              ))}
            </View>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? '' : "Create Profile"}
            onPress={handleSubmit}
            loading={loading}
            buttonStyle={[
              styles.button,
              !isFormValid && styles.buttonDisabled
            ]}
            titleStyle={styles.buttonText}
            disabled={loading || !isFormValid}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  profileImageCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    marginTop: 40,
    gap: 24,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2E3192',
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ageContainer: {
    gap: 8,
  },
  sliderContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 16,
  },
  genderContainer: {
    gap: 8,
  },
  genderOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedGenderOption: {
    backgroundColor: 'white',
  },
  genderOptionText: {
    color: 'white',
    fontSize: 14,
  },
  selectedGenderOptionText: {
    color: '#2E3192',
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  button: {
    height: 56,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#2E3192',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
  }
});

export default ProfileSetup;