import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import * as Sharing from 'expo-sharing';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const BLOCKCYPHER_API_TOKEN = Constants.expoConfig.extra.BLOCKCYPHER_API_TOKEN;

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amountToSend, setAmountToSend] = useState('');
  const [error, setError] = useState('');
  const [privateKeyShown, setPrivateKeyShown] = useState(false);
  const [addressCreated, setAddressCreated] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        await fetchWalletAddress();
        if (!addressCreated) {
          await generateNewAddress();
        }
        await fetchBalance();
        await fetchTransactions();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeWallet();
  }, [addressCreated]);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/${address}/balance`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setBalance(response.data.final_balance / 100000000);
      console.log('Saldo atualizado:', response.data.final_balance / 100000000);
    } catch (error) {
      handleError('Não foi possível buscar o saldo.');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setTransactions(response.data.txs);
      console.log('Transações buscadas:', response.data.txs);
    } catch (error) {
      handleError('Não foi possível buscar as transações.');
    }
  };

  const fetchWalletAddress = async () => {
    try {
      const userId = 'user_id'; // Substitua pelo ID do usuário autenticado
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.walletAddress) {
          setAddress(data.walletAddress);
          setAddressCreated(true);
          console.log('Endereço da carteira recuperado:', data.walletAddress);
        }
      } else {
        console.log('Nenhum documento encontrado!');
      }
    } catch (error) {
      handleError('Não foi possível buscar o endereço da carteira.');
    }
  };

  const generateNewAddress = async () => {
    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/addrs', {
        token: BLOCKCYPHER_API_TOKEN,
      });
      const newAddress = response.data.address;
      setAddress(newAddress);
      
      // Persistir o novo endereço no Firestore
      const userId = 'user_id'; // Substitua pelo ID do usuário autenticado
      await setDoc(doc(db, 'users', userId), { walletAddress: newAddress }, { merge: true });
      console.log('Endereço salvo no Firestore:', newAddress);
      
      if (!privateKeyShown) {
        const privateKey = response.data.private;
        console.log('Chave Privada gerada:', privateKey);
        Alert.alert('Chave Privada', `Sua chave privada é: ${privateKey}\n\nAnote-a em um lugar seguro!`);
        setPrivateKeyShown(true);
      }
      
      setAddressCreated(true);
    } catch (error) {
      handleError('Não foi possível gerar um novo endereço.');
    }
  };

  const handleSendBitcoin = async () => {
    if (!recipientAddress || !amountToSend) {
      Alert.alert('Erro', 'Por favor, insira um endereço de destinatário e um valor.');
      return;
    }

    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/txs/new', {
        inputs: [{ addresses: [address] }],
        outputs: [{ addresses: [recipientAddress], value: amountToSend * 100000000 }],
        token: BLOCKCYPHER_API_TOKEN,
      });

      const signedTx = await axios.post(`https://api.blockcypher.com/v1/btc/main/txs/${response.data.tx.hash}/send`, {
        tx: response.data,
        token: BLOCKCYPHER_API_TOKEN,
      });

      Alert.alert('Sucesso', 'Bitcoin enviado com sucesso!');
      setSendModalVisible(false);
      setRecipientAddress('');
      setAmountToSend('');
      await fetchBalance();
      await fetchTransactions();
    } catch (error) {
      handleError('Não foi possível enviar Bitcoin.');
    }
  };

  const handleError = (message) => {
    setError(message);
    Alert.alert('Erro', message);
  };

  const shareAddress = async () => {
    try {
      const message = `Meu endereço de carteira Bitcoin: ${address}`;
      await Sharing.shareAsync(message);
    } catch (error) {
      handleError('Não foi possível compartilhar o endereço.');
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
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.hash}
            />
          ) : (
            <Text style={styles.noTransactionsText}>Nenhuma transação encontrada.</Text>
          )}
          <Text style={styles.addressTitle}>Endereço da Carteira:</Text>
          <Text style={styles.address}>{address}</Text>
          
          {address ? (
            <QRCode value={address} size={200} />
          ) : (
            <Text style={styles.placeholderText}>Gerando endereço...</Text>
          )}
          
          <TouchableOpacity style={styles.button} onPress={shareAddress}>
            <Text style={styles.buttonText}>Compartilhar Endereço</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setSendModalVisible(true)}>
            <Text style={styles.buttonText}>Enviar Bitcoin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Receber Bitcoin', 'Mostre o QRCode acima para receber pagamentos.')}>
            <Text style={styles.buttonText}>Receber Bitcoin</Text>
          </TouchableOpacity>

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
                <TouchableOpacity style={styles.button} onPress={handleSendBitcoin}>
                  <Text style={styles.buttonText}>Enviar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setSendModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  balance: {
    fontSize: 20,
    marginVertical: 16,
    color: '#00796B', // Cor da paleta do Inner
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#00796B', // Cor da paleta do Inner
  },
  transactionItem: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    width: '100%',
  },
  transactionText: {
    fontSize: 16,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#00796B', // Cor da paleta do Inner
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
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  button: {
    backgroundColor: '#00796B', // Cor da paleta do Inner
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  noTransactionsText: {
    fontSize: 16,
    color: '#999',
    marginVertical: 20,
  },
});

export default WalletScreen; 