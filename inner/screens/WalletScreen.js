import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, TextInput, TouchableOpacity, Clipboard } from 'react-native';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import BlockchainWalletChecker from './BlockChainWalletChecker';

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
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [privateKeyModalVisible, setPrivateKeyModalVisible] = useState(false);
  const [privateKey, setPrivateKey] = useState('');


  const isMounted = useRef(true);
  const isInitialized = useRef(false);
  const navigation = useNavigation();

   // 1. Efeito PRINCIPAL - Inicialização e monitoramento do address
   useEffect(() => {
    // A. Inicialização
    const initializeWallet = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        const walletAddress = await fetchWalletAddress();
        if (!walletAddress) {
          await generateNewAddress(); // Já chama setAddress internamente
        } else {
          setAddress(walletAddress); // Dispara o efeito secundário
        }
      } catch (err) {
        if (isMounted.current) setError(err.message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    initializeWallet();

    // B. Cleanup
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 2. Efeito SECUNDÁRIO - Atualização do saldo (100% sincronizado com address)
  useEffect(() => {
    if (!address) return;

    let isActive = true;
    console.log("🔄 Atualizando saldo para:", address);

    const updateBalance = async () => {
      try {
        // Tentativa principal + fallbacks
        const balance = await checkBalanceWithBlockchain(address) 
                       || await checkBalanceWithBlockstream(address)
                       || await checkBalanceWithMempool(address);
        
        if (isActive && isMounted.current) {
          setBalance(balance || 0); // Garante número mesmo se APIs falharem
          console.log("✅ Saldo atualizado:", balance);
        }
      } catch (error) {
        if (isActive && isMounted.current) {
          console.error("❌ Falha ao atualizar saldo:", error);
          setError("Falha na conexão com a blockchain");
        }
      }
    };

    // Delay estratégico para evitar race conditions
    const balanceTimer = setTimeout(updateBalance, 500);
    
    return () => {
      isActive = false;
      clearTimeout(balanceTimer);
    };
  }, [address]);

  const checkBalanceWithBlockchain = async (address) => {
    try {
      const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
      const balanceInSatoshis = response.data;
      return balanceInSatoshis / 100000000;
    } catch (error) {
      console.error('Erro ao buscar o saldo via Blockchain.com:', error.message);
      throw new Error('Blockchain.com API falhou');
    }
  };

  const checkBalanceWithBlockstream = async (address) => {
    try {
      const response = await axios.get(`https://blockstream.info/api/address/${address}`);
      const balanceInSatoshis = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
      return balanceInSatoshis / 100000000;
    } catch (error) {
      console.error('Erro ao buscar o saldo via Blockstream:', error.message);
      throw new Error('Blockstream API falhou');
    }
  };

  const checkBalanceWithMempool = async (address) => {
    try {
      const response = await axios.get(`https://mempool.space/api/address/${address}`);
      const balanceInSatoshis = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
      return balanceInSatoshis / 100000000;
    } catch (error) {
      console.error('Erro ao buscar o saldo via Mempool.space:', error.message);
      throw new Error('Mempool.space API falhou');
    }
  };

  const fetchTransactionsWithBlockchain = async (address) => {
    try {
      const response = await axios.get(`https://blockchain.info/rawaddr/${address}`);
      return response.data.txs;
    } catch (error) {
      console.error('Erro ao buscar as transações:', error);
      throw new Error('Não foi possível buscar as transações.');
    }
  };

  const fetchBalance = async () => {
    if (!address) {
      handleError('Endereço da carteira não definido.');
      return;
    }

    if (!validateAddress(address)) {
      handleError('Endereço da carteira inválido.');
      return;
    }

    const apis = [
      { name: 'Blockchain.com', method: checkBalanceWithBlockchain },
      { name: 'Blockstream', method: checkBalanceWithBlockstream },
      { name: 'Mempool.space', method: checkBalanceWithMempool },
    ];

    for (const api of apis) {
      try {
        const balance = await api.method(address);
        setBalance(balance);
        console.log(`Saldo atualizado via ${api.name}:`, balance);
        return;
      } catch (error) {
        console.error(`Erro ao buscar saldo via ${api.name}:`, error.message);
      }
    }

    handleError('Não foi possível buscar o saldo de nenhuma API.');
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setTransactions(response.data.txs);
      console.log('Transações buscadas:', response.data.txs);
    } catch (error) {
      // Se a BlockCypher falhar, tenta a Blockchain.com
      try {
        const transactions = await fetchTransactionsWithBlockchain(address);
        setTransactions(transactions);
      } catch (error) {
        handleError('Não foi possível buscar as transações.');
      }
    }
  };

  const fetchWalletAddress = async () => {
    try {
      const userId = auth.currentUser.uid;
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.walletAddress) {
          setAddress(data.walletAddress);
          setAddressCreated(true);
          console.log('Endereço da carteira recuperado:', data.walletAddress);
          return data.walletAddress;
        }
      } else {
        console.log('Nenhum documento encontrado!');
      }
      return null;
    } catch (error) {
      handleError('Não foi possível buscar o endereço da carteira.');
      return null;
    }
  };

  const generateNewAddress = async () => {
    try {
      const response = await axios.post('https://api.blockcypher.com/v1/btc/main/addrs', {
        token: BLOCKCYPHER_API_TOKEN,
      });
      const newAddress = response.data.address;
      setAddress(newAddress);

      const userId = auth.currentUser.uid;
      await setDoc(doc(db, 'users', userId), { walletAddress: newAddress }, { merge: true });
      console.log('Endereço salvo no Firestore:', newAddress);

      if (!privateKeyShown) {
        const privateKey = response.data.private;
        console.log('Chave Privada gerada:', privateKey);
        setPrivateKey(privateKey);
        setPrivateKeyModalVisible(true);
        setPrivateKeyShown(true);
      }

      setAddressCreated(true);
    } catch (error) {
      handleError('Não foi possível gerar um novo endereço.');
    }
  };

  const addTransactionLog = (log) => {
    setTransactionLogs((prevLogs) => [...prevLogs, log]);
  };

  const validateAddress = (address) => {
    const regex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;
    return regex.test(address);
  };

  const handleSendBitcoin = async () => {
    if (!recipientAddress || !amountToSend) {
      Alert.alert('Erro', 'Por favor, insira um endereço de destinatário e um valor.');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      Alert.alert('Erro', 'Endereço de destinatário inválido.');
      return;
    }

    try {
      setTransactionLoading(true);
      setTransactionLogs([]);

      const steps = [
        'Iniciando a transação...',
        'Validando o endereço do destinatário...',
        'Calculando as taxas de transação...',
        'Assinando a transação...',
        'Enviando para a rede Bitcoin...',
        'Aguardando confirmações da rede...',
      ];

      for (const step of steps) {
        addTransactionLog(step);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

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
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleError = (message) => {
    console.error(message);
    setError(message);
    Alert.alert('Erro', message);
  };

  const shareAddress = async () => {
    Clipboard.setString(address);
    Alert.alert('Copiado', 'Endereço da carteira copiado para a área de transferência.');
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionText}>ID: {item.hash}</Text>
      <Text style={styles.transactionText}>Valor: {item.total / 100000000} BTC</Text>
      <Text style={styles.transactionText}>Data: {new Date(item.received).toLocaleString()}</Text>
    </View>
  );

  const copyToClipboard = () => {
    Clipboard.setString(privateKey);
    Alert.alert('Copiado', 'Chave privada copiada para a área de transferência.');
  };

  const handleHistoryPress = () => {
    // Aqui você pode adicionar a lógica para lidar com o toque no histórico de transações
    // Por exemplo, exibir uma mensagem ou navegar para outra tela
    Alert.alert('Histórico de Transações', 'Nenhuma transação encontrada. Comece a usar sua carteira!');
  };

  const historyTitleStyle = [
    styles.historyTitle,
    transactions.length > 0 ? styles.historyTitleWithTransactions : styles.historyTitleWithoutTransactions,
  ];

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.title}>Carteira de Bitcoin</Text>
          <Text style={styles.balance}>Saldo: {balance} BTC</Text>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.hash}
            />
          ) : null}
          {transactions.length === 0 ? (
            <TouchableOpacity onPress={handleHistoryPress}>
              <Text style={historyTitleStyle}>Histórico de Transações</Text>
            </TouchableOpacity>
          ) : (
            <Text style={historyTitleStyle}>Histórico de Transações</Text>
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

          <Modal
            animationType="slide"
            transparent={true}
            visible={privateKeyModalVisible}
            onRequestClose={() => setPrivateKeyModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Chave Privada</Text>
                <View style={styles.privateKeyContainer}>
                  <Text style={styles.privateKeyText}>{privateKey}</Text>
                  <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                    <Text style={styles.copyButtonText}>Copiar</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalWarningText}>
                  Esta é a sua chave privada. Ela será exibida apenas uma vez.
                  Copie-a e guarde-a em um local seguro!
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setPrivateKeyModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Entendi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('BlockchainWalletChecker')}
          >
            <Text style={styles.buttonText}>Verificar Carteira na Blockchain</Text>
          </TouchableOpacity>
        </>
      )}
      {transactionLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Enviando Bitcoin...</Text>
          {transactionLogs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
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
    color: '#00796B',
    // Cor da paleta do Inner
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#00796B',
    // Cor da paleta do Inner
  },
  historyTitleWithoutTransactions: {
    color: '#888', // Cor quando não há transações
  },
  historyTitleWithTransactions: {
    color: '#007BFF', // Cor quando há transações
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
    color: '#00796B',
    // Cor da paleta do Inner
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
  modalWarningText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#FF0000',
  },
  privateKeyText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  privateKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
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
    backgroundColor: '#00796B',
    // Cor da paleta do Inner
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  logText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
});

export default WalletScreen; 