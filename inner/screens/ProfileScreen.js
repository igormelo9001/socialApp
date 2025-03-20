// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Alert, Modal, Button } from 'react-native';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebase';
import { getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [summary, setSummary] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [emailForReset, setEmailForReset] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigation.navigate('Login');
      return;
    }

    const userId = route.params?.userId || currentUser.uid;
    setIsOwnProfile(userId === currentUser.uid);
    
    if (userId === currentUser.uid) {
      setUser(currentUser);
    } else {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: userId,
              email: userData.email,
              ...userData
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      fetchUserData();
    }

    fetchUserProfile(userId);
  }, [route.params?.userId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        fetchUserProfile(currentUser.uid);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileImage(userData.profileImage || '');
        setSummary(userData.summary || '');
      } else {
        setProfileImage('');
        setSummary('');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      alert('Erro ao carregar perfil: ' + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.navigate('Login');
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !user.uid) {
      console.error('User not authenticated');
      return;
    }

    let imageUrl = profileImage;

    if (newImage) {
      const response = await fetch(newImage);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile_images/${user.uid}`);
      await uploadBytes(storageRef, blob);
      imageUrl = await getDownloadURL(storageRef);
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        profileImage: imageUrl,
        summary: summary,
      });
    } else {
      await setDoc(userDocRef, {
        profileImage: imageUrl,
        summary: summary,
        email: user.email,
        createdAt: new Date(),
      });
    }
    
    setProfileImage(imageUrl);
    setNewImage(null);
    alert('Perfil salvo com sucesso!');
  };

  const handleRequestResetCode = async () => {
    if (!emailForReset) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailForReset);
      Alert.alert(
        'Sucesso',
        'Verifique seu e-mail para redefinição de senha.',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
      setEmailForReset('');
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição de senha:', error);
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição de senha.');
    }
  };

  // Renderização do Modal de Redefinição de Senha
  const renderResetPasswordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Redefinir Senha</Text>
          <TextInput
            placeholder="Digite seu e-mail"
            value={emailForReset}
            onChangeText={setEmailForReset}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.modalInput}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.sendButton]} 
              onPress={handleRequestResetCode}
            >
              <Text style={styles.modalButtonText}>Enviar Link</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.title}>Profile</Text>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {newImage ? (
              <Image source={{ uri: newImage }} style={styles.profileImage} />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>{user.email ? user.email[0].toUpperCase() : 'U'}</Text>
              </View>
            )}
            
            {isOwnProfile && (
              <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
                <Text style={styles.buttonText}>Selecionar Foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.info}>Email: {user.email}</Text>

          {isOwnProfile && (
            <>
              <TextInput
                style={styles.summaryInput}
                value={summary}
                onChangeText={setSummary}
                placeholder="Escreva sobre você..."
                multiline
              />
              <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.documentsButton]} 
                onPress={() => navigation.navigate('MyPictures')}
              >
                <Text style={styles.buttonText}>My Pictures</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : (
        <Text>Loading...</Text>
      )}

      {renderResetPasswordModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E0F7FA',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholderImage: {
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  summaryInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    width: '100%',
    textAlignVertical: 'top',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#FF3B30',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  documentsButton: {
    backgroundColor: '#34C759',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 12,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#007BFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
});

export default ProfileScreen;