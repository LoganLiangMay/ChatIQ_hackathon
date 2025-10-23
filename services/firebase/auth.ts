import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './config';
import { AuthFormData } from '@/types/user';

export const signUp = async ({ email, password, displayName }: AuthFormData): Promise<User> => {
  const auth = await getFirebaseAuth();
  const firestore = await getFirebaseFirestore();
  
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user document in Firestore
    await setDoc(doc(firestore, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split('@')[0],
      profilePicture: null,
      online: true,
      lastSeen: serverTimestamp(),
      fcmToken: null,
      createdAt: serverTimestamp()
    });
    
    console.log('User created successfully:', user.uid);
    return user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const signIn = async ({ email, password }: AuthFormData): Promise<User> => {
  const auth = await getFirebaseAuth();
  const firestore = await getFirebaseFirestore();
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update online status
    await updateDoc(doc(firestore, 'users', user.uid), {
      online: true,
      lastSeen: serverTimestamp()
    });
    
    console.log('User signed in:', user.uid);
    return user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const signOut = async (): Promise<void> => {
  const auth = await getFirebaseAuth();
  const firestore = await getFirebaseFirestore();
  
  if (!auth.currentUser) return;
  
  try {
    // Update offline status
    await updateDoc(doc(firestore, 'users', auth.currentUser.uid), {
      online: false,
      lastSeen: serverTimestamp()
    });
    
    await firebaseSignOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};

