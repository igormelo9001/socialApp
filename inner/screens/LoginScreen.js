import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Main'); // Navegar para a tela principal após login bem-sucedido
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro no login. Verifique suas credenciais e tente novamente.');
    }
  };
  return (
    <View style={styles.container}>
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} style={styles.button} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E0F7FA', // Light Cyan
  },
  button: {
    marginTop: 10,
  },
});
