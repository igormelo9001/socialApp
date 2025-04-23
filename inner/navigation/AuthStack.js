import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import ChatScreen from '../screens/ChatScreen';
import SendMessageScreen from '../screens/SendMessageScreen';
import VideoFeedScreen from '../screens/VideoFeedScreen';
import MyPicturesScreen from '../screens/MyDocumentsScreen';
import ContactProfileScreen from '../screens/ContactProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import BlockchainWalletChecker from '../screens/BlockChainWalletChecker';
import ServicesScreen from '../screens/ServicesScreen';
import ForumScreen from '../screens/ForumScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import CommunityDetailsScreen from '../screens/CommunityDetailsScreen';
import CreatePollScreen from '../screens/CreatePollScreen';
import PollDetailsScreen from '../screens/PollDetailsScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import OfferScreen from '../screens/OfferScreen';

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
      <Stack.Screen name="ContactProfile" component={ContactProfileScreen} />
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
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="BlockchainWalletChecker" component={BlockchainWalletChecker} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} />
      <Stack.Screen name="CommunityDetails" component={CommunityDetailsScreen} />
      <Stack.Screen name="CreatePoll" component={CreatePollScreen} />
      <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="Offer" component={OfferScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
