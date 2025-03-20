import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import ChatScreen from '../screens/ChatScreen'; 
import SendMessageScreen from '../screens/SendMessageScreen' // Verifique se o caminho e o nome estão corretos
import VideoFeedScreen from '../screens/VideoFeedScreen';
import MyPicturesScreen from '../screens/MyDocumentsScreen';



const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SendMessage" component={SendMessageScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="VideoFeed" component={VideoFeedScreen} />
      <Stack.Screen 
        name="MyPictures" 
        component={MyPicturesScreen}
        options={{
          headerShown: true,
          title: 'My Documents',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
