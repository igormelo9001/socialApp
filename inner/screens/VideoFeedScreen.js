import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const VideoFeedScreen = () => {
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const playerRef = useRef(null);

  // Função para selecionar vídeo
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      alert('Erro ao selecionar vídeo');
    }
  };

  // Função para fazer upload do vídeo
  const uploadVideo = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `videos/${uuidv4()}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  };

  // Função para salvar o vídeo no Firestore
  const handlePost = async () => {
    if (!video) {
      alert('Por favor, selecione um vídeo primeiro');
      return;
    }

    setUploading(true);
    try {
      const videoUrl = await uploadVideo(video);
      
      const videoDoc = {
        url: videoUrl,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid, // Assumindo que você tem autenticação configurada
      };

      await addDoc(collection(db, 'videos'), videoDoc);
      alert('Vídeo enviado com sucesso!');
      setVideo(null);
    } catch (error) {
      console.error('Error posting video:', error);
      alert('Erro ao enviar vídeo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed de Vídeos</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={pickVideo}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>Selecionar Vídeo</Text>
      </TouchableOpacity>

      {video && (
        <View style={styles.videoContainer}>
          <Video
            ref={playerRef}
            source={{ uri: video }}
            style={styles.video}
            resizeMode="contain"
            onError={(error) => console.error('Video error:', error)}
            controls={true}
          />
          
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]} 
            onPress={handlePost}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? 'Enviando...' : 'Enviar Vídeo'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    marginTop: 20,
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  uploadButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
  },
});

export default VideoFeedScreen;