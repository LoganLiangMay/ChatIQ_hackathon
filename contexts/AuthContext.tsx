import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';
import { getFirebaseAuth, initializeFirebase } from '@/services/firebase/config';
import { useNotifications } from '@/hooks/useNotifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  // Initialize notifications when user is authenticated
  useNotifications();
  
  // Monitor Firebase auth state
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupAuthListener = async () => {
      try {
        console.log('🔵 [AuthContext] Initializing Firebase...');
        await initializeFirebase();
        console.log('✅ [AuthContext] Firebase initialized');
        
        const auth = await getFirebaseAuth();
        console.log('✅ [AuthContext] Auth instance obtained');
        
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          console.log('Auth state changed:', firebaseUser?.uid || 'signed out');
          setUser(firebaseUser);
          setLoading(false);
        });
      } catch (error) {
        console.error('❌ [AuthContext] Failed to initialize Firebase:', error);
        setLoading(false);
      }
    };
    
    setupAuthListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
  
  // Auto-navigate based on auth state
  useEffect(() => {
    if (loading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // User not signed in, redirect to sign in
      console.log('Redirecting to sign in');
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      // User signed in, redirect to app
      console.log('Redirecting to chats');
      router.replace('/(tabs)/chats');
    }
  }, [user, loading, segments]);
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

