import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId } = route.params; // Recebe o ID da conversa através da navegação
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Buscar as mensagens em tempo real
  useEffect(() => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc')); // Ordena as mensagens por timestamp em ordem crescente

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData); // Atualiza as mensagens em tempo real
    }, (err) => {
      Alert.alert('Erro', 'Erro ao carregar as mensagens.');
      console.error(err);
    });

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, [conversationId]);

  // Enviar uma nova mensagem
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    setIsSending(true);

    const senderId = auth.currentUser.uid;
    const receiverId = conversationId.split('_').find(id => id !== senderId); // Extrai o receiverId da conversa

    try {
      // Envia a mensagem para a coleção do Firestore
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        receiverId,
        text: newMessage,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
      setIsSending(false);
    } catch (err) {
      setIsSending(false);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      console.error(err);
    }
  };

  // Exibição de mensagens
  const renderMessage = ({ item }) => {
    const isSender = item.senderId === auth.currentUser.uid;
    return (
      <View style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isSending && (
        <ActivityIndicator size={40} color="#007BFF" />
      )}
      {!isSending && (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted // Inverte a lista para exibir a mensagem mais recente no final
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escreva sua mensagem..."
          editable={!isSending}
        />
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.buttonDisabled]}
          onPress={handleSendMessage}
          disabled={isSending}
        >
          <Text style={styles.buttonText}>{isSending ? 'Enviando...' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
    padding: 16,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  sender: {
    alignSelf: 'flex-end',
    backgroundColor: '#007BFF',
  },
  receiver: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCCCCC',
  },
  messageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#fff',
  },
});

export default ChatScreen;
