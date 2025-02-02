import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const App = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const navigateBasedOnSession = async () => {
            try {
                console.log('Checking user session...');
                const { data, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error('Session error:', sessionError);
                    router.replace('/splash');
                    return;
                }

                if (!data.session?.user) {
                    console.log('No active session, redirecting to splash');
                    router.replace('/splash');
                    return;
                }

                const userId = data.session.user.id;
                console.log('User found, checking profile existence for ID:', userId);
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select()
                    .eq('id', userId)
                    .single();

                console.log('Profile check result:', { profile, error: profileError });

                if (profileError) {
                    if (profileError.code === 'PGRST116') {
                        console.log('No profile found, redirecting to setup');
                        router.replace('/profileSetup');
                    } else {
                        console.error('Profile error:', profileError);
                        router.replace('/splash');
                    }
                    return;
                }

                if (profile) {
                    console.log('Profile exists, redirecting to home');
                    router.replace('/(tabs)/home');
                } else {
                    console.log('No profile found, redirecting to setup');
                    router.replace('/profileSetup');
                }
            } catch (error: any) {
                console.error('Initial navigation error:', error);
                Alert.alert('Session Error', 'Please try signing in again');
                router.replace('/splash');
            }
        };

        navigateBasedOnSession().finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});

export default App;
