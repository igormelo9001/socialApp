import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values'; // Importação da biblioteca
import { v4 as uuidv4 } from 'uuid';  // Para gerar IDs únicos

const PostScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Solicitar permissões para acessar a galeria de imagens
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
        navigation.goBack(); // Navegar de volta após o post
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
        <Text style={styles.buttonText}>Pick an image</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
      <Button title="Post" onPress={handlePost} disabled={uploading} />
      {uploading && <Text>Uploading...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFF',
  },
  imagePreview: {
    width: 100,
    height: 200,
    marginBottom: 16,
    resizeMode: 'cover',
  },
});

export default PostScreen;
