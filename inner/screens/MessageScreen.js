import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const MessagesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

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

    // Monitorar status online dos usuários
    const onlineRef = collection(db, 'online_status');
    const unsubscribe = onSnapshot(onlineRef, (snapshot) => {
      const online = new Set();
      snapshot.docs.forEach(doc => {
        if (doc.data().isOnline) {
          online.add(doc.id);
        }
      });
      setOnlineUsers(online);
    });

    fetchUsers();
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase()) && user.id !== auth.currentUser.uid
  );

  const handleUserPress = async (receiverId, receiverEmail, receiverName) => {
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
          navigation.navigate('Chat', { 
            conversationId: doc.id,
            receiverEmail: receiverEmail,
            receiverName: receiverName,
            receiverId: receiverId
          });
        }
      });

      if (!conversationExists) {
        // Cria uma nova conversa
        const newConversation = await addDoc(conversationsRef, {
          participants: [currentUser, receiverId],
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0
        });
        console.log('Creating new conversation with:', receiverId);
        console.log('Navigating to chat with conversation ID:', newConversation.id);
        navigation.navigate('Chat', { 
          conversationId: newConversation.id,
          receiverEmail: receiverEmail,
          receiverName: receiverName,
          receiverId: receiverId
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar ou buscar a conversa.');
      console.error(error);
    }
  };

  const renderUserItem = ({ item }) => {
    const isOnline = onlineUsers.has(item.id);
    const lastSeen = item.lastSeen ? new Date(item.lastSeen.toDate()).toLocaleString() : 'Nunca';

    return (
      <TouchableOpacity 
        style={styles.userContainer} 
        onPress={() => handleUserPress(item.id, item.email, item.name || item.email)}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {item.profileImage ? (
              <Image source={{ uri: item.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(item.name || item.email).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || item.email}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.lastSeen}>
              {isOnline ? 'Online' : `Último acesso: ${lastSeen}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contatos..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator size={40} color="#007BFF" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#007BFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  listContainer: {
    padding: 16,
  },
  userContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default MessagesScreen;
