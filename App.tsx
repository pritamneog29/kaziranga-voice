import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Alert } from 'react-native';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import EmailComposerScreen from './src/screens/EmailComposerScreen';
import { COLORS } from './src/config/theme';
import { auth } from './src/config/firebase';
import { useGoogleAuth, GoogleUser } from './src/hooks/useGoogleAuth';

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const { signIn, loading: signingIn } = useGoogleAuth();

  // Wait for Firebase to restore any existing session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        // Existing session — user is already signed in (no access token available this way)
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? 'Google User',
          email: firebaseUser.email ?? '',
          photoUrl: firebaseUser.photoURL ?? undefined,
          googleAccessToken: undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  // Once Firebase auth check is done and no user, trigger sign-in
  useEffect(() => {
    if (!authChecked || loading || user || signingIn) return;

    const doSignIn = async () => {
      const signedInUser = await signIn();
      if (signedInUser) {
        setUser(signedInUser);
      } else {
        // Sign-in failed or cancelled — go back to landing page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    void doSignIn();
  }, [authChecked, loading, user, signingIn]);

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

  if (loading || signingIn || !user) {
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
