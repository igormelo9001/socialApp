import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, Alert, Modal, TextInput } from 'react-native';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { db } from '../firebase'; // Importe o Firestore
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as Sharing from 'expo-sharing'; // Importando a biblioteca de compartilhamento

// Acessando o token da API a partir do app.json
const BLOCKCYPHER_API_TOKEN = Constants.manifest.extra.BLOCKCYPHER_API_TOKEN;

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amountToSend, setAmountToSend] = useState('');

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    generateNewAddress(); // Gera um novo endereço ao entrar na tela
  }, []);

  const fetchBalance = async () => {
    console.log('Fetching balance for address:', address);
    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setBalance(response.data.final_balance / 100000000); // Convertendo de satoshis para BTC
      console.log('Balance fetched successfully:', response.data.final_balance);
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      Alert.alert('Erro', 'Não foi possível buscar o saldo.');
    }
  };

  const fetchTransactions = async () => {
    console.log('Fetching transactions for address:', address);
    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setTransactions(response.data.txs);
      console.log('Transactions fetched successfully:', response.data.txs);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      Alert.alert('Erro', 'Não foi possível buscar as transações.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewAddress = async () => {
    console.log('Generating new address...');
    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/addresses', {
        token: BLOCKCYPHER_API_TOKEN, // Use o token do app.json
      });
      setAddress(response.data.address);
      console.log('New address generated:', response.data.address);
    } catch (error) {
      console.error('Erro ao gerar novo endereço:', error);
      Alert.alert('Erro', 'Não foi possível gerar um novo endereço.');
    }
  };

  const handleSendBitcoin = async () => {
    if (!recipientAddress || !amountToSend) {
      Alert.alert('Erro', 'Por favor, insira um endereço de destinatário e um valor.');
      return;
    }

    console.log('Sending Bitcoin to:', recipientAddress, 'Amount:', amountToSend);
    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/txs/new', {
        inputs: [{ addresses: [address] }],
        outputs: [{ addresses: [recipientAddress], value: amountToSend * 100000000 }], // valor em satoshis
        token: BLOCKCYPHER_API_TOKEN,
      });

      // Assinando a transação
      const tx = response.data;
      const signedTx = await axios.post(`https://api.blockcypher.com/v1/btc/main/txs/${tx.tx.hash}/send`, {
        tx: tx,
        token: BLOCKCYPHER_API_TOKEN,
      });

      Alert.alert('Sucesso', 'Bitcoin enviado com sucesso!');
      setSendModalVisible(false);
      setRecipientAddress('');
      setAmountToSend('');
      fetchBalance(); // Atualiza o saldo após o envio
      fetchTransactions(); // Atualiza o histórico de transações após o envio
    } catch (error) {
      console.error('Erro ao enviar Bitcoin:', error);
      Alert.alert('Erro', 'Não foi possível enviar Bitcoin.');
    }
  };

  const shareAddress = async () => {
    try {
      const message = `Meu endereço de carteira Bitcoin: ${address}`;
      await Sharing.shareAsync(message);
      console.log('Address shared successfully:', address);
    } catch (error) {
      console.error('Erro ao compartilhar endereço:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar o endereço.');
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionText}>ID: {item.hash}</Text>
      <Text style={styles.transactionText}>Valor: {item.total / 100000000} BTC</Text>
      <Text style={styles.transactionText}>Data: {new Date(item.received).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>Carteira de Bitcoin</Text>
          <Text style={styles.balance}>Saldo: {balance} BTC</Text>
          <Text style={styles.historyTitle}>Histórico de Transações</Text>
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.hash}
          />
          <Text style={styles.addressTitle}>Endereço da Carteira:</Text>
          <Text style={styles.address}>{address}</Text>
          <QRCode value={address} size={200} />
          <Button title="Compartilhar Endereço" onPress={shareAddress} />
          <Button title="Enviar Bitcoin" onPress={() => setSendModalVisible(true)} />
          <Button title="Receber Bitcoin" onPress={() => Alert.alert('Receber Bitcoin', 'Funcionalidade de recebimento ainda não implementada.')} />

          {/* Modal para enviar Bitcoin */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={sendModalVisible}
            onRequestClose={() => setSendModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Enviar Bitcoin</Text>
                <TextInput
                  placeholder="Endereço do Destinatário"
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  style={styles.modalInput}
                />
                <TextInput
                  placeholder="Valor (BTC)"
                  value={amountToSend}
                  onChangeText={setAmountToSend}
                  keyboardType="numeric"
                  style={styles.modalInput}
                />
                <Button title="Enviar" onPress={handleSendBitcoin} />
                <Button title="Cancelar" onPress={() => setSendModalVisible(false)} />
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  balance: {
    fontSize: 20,
    marginVertical: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  transactionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  transactionText: {
    fontSize: 16,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  address: {
    fontSize: 16,
    marginVertical: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 12,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
});

export default WalletScreen; 