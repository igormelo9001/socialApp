// auth.js
import * as Google from 'expo-auth-session/providers/google';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';

// Função personalizada para login com Google
export function useGoogleLogin(navigation) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: null,
    iosClientId: null,
    androidClientId: null,
    webClientId: '883109548398-76h1i2o5aoa11412ra02u6isemhn323f.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const auth = getAuth();
      const credential = GoogleAuthProvider.credential(id_token);

      // Autenticar com Firebase
      signInWithCredential(auth, credential)
        .then(() => {
          navigation.navigate('Main');
        })
        .catch(error => console.error('Erro no login com Google:', error));
    }
  }, [response]);

  return { promptAsync, request };
}
