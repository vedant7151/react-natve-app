import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native'; // ✅ add this import

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 2,
          borderTopColor: '#dee2e6',
        },
      }}
    >
      <Tabs.Screen
        name="signToText"
        options={{
          title: 'Sign to Text',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📹</Text>, // ✅ works now
        }}
      />
      <Tabs.Screen
        name="textToSign"
        options={{
          title: 'Text to Sign',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>✍️</Text>,
        }}
      />
    </Tabs>
  );
}
