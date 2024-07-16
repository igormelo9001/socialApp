import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const ContactsScreen = ({ navigation }) => {
  const contacts = [
    { id: '1', name: 'Usuário 1' },
    { id: '2', name: 'Usuário 2' },
    { id: '3', name: 'Usuário 3' },
    { id: '4', name: 'Usuário 4' },
  ];

  const handleContactPress = (contact) => {
    navigation.navigate('Message', { contact });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContactPress(item)}>
            <Text style={styles.contactName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E0F7FA', // Light Cyan
  },
  contactItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E90FF', // Dodger Blue
  },
});

export default ContactsScreen;
