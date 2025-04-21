import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../firebase'; // Importação do Firebase
import { collection, onSnapshot } from 'firebase/firestore';

const ForumScreen = ({ navigation }) => {
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    // Buscar comunidades do Firestore
    const unsubscribe = onSnapshot(collection(db, 'communities'), (snapshot) => {
      const fetchedCommunities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Comunidades carregadas:', fetchedCommunities); // Log para depuração
      setCommunities(fetchedCommunities);
    });

    return unsubscribe; // Cancelar o listener ao desmontar o componente
  }, []);

  const renderCommunity = ({ item }) => (
    <TouchableOpacity
      style={styles.communityItem}
      onPress={() => navigation.navigate('CommunityDetails', { communityId: item.id })}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/50' }} // Fallback para imagem padrão
        style={styles.communityImage}
      />
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fórum</Text>

      {/* Lista de comunidades */}
      <FlatList
        data={communities}
        renderItem={renderCommunity}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma comunidade encontrada.</Text>}
      />

      {/* Botão para criar nova comunidade */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateCommunity')}
      >
        <MaterialCommunityIcons name="plus-circle" size={40} color="black" />
        <Text style={styles.createButtonText}>Criar Comunidade</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
  },
  communityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ForumScreen;