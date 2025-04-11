import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const mockUsers = [
  { id: 1, name: 'João', latitude: -23.5505, longitude: -46.6333 },
  { id: 2, name: 'Maria', latitude: -23.5510, longitude: -46.6340 },
];

const MapViewOnlineUsers = () => {
  const initialRegion = {
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
      >
        {mockUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={{ 
              latitude: user.latitude, 
              longitude: user.longitude 
            }}
            title={user.name}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default MapViewOnlineUsers;