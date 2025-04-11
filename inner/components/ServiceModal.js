import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Button } from 'react-native';

const ServiceModal = ({ visible, type, onClose }) => {
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentKey, setPaymentKey] = useState('');

  const handleSubmit = () => {
    const data = { name, service, paymentMethod, paymentKey };
    console.log(type === 'provider' ? 'Prestador:' : 'Cliente:', data);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalView}>
        <Text style={styles.title}>
          {type === 'provider' ? 'Prestar Serviço' : 'Buscar Serviço'}
        </Text>

        <TextInput placeholder="Nome" style={styles.input} onChangeText={setName} />
        <TextInput
          placeholder={type === 'provider' ? 'Serviço a prestar' : 'Buscando serviço de'}
          style={styles.input}
          onChangeText={setService}
        />
        <TextInput
          placeholder="Forma de pagamento (pix ou bitcoin)"
          style={styles.input}
          onChangeText={setPaymentMethod}
        />
        <TextInput
          placeholder="Chave Pix ou Carteira Bitcoin"
          style={styles.input}
          onChangeText={setPaymentKey}
        />

        <View style={styles.buttonContainer}>
          <Button title="Enviar" onPress={handleSubmit} />
          <Button title="Cancelar" onPress={onClose} color="#999" />
        </View>
      </View>
    </Modal>
  );
};

export default ServiceModal;

const styles = StyleSheet.create({
  modalView: {
    marginTop: '40%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
d