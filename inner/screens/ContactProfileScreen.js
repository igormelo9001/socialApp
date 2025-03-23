import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator } from 'react-native';
import { db } from '../firebase';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';

const ContactProfileScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [summary, setSummary] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

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

    const fetchUserImages = async () => {
      try {
        const q = query(collection(db, 'users', userId, 'images'));
        const querySnapshot = await getDocs(q);
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setImages(docs);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchUserImages();
  }, [route.params?.userId]);

  const renderImage = ({ item }) => (
    <View style={styles.post}>
      <Image source={{ uri: item.fileUrl }} style={styles.image} />
    </View>
  );

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

      <Text style={styles.sectionTitle}>Fotos</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={images}
          renderItem={renderImage}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    alignSelf: 'flex-start',
    marginLeft: 16,
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
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridContainer: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactProfileScreen; 