import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const CreatePollScreen = ({ route, navigation }) => {
  const { communityId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreatePoll = async () => {
    if (!title || !description) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      await addDoc(collection(db, 'communities', communityId, 'polls'), {
        title,
        description,
        createdAt: new Date(),
      });
      Alert.alert('Sucesso', 'Enquete criada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a enquete.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Enquete</Text>

      <TextInput
        style={styles.input}
        placeholder="Título da enquete"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Descrição da enquete"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.createButton} onPress={handleCreatePoll}>
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
});

export default CreatePollScreen;