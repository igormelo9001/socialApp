import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const MessagesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const usersQuery = collection(db, 'users');
        const querySnapshot = await getDocs(usersQuery);
        const usersData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
      } catch (err) {
        setError('Erro ao carregar usuários');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase()) && user.id !== auth.currentUser.uid
  );

  const handleUserPress = async (receiverId) => {
    const currentUser = auth.currentUser.uid;
    const conversationId = [currentUser, receiverId].sort().join('_');
    const conversationsRef = collection(db, 'conversations');

    try {
      // Verifica se a conversa já existe
      const q = query(conversationsRef, where('participants', 'array-contains', currentUser));
      const querySnapshot = await getDocs(q);
      let conversationExists = false;

      querySnapshot.forEach((doc) => {
        const participants = doc.data().participants;
        if (participants.includes(receiverId)) {
          conversationExists = true;
          navigation.navigate('Chat', { conversationId: doc.id });
        }
      });

      if (!conversationExists) {
        // Cria uma nova conversa
        const newConversation = await addDoc(conversationsRef, {
          participants: [currentUser, receiverId],
        });
        navigation.navigate('Chat', { conversationId: newConversation.id });
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar ou buscar a conversa.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search contacts"
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <ActivityIndicator size={40} color="#007BFF" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredUsers}
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MessagesScreen;
