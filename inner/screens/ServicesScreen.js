import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ServicesScreen = () => {
  const [searchText, setSearchText] = useState('');

  const allServices = [
    { name: 'Elétrica', icon: 'flash' },
    { name: 'Encanamento', icon: 'pipe' },
    { name: 'Pintura', icon: 'brush' },
    { name: 'Alvenaria', icon: 'wall' },
    { name: 'Limpeza', icon: 'broom' },
    { name: 'Jardinagem', icon: 'flower' },
    { name: 'Marcenaria', icon: 'hammer' },
    { name: 'Ar Condicionado', icon: 'air-conditioner' },
    { name: 'Vidraceiro', icon: 'window-maximize' },
    { name: 'Serralheria', icon: 'wrench' }
  ];

  const filteredServices = allServices.filter(service =>
    service.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar serviço..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={styles.servicesContainer}>
        {filteredServices.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <MaterialCommunityIcons 
              name={service.icon} 
              size={20} 
              color="#333" 
            />
            <Text style={styles.serviceText}>{service.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Em breve teremos um mapa</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  searchBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    elevation: 2,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: '48%',
  },
  serviceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  mapPlaceholder: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  }
});

export default ServicesScreen;