import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, TextInput, Button, Modal, Text, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Input from '../components/Input';
import * as Google from 'expo-auth-session/providers/google';

export default function LoginScreen({ navigation }) {
  // Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  // Configuração do Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'SUA_ANDROID_CLIENT_ID',
    iosClientId: 'SUA_IOS_CLIENT_ID',
    webClientId: 'SUA_WEB_CLIENT_ID',
  });

  // Verificação de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Usuário autenticado:', user.email);
        navigation.replace('Main');
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Função para mapear erros do Firebase
  const mapFirebaseError = (errorCode) => {
    const errors = {
      'auth/invalid-email': 'O formato do e-mail está incorreto. Por favor, verifique.',
      'auth/user-disabled': 'Esta conta foi desativada. Entre em contato com o suporte.',
      'auth/user-not-found': 'Não encontramos uma conta com este e-mail. Verifique se digitou corretamente.',
      'auth/wrong-password': 'Senha incorreta. Tente novamente ou use "Esqueci a senha" para redefinir.',
      'auth/too-many-requests': 'Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.',
      'auth/invalid-credential': 'E-mail ou senha incorretos. Verifique suas credenciais.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet e tente novamente.',
      'auth/operation-not-allowed': 'Este método de login não está disponível no momento.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/email-already-in-use': 'Este e-mail já está cadastrado. Use outro e-mail ou faça login.',
    };
    return errors[errorCode] || 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  };

  // Função para lidar com o login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        'Campos Incompletos',
        'Por favor, preencha todos os campos para fazer login.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuário logado:', userCredential.user.email);
      navigation.replace('Main');
    } catch (error) {
      console.error('Erro no login:', error.code, error.message);
      Alert.alert(
        'Erro no Login',
        mapFirebaseError(error.code),
        [
          { 
            text: 'Esqueci a senha', 
            onPress: () => setModalVisible(true),
            style: 'default'
          },
          { 
            text: 'Tentar Novamente', 
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Função para lidar com o login do Google
  const handleGoogleLogin = async () => {
    if (!request) return;
    try {
      await promptAsync();
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      Alert.alert('Erro', 'Não foi possível autenticar com Google.');
    }
  };

  // Função para lidar com a redefinição de senha
  const handleRequestResetCode = async () => {
    if (!resetEmail) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert(
        'Sucesso',
        'Verifique seu e-mail para redefinição de senha.',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
      setResetEmail('');
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição de senha:', error);
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição de senha.');
    }
  };

  // Renderização do Modal de Redefinição de Senha
  const renderResetPasswordModal = () => (
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
          <View style={styles.modalButtonContainer}>
            <View style={styles.modalButtonWrapper}>
              <Button 
                title="Enviar Link" 
                onPress={handleRequestResetCode}
                color="#007BFF"
              />
            </View>
            <View style={styles.modalButtonWrapper}>
              <Button 
                title="Cancelar" 
                onPress={() => setModalVisible(false)}
                color="#FF3B30"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Input 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address" 
        style={styles.input} 
      />
      <Input 
        placeholder="Senha" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} color="#007BFF" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Registrar" onPress={() => navigation.navigate('Register')} color="#34C759" />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title="Login com Google" 
          disabled={!request} 
          onPress={handleGoogleLogin}
          color="#4285F4"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          title="Esqueci a senha" 
          onPress={() => setModalVisible(true)}
          color="#FF9500"
        />
      </View>

      {renderResetPasswordModal()}
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    borderRadius: 12,
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
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButtonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
});