import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const SendMessageScreen = ({ route, navigation }) => {
  const { receiverId } = route.params;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    setIsSending(true); // Indica que estamos enviando a mensagem

    const senderId = auth.currentUser.uid;

    try {
      // Criação do ID da conversa (ou você pode gerar um ID único)
      const conversationId = [senderId, receiverId].sort().join('_');

      // Adicionar mensagem à coleção
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        receiverId,
        text: message,
        timestamp: serverTimestamp(),
      });

      setMessage('');  // Limpa a caixa de entrada
      setIsSending(false); // Define como falso após enviar

      // Navegação para a tela de chat
      navigation.goBack();

    } catch (error) {
      console.error('Error sending message:', error);
      setIsSending(false); // Define como falso caso ocorra um erro
      Alert.alert('Error', 'There was an issue sending your message. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type your message here"
        editable={!isSending}  // Desabilita o campo de entrada enquanto está enviando
      />
      <TouchableOpacity
        style={[styles.button, isSending && styles.buttonDisabled]}  // Estiliza o botão de envio como desabilitado
        onPress={handleSendMessage}
        disabled={isSending}  // Desabilita o botão enquanto está enviando
      >
        <Text style={styles.buttonText}>{isSending ? 'Sending...' : 'Send'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',  // Cor do botão desabilitado
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SendMessageScreen;
