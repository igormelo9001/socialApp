import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, TextInput, Button, Modal, Text, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Input from '../components/Input';
import * as Google from 'expo-auth-session/providers/google';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Usuário autenticado:', user.email);
        navigation.replace('Main');
      }
    });
    return unsubscribe;
  }, [navigation]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'SUA_ANDROID_CLIENT_ID',
    iosClientId: 'SUA_IOS_CLIENT_ID',
    webClientId: 'SUA_WEB_CLIENT_ID',
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha email e senha.');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuário logado:', userCredential.user.email);
      navigation.replace('Main');
    } catch (error) {
      console.error('Erro no login:', error.code, error.message);
      Alert.alert('Erro no Login', mapFirebaseError(error.code));
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) return;
    try {
      await promptAsync();
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      Alert.alert('Erro', 'Não foi possível autenticar com Google.');
    }
  };

  const handlePasswordReset = async () => {
    if (resetEmail) {
      try {
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        await sendPasswordResetEmail(auth, resetEmail);
        Alert.alert('Sucesso', `Verifique seu e-mail para redefinição de senha. Este é seu código: ${resetCode}`);
        setResetEmail('');
        setModalVisible(false);
      } catch (error) {
        console.error('Erro ao enviar e-mail de redefinição de senha:', error);
        Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição de senha.');
      }
    } else {
      Alert.alert('Erro', 'Por favor, insira um e-mail.');
    }
  };

  const mapFirebaseError = (errorCode) => {
    const errors = {
      'auth/invalid-email': 'Email inválido.',
      'auth/user-disabled': 'Usuário desativado.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    };
    return errors[errorCode] || 'Erro desconhecido. Tente novamente.';
  };

  return (
    <View style={styles.container}>
      <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <Input placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Registrar" onPress={() => navigation.navigate('Register')} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Login com Google" disabled={!request} onPress={handleGoogleLogin} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Esqueci a senha" onPress={() => setModalVisible(true)} />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Redefinir Senha</Text>
            <TextInput
              placeholder="Digite seu e-mail"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.modalInput}
            />
            <Button title="Enviar Código" onPress={handlePasswordReset} />
            <Button title="Cancelar" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E0F7FA',
  },
  input: {
    height: 40,
    marginBottom: 12,
    borderWidth: 1,
    padding: 10,
  },
  buttonContainer: {
    marginVertical: 10,
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
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
    width: '100%',
  },
});