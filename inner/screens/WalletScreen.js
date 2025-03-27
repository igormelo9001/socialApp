import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, Alert, Modal, TextInput } from 'react-native';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { db } from '../firebase'; // Importe o Firestore
import * as Sharing from 'expo-sharing'; // Importando a biblioteca de compartilhamento

const BLOCKCYPHER_API_TOKEN = Constants.expoConfig.extra.BLOCKCYPHER_API_TOKEN;

const WalletScreen = ({ navigation }) => {
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
    generateNewAddress();
  }, []);

  const fetchBalance = async () => {
    console.log('Fetching balance for address:', address);
    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setBalance(response.data.final_balance / 100000000);
      console.log('Balance fetched successfully:', response.data.final_balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      Alert.alert('Error', 'Could not fetch balance.');
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
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Could not fetch transactions.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewAddress = async () => {
    console.log('Generating new address...');
    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/addresses', {
        token: BLOCKCYPHER_API_TOKEN,
      });
      setAddress(response.data.address);
      console.log('New address generated:', response.data.address);
    } catch (error) {
      console.error('Error generating new address:', error);
      Alert.alert('Error', 'Could not generate a new address.');
    }
  };

  const handleSendBitcoin = async () => {
    if (!address) {
      Alert.alert(
        'Error',
        'No wallet address available. Returning to the previous screen.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    if (!recipientAddress || !amountToSend) {
      Alert.alert('Error', 'Please enter a recipient address and an amount.');
      return;
    }

    console.log('Sending Bitcoin to:', recipientAddress, 'Amount:', amountToSend);
    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/txs/new', {
        inputs: [{ addresses: [address] }],
        outputs: [{ addresses: [recipientAddress], value: amountToSend * 100000000 }],
        token: BLOCKCYPHER_API_TOKEN,
      });

      const tx = response.data;
      const signedTx = await axios.post(`https://api.blockcypher.com/v1/btc/main/txs/${tx.tx.hash}/send`, {
        tx: tx,
        token: BLOCKCYPHER_API_TOKEN,
      });

      Alert.alert('Success', 'Bitcoin sent successfully!');
      setSendModalVisible(false);
      setRecipientAddress('');
      setAmountToSend('');
      fetchBalance();
      fetchTransactions();
    } catch (error) {
      console.error('Error sending Bitcoin:', error);
      Alert.alert('Error', 'Could not send Bitcoin.');
    }
  };

  const shareAddress = async () => {
    try {
      const message = `My Bitcoin wallet address: ${address}`;
      await Sharing.shareAsync(message);
      console.log('Address shared successfully:', address);
    } catch (error) {
      console.error('Error sharing address:', error);
      Alert.alert('Error', 'Could not share the address.');
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionText}>ID: {item.hash}</Text>
      <Text style={styles.transactionText}>Value: {item.total / 100000000} BTC</Text>
      <Text style={styles.transactionText}>Date: {new Date(item.received).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>Bitcoin Wallet</Text>
          <Text style={styles.balance}>Balance: {balance} BTC</Text>
          <Text style={styles.historyTitle}>Transaction History</Text>
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.hash}
          />
          <Text style={styles.addressTitle}>Wallet Address:</Text>
          <Text style={styles.address}>{address || 'No address generated yet.'}</Text>
          <QRCode value={address || ''} size={200} />
          <Button title="Share Address" onPress={shareAddress} />
          <Button title="Send Bitcoin" onPress={() => setSendModalVisible(true)} />
          <Button title="Receive Bitcoin" onPress={() => Alert.alert('Receive Bitcoin', 'Receive functionality not implemented yet.')} />

          <Modal
            animationType="slide"
            transparent={true}
            visible={sendModalVisible}
            onRequestClose={() => setSendModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Send Bitcoin</Text>
                <TextInput
                  placeholder="Recipient Address"
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  style={styles.modalInput}
                />
                <TextInput
                  placeholder="Amount (BTC)"
                  value={amountToSend}
                  onChangeText={setAmountToSend}
                  keyboardType="numeric"
                  style={styles.modalInput}
                />
                <Button title="Send" onPress={handleSendBitcoin} />
                <Button title="Cancel" onPress={() => setSendModalVisible(false)} />
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