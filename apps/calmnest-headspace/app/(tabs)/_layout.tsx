import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { theme } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...theme.shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "sunny" : "sunny-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="meditate"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "leaf" : "leaf-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Rest',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "moon" : "moon-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
