// Shared UI components for every file within dir
// in every directory
// shared elemen that are dipsplayed and persisted between page transitions
import { Slot, Stack } from 'expo-router';

export default function RootLayout() {
    return (
        // acts same as children prop in web apps, and renders index page or App componenet
        <Stack>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="authentication" options={{ title: 'Sign In', headerShown: false }} />
            <Stack.Screen 
                name="profileSetup" 
                options={{ 
                    headerShown: false,
                }} 
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
                name="searchProfileView" 
                options={{
                    title: 'Profile',
                    headerBackTitle: 'Back',
                    presentation: 'card',
                }}
            />
            <Stack.Screen 
                name="createActivity" 
                options={{
                    title: 'Create Activity',
                    headerBackTitle: 'Back',
                    presentation: 'card',
                }}
            />
        </Stack>
    );
}