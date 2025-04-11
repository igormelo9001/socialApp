import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ServicesScreen = () => {
  const [searchText, setSearchText] = useState('');
  
  // Lista completa de serviços
  const allServices = [
    { name: 'Elétrica', icon: 'flash' },
    { name: 'Encanamento', icon: 'pipe' },
    { name: 'Pintura', icon: 'brush' },
    { name: 'Alvenaria', icon: 'wall' },
    { name: 'Limpeza', icon: 'broom' },
  ];

  // Filtra os serviços conforme o texto digitado
  const filteredServices = allServices.filter(service =>
    service.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Barra de Pesquisa */}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar serviço..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Lista de Serviços */}
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
    width: '48%', // Para criar layout de 2 colunas
  },
  serviceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  mapWrapper: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    height: 400, // Altura fixa para melhor performance
  },
});

export default ServicesScreen;