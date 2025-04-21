import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const CommunityDetailsScreen = ({ route, navigation }) => {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [polls, setPolls] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
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
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      console.error('Nenhuma imagem selecionada.');
      return null;
    }

    try {
      const storage = getStorage();
      const imageRef = ref(storage, `images/communityImages/${Date.now()}.jpg`); // Ajustar o caminho para corresponder às regras
      const response = await fetch(image); // Buscar a imagem localmente
      const blob = await response.blob(); // Converter para blob

      await uploadBytes(imageRef, blob); // Fazer o upload para o Firebase Storage
      const downloadURL = await getDownloadURL(imageRef); // Obter a URL pública da imagem
      console.log('Imagem enviada com sucesso:', downloadURL); // Log da URL da imagem
      return downloadURL;
    } catch (error) {
      console.error('Erro ao enviar a imagem:', error);
      return null;
    }
  };

  const handleCreateCommunity = async () => {
    if (!name || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const imageUrl = await uploadImage(); // Fazer o upload da imagem e obter a URL
      if (!imageUrl) {
        Alert.alert('Erro', 'Não foi possível enviar a imagem.');
        return;
      }

      await addDoc(collection(db, 'communities'), {
        name,
        description,
        isPrivate,
        image: imageUrl, // Salvar a URL da imagem no Firestore
        ownerId: 'user-id-placeholder', // Substituir pelo ID do usuário autenticado
        createdAt: new Date(),
      });

      Alert.alert('Sucesso', 'Comunidade criada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a comunidade.');
      console.error('Erro ao criar a comunidade:', error);
    }
  };

  const handleSaveImage = async () => {
    if (!image) {
      Alert.alert('Erro', 'Nenhuma imagem selecionada.');
      return;
    }

    try {
      const imageUrl = await uploadImage(); // Fazer o upload da imagem e obter a URL
      if (!imageUrl) {
        Alert.alert('Erro', 'Não foi possível enviar a imagem.');
        return;
      }

      // Atualizar o campo `image` no Firestore para a comunidade atual
      const communityRef = collection(db, 'communities');
      const communityDoc = communityId; // ID da comunidade atual
      await updateDoc(doc(communityRef, communityDoc), {
        image: imageUrl,
      });

      Alert.alert('Sucesso', 'Imagem salva com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a imagem.');
      console.error('Erro ao salvar a imagem:', error);
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

      {/* Botão para salvar a imagem */}
      <TouchableOpacity style={styles.createButton} onPress={handleSaveImage}>
        <Text style={styles.createButtonText}>Salvar Imagem</Text>
      </TouchableOpacity>

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
  createButton: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CommunityDetailsScreen;