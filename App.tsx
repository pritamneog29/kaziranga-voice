import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Alert } from 'react-native';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EmailComposerScreen from './src/screens/EmailComposerScreen';
import { COLORS } from './src/config/theme';
import { auth } from './src/config/firebase';

type Screen = 'login' | 'home' | 'email';

interface User {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  googleAccessToken?: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const cachedAccessTokenRef = useRef<string | undefined>(undefined);
  const desiredStartScreen: Screen =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('start') === 'compose'
      ? 'email'
      : 'home';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      console.log('🔴 onAuthStateChanged fired, firebaseUser:', firebaseUser?.uid);
      console.log('🔴 cachedAccessToken (from ref) in auth state:', cachedAccessTokenRef.current);
      if (firebaseUser) {
        // Update user with cached token
        const updatedUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? 'Google User',
          email: firebaseUser.email ?? '',
          photoUrl: firebaseUser.photoURL ?? undefined,
          googleAccessToken: cachedAccessTokenRef.current,
        };
        setUser(updatedUser);
        // For session resumption (not fresh sign-in), navigate to desired screen if logged in
        setScreen(desiredStartScreen);
      } else {
        setUser(null);
        cachedAccessTokenRef.current = undefined;
        setScreen('login');
      }
    });

    return unsubscribe;
  }, []);

  const handleSignIn = (u: User) => {
    console.log('🔴 App.tsx handleSignIn called with user:', u);
    console.log('🔴 googleAccessToken in handleSignIn:', u.googleAccessToken);
    if (u.googleAccessToken) {
      console.log('🔴 Caching accessToken in ref:', u.googleAccessToken);
      cachedAccessTokenRef.current = u.googleAccessToken;
    }
    setUser(u);
    console.log('🔴 Setting screen to: email (navigate to compose after fresh sign-in)');
    setScreen('email');
  };

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
      setScreen('login');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {screen === 'login' && (
        <LoginScreen onSignIn={handleSignIn} />
      )}
      {screen === 'home' && (
        <HomeScreen
          user={user}
          onNavigateEmail={() => setScreen('email')}
          onSignOut={() => {
            void handleSignOut();
          }}
        />
      )}
      {screen === 'email' && (
        <EmailComposerScreen
          user={user}
          onBack={() => setScreen('home')}
          onHome={() => setScreen('home')}
          onSignOut={() => {
            void handleSignOut();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
