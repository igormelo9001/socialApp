import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, receiverEmail, receiverName, receiverId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [receiverTyping, setReceiverTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Configurar título da navegação
    navigation.setOptions({
      title: receiverName || receiverEmail,
    });

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
    }, (err) => {
      Alert.alert('Erro', 'Erro ao carregar as mensagens.');
      console.error(err);
    });

    // Monitorar status de digitação
    const typingRef = doc(db, 'conversations', conversationId);
    const typingUnsubscribe = onSnapshot(typingRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setReceiverTyping(data[`${receiverId}_typing`] || false);
      }
    });

    return () => {
      unsubscribe();
      typingUnsubscribe();
    };
  }, [conversationId, receiverId]);

  // Atualizar status de digitação
  const updateTypingStatus = async (typing) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`${auth.currentUser.uid}_typing`]: typing
      });
    } catch (error) {
      console.error('Erro ao atualizar status de digitação:', error);
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    updateTypingStatus(text.length > 0);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    setIsSending(true);
    updateTypingStatus(false);

    const senderId = auth.currentUser.uid;

    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        receiverId,
        text: newMessage,
        timestamp: serverTimestamp(),
      });

      // Atualizar última mensagem na conversa
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        unreadCount: 0
      });

      setNewMessage('');
      setIsSending(false);
    } catch (err) {
      setIsSending(false);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      console.error(err);
    }
  };

  const renderMessage = ({ item }) => {
    const isSender = item.senderId === auth.currentUser.uid;
    return (
      <View style={[
        styles.messageContainer,
        isSender ? styles.senderContainer : styles.receiverContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isSender ? styles.senderBubble : styles.receiverBubble
        ]}>
          <Text style={[
            styles.messageText,
            isSender ? styles.senderText : styles.receiverText
          ]}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted={false}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {receiverTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{receiverName || receiverEmail} está digitando...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Escreva sua mensagem..."
          editable={!isSending}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.buttonDisabled]}
          onPress={handleSendMessage}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  senderContainer: {
    alignSelf: 'flex-end',
  },
  receiverContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  senderBubble: {
    backgroundColor: '#007BFF',
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ChatScreen;
