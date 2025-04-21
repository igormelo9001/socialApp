import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CreateCommunityScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [image, setImage] = useState(null); // Adicionar estado para a imagem

  const uploadImage = async () => {
    if (!image) return null;

    try {
      const storage = getStorage();
      const imageRef = ref(storage, `communityImages/${Date.now()}.jpg`);
      const response = await fetch(image);
      const blob = await response.blob();

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully:', downloadURL); // Log da URL da imagem
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreateCommunity = async () => {
    if (!name || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const imageUrl = await uploadImage(); // Obter a URL da imagem
      console.log('Image URL:', imageUrl); // Log da URL da imagem
      await addDoc(collection(db, 'communities'), {
        name,
        description,
        isPrivate,
        image: imageUrl || null, // Salvar a URL da imagem no Firestore
        ownerId: 'user-id-placeholder', // Substituir pelo ID do usuário autenticado
        createdAt: new Date(),
      });
      Alert.alert('Sucesso', 'Comunidade criada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a comunidade.');
      console.error('Error creating community:', error);
    }
  };

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
      <Text style={styles.title}>Criar Comunidade</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome da comunidade"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Descrição da comunidade"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={styles.privacyToggle}
        onPress={() => setIsPrivate(!isPrivate)}
      >
        <Text style={styles.privacyText}>
          {isPrivate ? 'Privada' : 'Pública'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateCommunity}>
        <Text style={styles.createButtonText}>Criar</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  privacyToggle: {
    padding: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  communityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default CreateCommunityScreen;