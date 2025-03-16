import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Colors from '@/constants/Colors'
import { MaterialCommunityIcons, Entypo, Ionicons, Feather } from '@expo/vector-icons';

const TabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarStyle: {
                    borderTopColor: '#f0f0f0',
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    headerShown: true,
                    title: "ExploreAble",
                    headerShadowVisible: false,
                    headerStyle: {
                        backgroundColor: '#fff',
                    },
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: 24,
                    },
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="home" size={24} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="activities"
                options={{
                    tabBarLabel: "Activities",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="fitness" size={24} color={color} />
                    )
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    tabBarLabel: "Search",
                    tabBarIcon: ({ color }) => (
                        <Feather name="search" size={24} color={color} />
                    )
                }}
            />
            
            <Tabs.Screen
                name="community"
                options={{
                    tabBarLabel: "Community",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="people" size={24} color={color} />
                    )
                }}
            />
            
            <Tabs.Screen
                name="profile"
                options={{
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: {
                        backgroundColor: '#fff',
                    },
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="person" size={24} color={color} />
                    )
                }}
            />
        </Tabs>
    );
};

export default TabsLayout;