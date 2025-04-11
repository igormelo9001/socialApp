import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

const ActionButtons = ({ onPressProvider, onPressSeeker }) => {
  return (
    <View style={styles.container}>
      <Button title="Prestar Serviço" onPress={onPressProvider} />
      <View style={{ height: 10 }} />
      <Button title="Buscar Serviço" onPress={onPressSeeker} />
    </View>
  );
};

export default ActionButtons;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
