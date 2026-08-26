import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfUnEPyz0jhih9-qlN1S0405xa-1tFpnA",
  authDomain: "safeher-b637f.firebaseapp.com",
  projectId: "safeher-b637f",
  storageBucket: "safeher-b637f.firebasestorage.app",
  messagingSenderId: "1011173684731",
  appId: "1:1011173684731:web:fc749a234e5672e64f075e",
  measurementId: "G-MZY3SM2YJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth — use browserLocalPersistence on web, AsyncStorage on native
const auth = Platform.OS === 'web'
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
