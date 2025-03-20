import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image } from 'react-native';
import { db } from '../firebase'; // Ajuste o caminho conforme necessário
import { getDocs, collection, doc, getDoc } from 'firebase/firestore';

const ContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleProfilePress = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setSelectedUser({
          id: userDoc.id,
          ...userDoc.data()
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.email}>{item.email}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleProfilePress(item.id)}
        >
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.profileImageContainer}>
                  {selectedUser.profileImage ? (
                    <Image 
                      source={{ uri: selectedUser.profileImage }} 
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={[styles.profileImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderText}>
                        {selectedUser.email ? selectedUser.email[0].toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalEmail}>{selectedUser.email}</Text>
                {selectedUser.summary && (
                  <Text style={styles.modalSummary}>{selectedUser.summary}</Text>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  modalEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSummary: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContactsScreen;
