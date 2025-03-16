import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

interface Friend {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  category: string;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchFriends();
  }, []);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user2:user2_id (id, name),
          user1:user1_id (id, name)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const friendsList: Friend[] = (data || []).map((friendship: any) => {
        const friend = friendship.user1.id === user.id ? friendship.user2 : friendship.user1;
        return {
          id: friend.id,
          name: friend.name
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      // Resize and compress the image
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        throw new Error('Failed to process image');
      }

      const fileName = `post-${Date.now()}.jpg`;
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `${user?.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('post-images')
        .upload(filePath, decode(manipResult.base64), {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a post');
        return;
      }

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          activity_id: selectedActivity?.id || null,
          created_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add participants if any
      if (selectedFriends.length > 0 && post) {
        const participants = selectedFriends.map(friend => ({
          post_id: post.id,
          user_id: friend.id,
          created_at: new Date().toISOString()
        }));

        const { error: participantsError } = await supabase
          .from('post_participants')
          .insert(participants);

        if (participantsError) throw participantsError;
      }

      Alert.alert(
        'Success',
        'Your post has been created!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/feed')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen 
        options={{
          title: 'Create Post',
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <TextInput
          style={styles.contentInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
        />

        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={pickImage}
          >
            <Ionicons name="image" size={24} color="#4B7BF5" />
            <Text style={styles.optionText}>Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setShowActivities(!showActivities)}
          >
            <Ionicons name="fitness" size={24} color="#4CAF50" />
            <Text style={styles.optionText}>
              {selectedActivity ? selectedActivity.name : 'Add Activity'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setShowFriends(!showFriends)}
          >
            <Ionicons name="people" size={24} color="#FF9800" />
            <Text style={styles.optionText}>
              {selectedFriends.length > 0 
                ? `${selectedFriends.length} Friend${selectedFriends.length > 1 ? 's' : ''}` 
                : 'Tag Friends'}
            </Text>
          </TouchableOpacity>
        </View>

        {showActivities && (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Select Activity</Text>
            {loadingActivities ? (
              <ActivityIndicator size="small" color="#4B7BF5" />
            ) : (
              <ScrollView style={styles.selectionList}>
                {activities.map(activity => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.selectionItem,
                      selectedActivity?.id === activity.id && styles.selectedItem
                    ]}
                    onPress={() => {
                      setSelectedActivity(activity);
                      setShowActivities(false);
                    }}
                  >
                    <Ionicons 
                      name={
                        activity.category === 'running' ? 'fitness' : 
                        activity.category === 'cycling' ? 'bicycle' : 
                        activity.category === 'walking' ? 'walk' : 'body'
                      } 
                      size={20} 
                      color={selectedActivity?.id === activity.id ? '#fff' : '#4B7BF5'} 
                    />
                    <Text 
                      style={[
                        styles.selectionItemText,
                        selectedActivity?.id === activity.id && styles.selectedItemText
                      ]}
                    >
                      {activity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {showFriends && (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Tag Friends</Text>
            {loadingFriends ? (
              <ActivityIndicator size="small" color="#4B7BF5" />
            ) : (
              <ScrollView style={styles.selectionList}>
                {friends.length > 0 ? (
                  friends.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.selectionItem,
                        selectedFriends.some(f => f.id === friend.id) && styles.selectedItem
                      ]}
                      onPress={() => toggleFriendSelection(friend)}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendInitial}>{friend.name[0]}</Text>
                      </View>
                      <Text 
                        style={[
                          styles.selectionItemText,
                          selectedFriends.some(f => f.id === friend.id) && styles.selectedItemText
                        ]}
                      >
                        {friend.name}
                      </Text>
                      {selectedFriends.some(f => f.id === friend.id) && (
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noItemsText}>No friends found</Text>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.postButton, !content.trim() && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentInput: {
    fontSize: 18,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  selectionContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectionList: {
    maxHeight: 200,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: '#4B7BF5',
  },
  selectionItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedItemText: {
    color: '#fff',
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B7BF5',
  },
  noItemsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  postButton: {
    backgroundColor: '#4B7BF5',
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 