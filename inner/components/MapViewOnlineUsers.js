import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

// Dados mockados melhorados
const mockUsers = [
  { 
    id: 1, 
    name: 'João', 
    position: { latitude: -23.5505, longitude: -46.6333 },
    online: true,
    lastActive: new Date(),
    skills: ['Elétrica', 'Hidráulica']
  },
  { 
    id: 2, 
    name: 'Maria', 
    position: { latitude: -23.5510, longitude: -46.6340 },
    online: false,
    lastActive: new Date(),
    skills: ['Pintura']
  },
];

const MapViewOnlineUsers = () => {
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Solicitar permissões de localização
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // Obter localização do usuário
  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      },
      error => console.error('Error getting location:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    const init = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        getUserLocation();
      }
    };
    init();
  }, []);

  // Renderizar marcadores personalizados
  const renderMarkers = () => {
    return mockUsers
      .filter(user => user.online)
      .map(user => (
        <Marker
          key={user.id}
          coordinate={user.position}
          title={user.name}
          description={`Habilidades: ${user.skills.join(', ')}`}
        >
          <View style={styles.marker}>
            <View style={[styles.markerDot, user.online && styles.online]} />
            <Text style={styles.markerText}>{user.name}</Text>
          </View>
        </Marker>
      ));
  };

  if (!region) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
      >
        {renderMarkers()}
        {userLocation && (
          <Marker coordinate={userLocation}>
            <View style={styles.currentLocationMarker} />
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginVertical: 20,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff0000',
  },
  online: {
    backgroundColor: '#00ff00',
  },
  markerText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  currentLocationMarker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default MapViewOnlineUsers;