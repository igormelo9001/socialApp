import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { OPENAI_API_KEY } from '@env'; // Importação correta da chave

const PostScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [promptText, setPromptText] = useState(''); // Novo estado para o prompt

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Desculpe, precisamos de permissões de galeria para isso funcionar!');
      }
    };

    getPermission();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uuidv4();
    const storageRef = ref(storage, `images/${filename}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handlePost = async () => {
    if (text || image) {
      setUploading(true);
      try {
        let imageUrl = null;
        if (image) {
          imageUrl = await uploadImage(image);
        }

        const post = {
          text,
          image: imageUrl,
          user: auth.currentUser.email,
          createdAt: serverTimestamp(),
        };

        const postsCollectionRef = collection(db, 'posts');
        await addDoc(postsCollectionRef, post);
        navigation.goBack();
      } catch (error) {
        console.error('Erro ao criar post:', error);
        alert('Erro ao criar post. Tente novamente.');
      } finally {
        setUploading(false);
      }
    } else {
      alert('Por favor, adicione texto ou imagem ao post.');
    }
  };

  const handlePromptPost = async () => {
    if (!promptText) {
      alert('Por favor, insira um prompt.');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano', // Alterado para usar o modelo GPT-4.1-nano
          prompt: promptText,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        console.error(`Erro na API: ${response.status} - ${response.statusText}`);
        alert('Erro ao processar o prompt. Tente novamente.');
        return;
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.text?.trim() || 'Erro ao gerar texto.';

      const post = {
        text: generatedText,
        user: auth.currentUser.email,
        createdAt: serverTimestamp(),
      };

      const postsCollectionRef = collection(db, 'posts');
      await addDoc(postsCollectionRef, post);
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao processar prompt:', error);
      alert('Erro ao processar prompt. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const generateImage = async (prompt) => {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: prompt, // Descrição do desenho que você quer gerar
          n: 1, // Número de imagens a serem geradas
          size: '512x512', // Tamanho da imagem (ex.: 256x256, 512x512, 1024x1024)
        }),
      });

      if (!response.ok) {
        console.error(`Erro na API: ${response.status} - ${response.statusText}`);
        alert('Erro ao gerar a imagem. Tente novamente.');
        return null;
      }

      const data = await response.json();
      const imageUrl = data.data[0].url; // URL da imagem gerada
      console.log('Imagem gerada:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Erro ao gerar a imagem:', error);
      alert('Erro ao gerar a imagem. Tente novamente.');
      return null;
    }
  };

  const handleDrawPrompt = async () => {
    if (!promptText) {
      alert('Por favor, insira um prompt.');
      return;
    }

    setUploading(true);
    try {
      // Gera a imagem com base no prompt
      const imageUrl = await generateImage(promptText);
      if (!imageUrl) {
        alert('Erro ao gerar a imagem. Tente novamente.');
        return;
      }

      // Cria o post com a imagem gerada
      const post = {
        text: `Imagem gerada para o prompt: "${promptText}"`,
        image: imageUrl,
        user: auth.currentUser.email,
        createdAt: serverTimestamp(),
      };

      const postsCollectionRef = collection(db, 'posts');
      await addDoc(postsCollectionRef, post);

      // Limpa o campo de prompt após a publicação
      setPromptText('');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao processar o desenho do prompt:', error);
      alert('Erro ao processar o desenho do prompt. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Post</Text>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        value={text}
        onChangeText={setText}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an Image</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
      <TouchableOpacity style={styles.secondaryButton} onPress={handlePost} disabled={uploading}>
        <Text style={styles.secondaryButtonText}>Post</Text>
      </TouchableOpacity>
      {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}

      {/* Novo TextInput e botões para prompt */}
      <TextInput
        style={styles.input}
        placeholder="Digite seu prompt aqui"
        value={promptText}
        onChangeText={setPromptText}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handlePromptPost} disabled={uploading}>
        <Text style={styles.buttonText}>Publicar Prompt</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleDrawPrompt} disabled={uploading}>
        <Text style={styles.secondaryButtonText}>Desenhar Prompt</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5', // Fundo claro para destacar os botões
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    textAlignVertical: 'top',
    borderRadius: 8,
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50', // Verde vibrante
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Sombra para Android
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: '#2196F3', // Azul vibrante para botões secundários
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    resizeMode: 'cover',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  uploadingText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#555',
    fontSize: 14,
  },
});

export default PostScreen;
