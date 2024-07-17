import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('Login'); // Navegar para a tela de login após cadastro bem-sucedido
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert('Erro no cadastro. Verifique suas informações e tente novamente.');
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
      <Button title="Register" onPress={handleRegister} style={styles.button} />
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
