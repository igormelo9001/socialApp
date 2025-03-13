import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import * as Google from 'expo-auth-session/providers/google';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configuração do Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'SUA_ANDROID_CLIENT_ID',
    iosClientId: 'SUA_IOS_CLIENT_ID',
    webClientId: 'SUA_WEB_CLIENT_ID',
  });

  // Login com Email e Senha
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('Main'); // Substituir a tela atual para evitar voltar ao login
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro no login. Verifique suas credenciais e tente novamente.');
    }
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    if (!request) return;
    try {
      await promptAsync();
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      alert('Erro ao autenticar com Google. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Input placeholder="Email" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      
      <Button title="Login" onPress={handleLogin} style={styles.button} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} style={styles.button} />
      
      <Button title="Login with Google" disabled={!request} onPress={handleGoogleLogin} style={styles.googleButton} />
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
