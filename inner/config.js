import Constants from 'expo-constants';

const { manifest } = Constants;

const config = {
  BLOCKCYPHER_API_TOKEN: manifest.extra.BLOCKCYPHER_API_TOKEN,
};

export default config; 