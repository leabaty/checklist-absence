import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC6PfHdBTLPaPGXnWfYOxofcptmv-hbPu0',
  authDomain: 'my-household-lb.firebaseapp.com',
  projectId: 'my-household-lb',
  storageBucket: 'my-household-lb.firebasestorage.app',
  messagingSenderId: '181563987636',
  appId: '1:181563987636:web:cf59bf9f86a8d1402ca9e1',
};

const app = initializeApp(firebaseConfig);

// experimentalForceLongPolling is required for React Native / Expo Go
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
