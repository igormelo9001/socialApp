import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { db } from '../firebase'; // Ajuste o caminho conforme necessário
import { getDocs, collection } from 'firebase/firestore';
import GraphScreen from './GraphScreen';

const ContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsCollection = collection(db, 'users');
        const contactsSnapshot = await getDocs(contactsCollection);
        const contactsList = contactsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContacts(contactsList);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, []);

  const handleProfilePress = (userId) => {
    navigation.navigate('Profile', { userId });
  };

  const handleGraphPress = () => {
    navigation.navigate('Graph', { contacts });
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.email}>{item.email}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleProfilePress(item.id)}
      >
        <Text style={styles.buttonText}>View Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleGraphPress}>
        <Text style={styles.buttonText}>View Graph</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E0F7FA',
  },
  list: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  email: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ContactsScreen;
