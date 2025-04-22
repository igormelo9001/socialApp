import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Importar o Firebase Auth

const PollDetailsScreen = ({ route }) => {
  const { pollId, communityId } = route.params;
  const [poll, setPoll] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Fetch poll details
    const pollRef = collection(db, 'communities', communityId, 'polls');
    const unsubscribePoll = onSnapshot(pollRef, (snapshot) => {
      const pollData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((p) => p.id === pollId);
      setPoll(pollData);
    });

    // Fetch comments
    const commentsRef = collection(db, 'communities', communityId, 'polls', pollId, 'comments');
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
    });

    return () => {
      unsubscribePoll();
      unsubscribeComments();
    };
  }, [pollId, communityId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Erro', 'O comentário não pode estar vazio.');
      return;
    }

    try {
      // Obter o usuário autenticado
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }

      const userName = user.displayName || 'Usuário Anônimo'; // Nome do usuário
      const userProfileImage = user.photoURL || ''; // URL da foto do perfil

      const commentsRef = collection(db, 'communities', communityId, 'polls', pollId, 'comments');
      await addDoc(commentsRef, {
        text: newComment,
        createdAt: new Date(),
        userName,
        userProfileImage,
      });

      setNewComment('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o comentário.');
      console.error(error);
    }
  };

  if (!poll) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.title}</Text>
      <Text style={styles.description}>{poll.description}</Text>

      <Text style={styles.sectionTitle}>Comentários</Text>
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Image
              source={{ uri: item.userProfileImage }}
              style={styles.profileImage}
            />
            <View style={styles.commentContent}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text>{item.text}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum comentário ainda.</Text>}
      />

      <TextInput
        style={styles.input}
        placeholder="Escreva um comentário..."
        value={newComment}
        onChangeText={setNewComment}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddComment}>
        <Text style={styles.addButtonText}>Adicionar Comentário</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addButton: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PollDetailsScreen;