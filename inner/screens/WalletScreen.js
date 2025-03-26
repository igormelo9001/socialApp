const generateNewAddress = async () => {
  try {
    // ... existing code ...
    console.log('Address before toLowerCase:', newAddress);
    setAddress(newAddress.toLowerCase());
    // ... existing code ...
  } catch (error) {
    handleError('Não foi possível gerar um novo endereço.');
  }
}; 