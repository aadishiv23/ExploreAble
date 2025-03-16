import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  activity_id: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    pfpUrl: string | null;
  };
  activity: {
    name: string;
    category: string;
  } | null;
  likes_count: number;
  comments_count: number;
  participants: {
    id: string;
    name: string;
  }[];
}

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_id (
            id,
            name,
            pfpUrl:avatar_url
          ),
          activity:activity_id (
            name,
            category
          ),
          participants:post_participants (
            user:user_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Post interface
      const transformedPosts: Post[] = (data || []).map((post: any) => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        image_url: post.image_url,
        activity_id: post.activity_id,
        created_at: post.created_at,
        user: post.user,
        activity: post.activity,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        participants: post.participants?.map((p: any) => p.user) || []
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  const handleLike = async (postId: string) => {
    // This would be implemented to like a post
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    // Navigate to comments screen
    router.push(`/comments?postId=${postId}`);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const formattedDate = format(new Date(item.created_at), 'MMM d, yyyy');
    
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            {item.user.pfpUrl ? (
              <Image source={{ uri: item.user.pfpUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{item.user.name[0]}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.postDate}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {item.activity && (
          <View style={styles.activityTag}>
            <Ionicons 
              name={item.activity.category === 'running' ? 'fitness' : 
                    item.activity.category === 'cycling' ? 'bicycle' : 
                    item.activity.category === 'walking' ? 'walk' : 'body'} 
              size={16} 
              color="#4B7BF5" 
            />
            <Text style={styles.activityText}>{item.activity.name}</Text>
          </View>
        )}

        <Text style={styles.postContent}>{item.content}</Text>

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.postImage} />
        )}

        {item.participants.length > 0 && (
          <View style={styles.participantsContainer}>
            <Text style={styles.participantsLabel}>With:</Text>
            <View style={styles.participantsList}>
              {item.participants.map((participant, index) => (
                <Text key={participant.id} style={styles.participantName}>
                  {participant.name}{index < item.participants.length - 1 ? ', ' : ''}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleLike(item.id)}
          >
            <Ionicons name="heart-outline" size={24} color="#666" />
            <Text style={styles.actionText}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleComment(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Feed',
          headerShadowVisible: false,
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BF5" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4B7BF5']}
              tintColor="#4B7BF5"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
              <Text style={styles.emptyStateText}>
                Be the first to share your activity!
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/createPost')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  feedContent: {
    padding: 16,
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#4B7BF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 14,
    color: '#666',
  },
  activityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F1FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#4B7BF5',
    marginLeft: 6,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  participantsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  participantsLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantName: {
    fontSize: 14,
    color: '#4B7BF5',
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B7BF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
}); 