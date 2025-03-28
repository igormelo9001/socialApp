import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';

const MessagesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [recentConversations, setRecentConversations] = useState({});

  useEffect(() => {
    const fetchUsersAndConversations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch conversations first
        const currentUser = auth.currentUser.uid;
        const conversationsRef = collection(db, 'conversations');
        const conversationsQuery = query(
          conversationsRef, 
          where('participants', 'array-contains', currentUser),
          orderBy('lastMessageTime', 'desc')
        );
        
        // Monitor conversations in real-time to get updates
        const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
          const conversations = {};
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Find the other participant (not current user)
            const otherParticipant = data.participants.find(p => p !== currentUser);
            if (otherParticipant) {
              conversations[otherParticipant] = {
                lastMessageTime: data.lastMessageTime,
                lastMessage: data.lastMessage,
                conversationId: doc.id
              };
            }
          });
          
          setRecentConversations(conversations);
        });

        // Now fetch all users
        const usersQuery = collection(db, 'users');
        const querySnapshot = await getDocs(usersQuery);
        const usersData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        
        return () => unsubscribeConversations();
      } catch (err) {
        setError('Erro ao carregar usuários e conversas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Monitorar status online dos usuários
    const onlineRef = collection(db, 'online_status');
    const unsubscribeOnline = onSnapshot(onlineRef, (snapshot) => {
      const online = new Set();
      snapshot.docs.forEach(doc => {
        if (doc.data().isOnline) {
          online.add(doc.id);
        }
      });
      setOnlineUsers(online);
    });

    fetchUsersAndConversations();
    return () => {
      unsubscribeOnline();
    };
  }, []);

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    // First filter by search term and exclude current user
   
     const filtered = users.filter(user => (user.name || '').toLowerCase().includes((search || '').toLowerCase()));
    // Then sort: first by recent conversations, then by name
    return filtered.sort((a, b) => {
      const aConversation = recentConversations[a.id];
      const bConversation = recentConversations[b.id];
      
      // If both have conversations, sort by most recent
      if (aConversation && bConversation) {
        // Check if lastMessageTime exists for both
        if (aConversation.lastMessageTime && bConversation.lastMessageTime) {
          return bConversation.lastMessageTime.toDate() - aConversation.lastMessageTime.toDate();
        } else if (aConversation.lastMessageTime) {
          return -1; // a has timestamp, b doesn't, so a comes first
        } else if (bConversation.lastMessageTime) {
          return 1;  // b has timestamp, a doesn't, so b comes first
        }
      } 
      // If only one has a conversation, prioritize that one
      else if (aConversation) {
        return -1;
      } else if (bConversation) {
        return 1;
      }
      
      // If neither has a conversation or they're equal in recency, sort by name
      return (a.name || a.email || '').localeCompare(b.name || b.email || '');
    });
  };

  const handleUserPress = async (receiverId, receiverEmail, receiverName) => {
    const currentUser = auth.currentUser.uid;
    const conversationsRef = collection(db, 'conversations');

    try {
      // Check if we already have a conversation with this user in our state
      if (recentConversations[receiverId]) {
        navigation.navigate('Chat', { 
          conversationId: recentConversations[receiverId].conversationId,
          receiverEmail: receiverEmail,
          receiverName: receiverName,
          receiverId: receiverId
        });
        return;
      }

      // If not in state, check if it exists in Firestore (backup)
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
    const conversation = recentConversations[item.id];
    
    console.log('User data:', item);

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
                {(item.name || item.email || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || item.email}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {conversation && conversation.lastMessage ? (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            ) : (
              <Text style={styles.lastSeen}>
                {isOnline ? 'Online' : `Último acesso: ${lastSeen}`}
              </Text>
            )}
          </View>
          {conversation && conversation.lastMessageTime && (
            <Text style={styles.timeStamp}>
              {new Date(conversation.lastMessageTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          )}
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
          data={getFilteredAndSortedUsers()}
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
  lastMessage: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  timeStamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
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
