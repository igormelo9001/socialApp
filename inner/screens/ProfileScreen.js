import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [summary, setSummary] = useState('');
  const [editing, setEditing] = useState(false);
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      fetchUserProfile(currentUser.uid);
    } else {
      navigation.navigate('Login');
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileImage(userData.profileImage || ''); // Ensure profileImage is a string
        setSummary(userData.summary || ''); // Ensure summary is a string
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setNewImage(result.uri);
    }
  };

  const handleSaveProfile = async () => {
    try {
      let imageUrl = profileImage;

      if (newImage) {
        const response = await fetch(newImage);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: imageUrl,
        summary: summary,
      });
      setProfileImage(imageUrl);
      setEditing(false);
      setNewImage(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {user ? (
          <>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity onPress={pickImage}>
              {newImage || profileImage ? (
                <Image
                  source={{ uri: typeof (newImage || profileImage) === 'string' ? (newImage || profileImage) : '' }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text>No Image</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.info}>Email: {user.email}</Text>
            {editing ? (
              <>
                <TextInput
                  style={styles.input}
                  value={summary}
                  onChangeText={setSummary}
                  placeholder="Add a summary about yourself"
                />
                <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.summary}>{summary}</Text>
                <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
                  <Text style={styles.buttonText}>Edit Summary</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E0F7FA',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 24,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  info: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  summary: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    color: '#666',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#fff',
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
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#FF3B30',
  },
});

export default ProfileScreen;
