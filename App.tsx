import React, { useEffect, useState } from 'react';
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
  const desiredStartScreen: Screen =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('start') === 'compose'
      ? 'email'
      : 'home';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? 'Google User',
          email: firebaseUser.email ?? '',
          photoUrl: firebaseUser.photoURL ?? undefined,
          googleAccessToken: undefined,
        });
        setScreen(desiredStartScreen);
      } else {
        setUser(null);
        setScreen('login');
      }
    });

    return unsubscribe;
  }, [desiredStartScreen]);

  const handleSignIn = (u: User) => {
    setUser(u);
    setScreen(desiredStartScreen);
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
