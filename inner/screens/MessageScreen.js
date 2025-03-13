import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const MessagesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text) => {
    setSearch(text);
    if (text.length === 0) {
      setUsers([]);
      return;
    }
    setLoading(true);

    const usersQuery = query(collection(db, 'users'), where('email', '>=', text), where('email', '<=', text + '\uf8ff'));
    const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error searching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleUserPress = (userId) => {
    navigation.navigate('SendMessage', { receiverId: userId });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by email"
        value={search}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size={40} color="#007BFF" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userContainer} onPress={() => handleUserPress(item.id)}>
              <Text style={styles.userEmail}>{item.email}</Text>
            </TouchableOpacity>
          )}
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
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  userContainer: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  userEmail: {
    color: '#fff',
  },
});

export default MessagesScreen;
