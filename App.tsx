import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EmailComposerScreen from './src/screens/EmailComposerScreen';
import OfflineLetterScreen from './src/screens/OfflineLetterScreen';
import LetterHistoryScreen from './src/screens/LetterHistoryScreen';
import { COLORS } from './src/config/theme';

type Screen = 'login' | 'home' | 'email' | 'offline' | 'letterHistory';

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

  const handleSignIn = (u: User) => {
    setUser(u);
    setScreen('home');
  };

  const handleSignOut = () => {
    setUser(null);
    setScreen('login');
  };

  const handleContinueAsGuest = () => {
    setUser(null);
    setScreen('home');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {screen === 'login' && (
        <LoginScreen
          onSignIn={handleSignIn}
          onContinueAsGuest={handleContinueAsGuest}
        />
      )}
      {screen === 'home' && (
        <HomeScreen
          user={user}
          onNavigateEmail={() => setScreen('email')}
          onNavigateOffline={() => setScreen('offline')}
          onNavigateLetterHistory={() => setScreen('letterHistory')}
          onSignOut={handleSignOut}
        />
      )}
      {screen === 'email' && (
        <EmailComposerScreen user={user} onBack={() => setScreen('home')} />
      )}
      {screen === 'offline' && (
        <OfflineLetterScreen user={user} onBack={() => setScreen('home')} />
      )}
      {screen === 'letterHistory' && (
        <LetterHistoryScreen user={user} onBack={() => setScreen('home')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
