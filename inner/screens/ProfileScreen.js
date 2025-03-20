// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
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
      // Fetch other user's data
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
      console.log('Fetching profile for user:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data retrieved:', userData);
        
        setProfileImage(userData.profileImage || '');
        setSummary(userData.summary || '');
      } else {
        console.log('User document does not exist. Creating a new profile.');
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
    try {
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
        console.log('Image uploaded, URL:', imageUrl);
      }

      // Check if user document exists before updating
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          profileImage: imageUrl,
          summary: summary,
        });
        console.log('Profile updated successfully');
      } else {
        // Create new document if it doesn't exist
        await setDoc(userDocRef, {
          profileImage: imageUrl,
          summary: summary,
          email: user.email,
          createdAt: new Date(),
        });
        console.log('Profile created successfully');
      }
      
      setProfileImage(imageUrl);
      setNewImage(null);
      alert('Perfil salvo com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao salvar perfil: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.title}>Profile</Text>
          {isOwnProfile && (
            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <Text style={styles.buttonText}>Selecionar Foto</Text>
            </TouchableOpacity>
          )}
          
          {newImage ? (
            <Image source={{ uri: newImage }} style={styles.profileImage} />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>{user.email ? user.email[0].toUpperCase() : 'U'}</Text>
            </View>
          )}
          
          <Text style={styles.info}>Email: {user.email}</Text>
          {isOwnProfile && (
            <>
              <TextInput
                style={styles.input}
                value={summary}
                onChangeText={setSummary}
                placeholder="Escreva sobre você..."
                multiline
              />
              <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Salvar</Text>
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
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  placeholderImage: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    fontSize: 16,
    marginBottom: 16,
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    width: '100%',
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 32,
  },
  uploadButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default ProfileScreen;
