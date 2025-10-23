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

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

// Initialize Firebase app eagerly, but services lazily to avoid double-init
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized');
} catch (error) {
  console.error('Firebase app initialization error:', error);
  // Don't throw - allow app to start even if Firebase config is invalid
}

export const initializeFirebase = async (): Promise<{ app: FirebaseApp; auth: Auth; firestore: Firestore; storage: FirebaseStorage }> => {
  // If already initializing, wait for that to complete
  if (isInitializing && initPromise) {
    await initPromise;
    return { app: app!, auth: auth!, firestore: firestore!, storage: storage! };
  }
  
  // If already initialized, return immediately
  if (app && auth && firestore && storage) {
    return { app, auth, firestore, storage };
  }
  
  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      if (!app) {
        app = initializeApp(firebaseConfig);
        console.log('Firebase app initialized');
      }
      
      // Initialize services lazily - use initializeAuth for React Native
      if (!auth) {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log('Firebase auth initialized with AsyncStorage persistence');
      }
      
      if (!firestore) {
        firestore = getFirestore(app);
        console.log('Firestore initialized');
      }
      
      if (!storage) {
        storage = getStorage(app);
        console.log('Firebase storage initialized');
      }
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();
  
  await initPromise;
  return { app: app!, auth: auth!, firestore: firestore!, storage: storage! };
};

export const getFirebaseAuth = async (): Promise<Auth> => {
  if (!auth) {
    console.log('Auth not initialized, initializing now...');
    await initializeFirebase();
  }
  return auth!;
};

export const getFirebaseFirestore = async (): Promise<Firestore> => {
  if (!firestore) {
    console.log('Firestore not initialized, initializing now...');
    await initializeFirebase();
  }
  if (!firestore) {
    throw new Error('Firestore failed to initialize. Check your Firebase configuration in .env file.');
  }
  return firestore;
};

export const getFirebaseStorage = async (): Promise<FirebaseStorage> => {
  if (!storage) {
    console.log('Storage not initialized, initializing now...');
    await initializeFirebase();
  }
  return storage!;
};

// Synchronous getters for compatibility (but they throw if not initialized)
export const getFirebaseAuthSync = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call await initializeFirebase() first.');
  }
  return auth;
};

export const getFirebaseFirestoreSync = (): Firestore => {
  if (!firestore) {
    throw new Error('Firestore not initialized. Call await initializeFirebase() first.');
  }
  return firestore;
};

