
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyDqUZ8k5gdJ0oZsnSbERZNL-UTeaPRjuOY",
    authDomain: "startup-a2b76.firebaseapp.com",
    projectId: "startup-a2b76",
    storageBucket: "startup-a2b76.firebasestorage.app",
    messagingSenderId: "456148670273",
    appId: "1:456148670273:web:99d78acf1e61c6a40ff3c0"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, auth, app};
