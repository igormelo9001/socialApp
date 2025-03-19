import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContactsScreen from '../screens/ContactsScreen';
import MessageScreen from '../screens/MessageScreen';
import PostScreen from '../screens/PostScreen';
import VideoFeedScreen from '../screens/VideoFeedScreen'; // Importe a nova tela
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Importe os ícones
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Post') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'VideoFeed') {
            iconName = focused ? 'videocam' : 'videocam-outline'; // Ícone para a tela de vídeos
          }

          // Escolhe o ícone apropriado para cada tela
          if (route.name === 'VideoFeed') {
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          } else {
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#1E90FF', // Dodger Blue
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Post" component={PostScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Messages" component={MessageScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen
        name="VideoFeed"
        component={VideoFeedScreen}
        options={{
          tabBarLabel: 'Vídeos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="video" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;