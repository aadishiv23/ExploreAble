import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const App = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const navigateBasedOnSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Navigate to home or tabs if logged in
                router.replace('/(tabs)/affirmations');
            } else {
                // Navigate to splash screen if not logged in
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

    return null; // The routing logic will handle which screen to display.
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
