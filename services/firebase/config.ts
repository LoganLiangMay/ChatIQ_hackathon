import { initializeApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

// Initialize Firebase app eagerly, but services lazily to avoid double-init
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized');
} catch (error) {
  console.error('Firebase app initialization error:', error);
  // Don't throw - allow app to start even if Firebase config is invalid
}

export const initializeFirebase = () => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized');
    } catch (error) {
      console.error('Firebase app initialization error:', error);
      throw error;
    }
  }
  
  // Initialize services lazily
  if (!auth) {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('Firebase auth initialized');
    } catch (error) {
      console.error('Firebase auth initialization error:', error);
      throw error;
    }
  }
  
  if (!firestore) {
    firestore = getFirestore(app);
    console.log('Firestore initialized');
  }
  
  if (!storage) {
    storage = getStorage(app);
    console.log('Firebase storage initialized');
  }
  
  return { app, auth, firestore, storage };
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    console.warn('Auth not initialized, attempting initialization...');
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      throw new Error('Firebase Auth not initialized. Check your Firebase configuration in .env file.');
    }
  }
  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!firestore) {
    console.warn('Firestore not initialized, attempting initialization...');
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Failed to initialize Firestore:', error);
      throw new Error('Firestore not initialized. Check your Firebase configuration in .env file.');
    }
  }
  return firestore;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    console.warn('Storage not initialized, attempting initialization...');
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Failed to initialize Storage:', error);
      throw new Error('Firebase Storage not initialized. Check your Firebase configuration in .env file.');
    }
  }
  return storage;
};

