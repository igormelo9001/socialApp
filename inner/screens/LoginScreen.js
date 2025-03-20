import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirecionamento automático se já estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Usuário autenticado:', user.email);
        navigation.replace('Main');
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Configuração do Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'SUA_ANDROID_CLIENT_ID',
    iosClientId: 'SUA_IOS_CLIENT_ID',
    webClientId: 'SUA_WEB_CLIENT_ID',
  });

  // Login com Email e Senha
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha email e senha.');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuário logado:', userCredential.user.email);
      await testFirestoreAccess(); // Teste de acesso ao Firestore
      navigation.replace('Main');
    } catch (error) {
      console.error('Erro no login:', error.code, error.message);
      Alert.alert('Erro no Login', mapFirebaseError(error.code));
    }
  };

  // Teste de acesso ao Firestore
  const testFirestoreAccess = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'testCollection'));
      if (!querySnapshot.empty) {
        console.log('Acesso ao Firestore: OK');
      } else {
        console.log('Firestore acessível, mas sem documentos.');
      }
    } catch (error) {
      console.error('Erro no Firestore:', error);
      Alert.alert('Erro', 'Sem permissão para acessar o Firestore.');
    }
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    if (!request) return;
    try {
      await promptAsync();
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      Alert.alert('Erro', 'Não foi possível autenticar com Google.');
    }
  };

  // Mapeamento de erros do Firebase
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
      <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Input placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="Login" onPress={handleLogin} style={styles.button} />
      <Button title="Registrar" onPress={() => navigation.navigate('Register')} style={styles.button} />
      <Button title="Login com Google" disabled={!request} onPress={handleGoogleLogin} style={styles.googleButton} />
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
  button: {
    marginTop: 10,
  },
  googleButton: {
    marginTop: 20,
  },
});
