import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId } = route.params; // Recebe o ID da conversa
  const [messages, setMessages] = useState([]); // Estado para armazenar as mensagens
  const [newMessage, setNewMessage] = useState(''); // Estado para a nova mensagem
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [isSending, setIsSending] = useState(false); // Estado de envio de mensagem

  // Função para buscar as mensagens da conversa ao carregar a tela
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef);

        // Usando onSnapshot para ouvir em tempo real as mudanças nas mensagens
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messagesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log('Mensagens carregadas:', messagesData); // Depuração para verificar as mensagens
          setMessages(messagesData.reverse()); // Reverter para mostrar as mensagens mais recentes no topo
        });

        return () => unsubscribe(); // Limpar o listener quando o componente for desmontado
      } catch (err) {
        Alert.alert('Erro', 'Erro ao carregar as mensagens.');
        console.error(err);
      } finally {
        setLoading(false);  
      }
    };

    fetchMessages();
    console.log(fetchMessages)
  }, [conversationId]);

  // Função para enviar uma nova mensagem
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return; // Impede o envio de mensagens vazias

    setIsSending(true);

    const senderId = auth.currentUser.uid; // O ID do usuário que envia a mensagem
    const receiverId = conversationId.split('_').find(id => id !== senderId); // O ID do outro usuário na conversa

    console.log('Enviando mensagem:', newMessage, 'Sender:', senderId, 'Receiver:', receiverId); // Depuração

    try {
      // Adiciona a mensagem no Firestore na coleção de mensagens
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        receiverId,
        text: newMessage,
        timestamp: serverTimestamp(),
      });

      setNewMessage(''); // Limpa o campo de entrada após o envio
      setIsSending(false); // Finaliza o envio
    } catch (err) {
      setIsSending(false);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      console.error(err);
    }
  };

  // Função para renderizar cada mensagem
  const renderMessage = ({ item }) => {
    const isSender = item.senderId === auth.currentUser.uid; // Verifica se a mensagem foi enviada pelo usuário atual
    console.log('Renderizando mensagem:', item.text, 'De:', item.senderId); // Depuração

    return (
      <View style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}>
        <Text style={[styles.messageText, isSender ? styles.senderText : styles.receiverText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size={40} color="#007BFF" />
      ) : (
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
    backgroundColor: '#007BFF', // Azul para as mensagens enviadas pelo usuário
  },
  receiver: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCCCCC', // Cinza para as mensagens recebidas
  },
  messageText: {
    color: '#fff', // Cor padrão do texto (branco)
  },
  senderText: {
    color: '#fff', // Texto branco para a mensagem enviada
  },
  receiverText: {
    color: '#000', // Texto preto para a mensagem recebida
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
