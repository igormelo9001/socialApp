import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';

const ContactProfileScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const { userId } = route.params;

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
          setProfileImage(userData.profileImage || '');
          setSummary(userData.summary || '');
        } else {
          console.log("Document not found!");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [route.params?.userId]);

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.avatarSection}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>{user.email ? user.email[0].toUpperCase() : 'U'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.info}>Email: {user.email}</Text>
          {summary && <Text style={styles.summary}>{summary}</Text>}
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
  summary: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  }
});

export default ContactProfileScreen; 