import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Linking, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase';
import { ProgressBar } from 'react-native-paper';

const MyPicturesScreen = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    // Solicitar permissões para acessar a galeria de imagens
    const getPermission = async () => {
      console.log('Solicitando permissões de galeria...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Status da permissão de galeria:', status);
      if (status !== 'granted') {
        alert('Desculpe, precisamos de permissões de galeria para isso funcionar!');
      }
    };

    getPermission();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser.uid;
      const q = query(collection(db, 'users', userId, 'images'));
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching images:', error);
      alert('Erro ao buscar imagens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      console.log('Starting image upload...');
      setUploading(true);

      // Use a imagem selecionada ou solicite uma nova
      const imageUri = newImage ? newImage : await pickImage();

      if (imageUri) {
        console.log('Image selected:', imageUri);
        const name = imageUri.split('/').pop();
        const userId = auth.currentUser.uid;

        // Upload to Firebase Storage with progress tracking
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `images/${userId}/${name}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem: ' + error.message);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Upload complete, download URL:', downloadURL);
              // Store image metadata in Firestore
              const docRef = await addDoc(collection(db, 'users', userId, 'images'), {
                fileName: name,
                fileType: 'image',
                uploadDate: new Date(),
                fileUrl: downloadURL,
              });
              console.log('Image uploaded with ID:', docRef.id);
              fetchDocuments(); // Refresh the document list
              setNewImage(null); // Limpar a imagem selecionada após o upload
            } catch (firestoreError) {
              console.error('Error storing image metadata in Firestore:', firestoreError);
              alert('Erro ao salvar metadados da imagem: ' + firestoreError.message);
            } finally {
              setUploadProgress(0); // Reset progress
            }
          }
        );
      } else {
        console.log('Image selection was canceled.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Usando a mesma opção do PostScreen
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setNewImage(result.assets[0].uri);
        return result.assets[0].uri; // Retorna a URI da imagem selecionada
      }
      return null; // Retorna null se a seleção for cancelada
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      alert('Erro ao selecionar imagem. Tente novamente.');
      return null;
    }
  };

  const getIconName = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return 'file-pdf';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'file-word';
      default:
        return 'file';
    }
  };

  const renderImage = ({ item }) => (
    <View style={styles.post}>
      <Image source={{ uri: item.fileUrl }} style={styles.image} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Upload Section */}
      <View style={styles.uploadSection}>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Upload Pic</Text>
            </>
          )}
        </TouchableOpacity>
        {uploading && <ProgressBar progress={uploadProgress / 100} color="#007AFF" style={styles.progressBar} />}
      </View>

      {/* Pictures List Section */}
      <View style={styles.documentsSection}>
        <Text style={styles.sectionTitle}>My Pictures</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <FlatList
            data={documents}
            renderItem={renderImage}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  uploadSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  documentsSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  documentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  downloadButton: {
    padding: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    marginTop: 10,
    height: 5,
  },
  post: {
    flex: 1,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  image: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  gridContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
});

export default MyPicturesScreen; 