import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const posts = [
    { id: '1', content: 'First post!' },
    { id: '2', content: 'Hello world!' },
  ];

  return (
    <View style={styles.container}>
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Text style={styles.post}>{item.content}</Text>}
      ListFooterComponent={
        <TouchableOpacity style={styles.createPostButton} onPress={() => navigation.navigate('Post')}>
          <Ionicons name="add-circle" size={30} color="#1E90FF" />
          <Text style={styles.createPostButtonText}>Create Post</Text>
        </TouchableOpacity>
      }
    />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E0F7FA', // Light Cyan
  },
  post: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#00BFFF', // Deep Sky Blue
    borderRadius: 5,
  },
});
