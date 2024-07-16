import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Simule um tempo de carregamento antes de navegar para a tela de login
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#1E90FF', '#87CEFA']} // Dodger Blue to Light Sky Blue
      style={styles.container}
    >
      <Text style={styles.text}>Inner</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF', // White
  },
});
