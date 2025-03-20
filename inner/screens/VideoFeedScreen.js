import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const VideoFeedScreen = () => {
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const playerRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(videosData);
    });

    return () => unsubscribe();
  }, []);

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
        userId: auth.currentUser?.uid,
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

  const renderVideoItem = ({ item }) => (
    <View style={styles.videoItem}>
      <Video
        source={{ uri: item.url }}
        style={styles.videoPlayer}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={false}
      />
    </View>
  );

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
        <View style={styles.uploadContainer}>
          <Video
            ref={playerRef}
            source={{ uri: video }}
            style={styles.previewVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
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

      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        style={styles.videoList}
      />
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
  uploadContainer: {
    marginBottom: 20,
  },
  previewVideo: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  uploadButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
  },
  videoList: {
    flex: 1,
  },
  videoItem: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  videoPlayer: {
    width: '100%',
    height: 250,
  },
});

export default VideoFeedScreen;