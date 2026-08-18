import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Alert } from 'react-native';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import EmailComposerScreen from './src/screens/EmailComposerScreen';
import { COLORS } from './src/config/theme';
import { auth } from './src/config/firebase';

interface User {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  googleAccessToken?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const cachedAccessTokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        const updatedUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? 'Google User',
          email: firebaseUser.email ?? '',
          photoUrl: firebaseUser.photoURL ?? undefined,
          googleAccessToken: cachedAccessTokenRef.current,
        };
        setUser(updatedUser);
      } else {
        setUser(null);
        cachedAccessTokenRef.current = undefined;
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Extract and cache access token from URL params if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('accessToken');
      if (token) {
        cachedAccessTokenRef.current = token;
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      Alert.alert(
        'Sign-out Issue',
        error?.message ?? 'Could not fully sign out from Google session.',
      );
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <EmailComposerScreen
        user={user}
        onBack={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }}
        onHome={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }}
        onSignOut={() => {
          void handleSignOut();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
