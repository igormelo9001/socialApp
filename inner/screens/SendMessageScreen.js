import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const SendMessageScreen = ({ route }) => {
  const { receiverId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const senderId = auth.currentUser.uid;
    fetchMessages(senderId, receiverId);
  }, [receiverId]);

  const fetchMessages = async (senderId, receiverId) => {
    const conversationId = [senderId, receiverId].sort().join('_');

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  };

  const handleSendMessage = async () => {
    const senderId = auth.currentUser.uid;
    const conversationId = [senderId, receiverId].sort().join('_');

    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId,
      receiverId,
      text: message,
      timestamp: new Date(),
    });

    setMessage('');
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageContainer, item.senderId === auth.currentUser.uid ? styles.myMessage : styles.theirMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        inverted // Para mostrar as mensagens mais recentes no fundo
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
        />
        <Button title="Send" onPress={handleSendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  messageList: {
    padding: 16,
    flexDirection: 'column-reverse', // Para manter as mensagens mais recentes na parte inferior
  },
  messageContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#007BFF',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#FF5722',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
});

export default SendMessageScreen;
