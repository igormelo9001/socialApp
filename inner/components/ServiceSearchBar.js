import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const ServiceSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    onSearch(query.trim());
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar ou cadastrar serviço (ex: Eletricista)"
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
    </View>
  );
};

export default ServiceSearchBar;

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  input: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
  },
});
