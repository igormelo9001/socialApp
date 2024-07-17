// screens/PostScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

const PostScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.uri);
    }
  };

  const handlePost = async () => {
    if (text || image) {
      try {
        const post = {
          text,
          user: auth.currentUser.email,
          createdAt: serverTimestamp(),
        };

        if (image) {
          post.image = image;
        }

        const postsCollectionRef = collection(db, 'posts');
        await addDoc(postsCollectionRef, post);
        navigation.goBack(); // Navegar de volta após o post
      } catch (error) {
        console.error('Erro ao criar post:', error);
        alert('Erro ao criar post. Tente novamente.');
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
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Button title="Post" onPress={handlePost} />
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
  image: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
});

export default PostScreen;
