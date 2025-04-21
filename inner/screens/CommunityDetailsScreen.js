import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CommunityDetailsScreen = ({ route, navigation }) => {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [polls, setPolls] = useState([]);
  const [image, setImage] = useState(null);

  useEffect(() => {
    // Buscar detalhes da comunidade
    const unsubscribeCommunity = onSnapshot(
      collection(db, 'communities'),
      (snapshot) => {
        const communityData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .find((c) => c.id === communityId);
        setCommunity(communityData);
      }
    );

    // Buscar enquetes da comunidade
    const pollsQuery = query(
      collection(db, 'communities', communityId, 'polls')
    );
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      const fetchedPolls = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPolls(fetchedPolls);
    });

    return () => {
      unsubscribeCommunity();
      unsubscribePolls();
    };
  }, [communityId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    const storage = getStorage();
    const imageRef = ref(storage, `communityImages/${Date.now()}.jpg`);
    const response = await fetch(image);
    const blob = await response.blob();

    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleCreateCommunity = async () => {
    if (!name || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const imageUrl = await uploadImage();
      await addDoc(collection(db, 'communities'), {
        name,
        description,
        isPrivate,
        image: imageUrl || null,
        ownerId: 'user-id-placeholder', // Substituir pelo ID do usuário autenticado
        createdAt: new Date(),
      });
      Alert.alert('Sucesso', 'Comunidade criada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a comunidade.');
      console.error(error);
    }
  };

  const renderPoll = ({ item }) => (
    <TouchableOpacity style={styles.pollItem}>
      <Text style={styles.pollTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (!community) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Detalhes da comunidade */}
      <Image source={{ uri: community.image }} style={styles.communityImage} />
      <Text style={styles.communityName}>{community.name}</Text>
      <Text style={styles.communityDescription}>{community.description}</Text>

      {/* Image Picker */}
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={styles.imagePickerText}>Selecionar Imagem</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.previewImage} />}

      {/* Lista de enquetes */}
      <Text style={styles.sectionTitle}>Enquetes</Text>
      <FlatList
        data={polls}
        renderItem={renderPoll}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma enquete encontrada.</Text>}
      />

      {/* Botão para criar enquete */}
      <TouchableOpacity
        style={styles.createPollButton}
        onPress={() => navigation.navigate('CreatePoll', { communityId })}
      >
        <Text style={styles.createPollButtonText}>Criar Enquete</Text>
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
  communityImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  communityName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pollItem: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
  },
  pollTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  createPollButton: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createPollButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePicker: {
    padding: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default CommunityDetailsScreen;