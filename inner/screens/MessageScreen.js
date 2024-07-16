import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const MessageScreen = ({ route }) => {
  const { contact } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Usuário 1', content: 'Olá, tudo bem?' },
    { id: '2', sender: 'Você', content: 'Olá! Tudo bem e você?' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() === '') {
      return;
    }

    const message = {
      id: String(messages.length + 1),
      sender: 'Você',
      content: newMessage.trim(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={item.sender === 'Você' ? styles.messageSent : styles.messageReceived}>
            <Text style={styles.messageContent}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
        inverted // Para exibir as mensagens mais recentes no topo
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA', // Light Cyan
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E90FF', // Dodger Blue
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: '#87CEFA', // Light Sky Blue
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  messageContent: {
    fontSize: 16,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    backgroundColor: '#FFFFFF', // White
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#1E90FF', // Dodger Blue
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MessageScreen;
