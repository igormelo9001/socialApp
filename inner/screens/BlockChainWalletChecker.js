import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

const BLOCKCYPHER_API_TOKEN = Constants.expoConfig.extra.BLOCKCYPHER_API_TOKEN;

const BlockchainWalletChecker = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const validateAddress = (address) => {
    const regex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;
    return regex.test(address);
  };

  const fetchBalanceFromAPI = async (apiName, address) => {
    switch (apiName) {
      case 'BlockCypher':
        try {
          const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/${address}/balance`, {
            params: { token: BLOCKCYPHER_API_TOKEN },
          });
          return response.data.final_balance / 100000000;
        } catch (error) {
          console.error('Erro ao buscar saldo via BlockCypher:', error.message);
          throw new Error('BlockCypher API falhou');
        }
      case 'Blockchain.com':
        try {
          const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
          const balanceInSatoshis = response.data;
          return balanceInSatoshis / 100000000;
        } catch (error) {
          console.error('Erro ao buscar saldo via Blockchain.com:', error.message);
          throw new Error('Blockchain.com API falhou');
        }
      case 'Blockstream':
        try {
          const response = await axios.get(`https://blockstream.info/api/address/${address}`);
          const balanceInSatoshis = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
          return balanceInSatoshis / 100000000;
        } catch (error) {
          console.error('Erro ao buscar saldo via Blockstream:', error.message);
          throw new Error('Blockstream API falhou');
        }
      default:
        throw new Error('API desconhecida');
    }
  };

  const checkWallet = async () => {
    if (!address) {
      Alert.alert('Erro', 'Por favor, insira um endereço de carteira.');
      return;
    }

    if (!validateAddress(address)) {
      Alert.alert('Erro', 'Endereço de carteira inválido.');
      return;
    }

    setLoading(true);

    const apis = ['BlockCypher', 'Blockchain.com', 'Blockstream'];
    for (const api of apis) {
      try {
        const balance = await fetchBalanceFromAPI(api, address);
        setBalance(balance);
        console.log(`Saldo atualizado via ${api}:`, balance);
        break;
      } catch (error) {
        console.error(`Erro ao buscar saldo via ${api}:`, error.message);
      }
    }

    setLoading(false);
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

  const checkTransactions = async () => {
    if (!address) {
      Alert.alert('Erro', 'Por favor, insira um endereço de carteira.');
      return;
    }

    if (!validateAddress(address)) {
      Alert.alert('Erro', 'Endereço de carteira inválido.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`, {
        params: { token: BLOCKCYPHER_API_TOKEN },
      });
      setTransactions(response.data.txs);
    } catch (error) {
      // Se a BlockCypher falhar, tenta a Blockchain.com
      try {
        const transactions = await fetchTransactionsWithBlockchain(address);
        setTransactions(transactions);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível buscar as transações.');
      }
    } finally {
      setLoading(false);
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
      <Text style={styles.title}>Verificar Carteira na Blockchain</Text>
      <TextInput
        placeholder="Endereço da Carteira"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />
      <View style={styles.buttonContainer}>
        <Button title="Verificar Saldo" onPress={checkWallet} />
        <Button title="Verificar Transações" onPress={checkTransactions} />
      </View>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <Text style={styles.balance}>Saldo: {balance} BTC</Text>
      {transactions.length > 0 && (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.hash}
          style={styles.transactionList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#E0F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balance: {
    fontSize: 18,
    marginBottom: 16,
    color: '#00796B',
  },
  transactionList: {
    width: '100%',
  },
  transactionItem: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  transactionText: {
    fontSize: 16,
  },
});

export default BlockchainWalletChecker;