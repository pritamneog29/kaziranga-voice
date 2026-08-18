import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Alert, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import EmailComposerScreen from './src/screens/EmailComposerScreen';
import { COLORS } from './src/config/theme';
import { auth } from './src/config/firebase';
import { useGoogleAuth, GoogleUser } from './src/hooks/useGoogleAuth';

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { signIn, loading: signingIn } = useGoogleAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        // Existing Firebase session — no access token available, user must click to re-auth
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
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    const signedInUser = await signIn();
    if (signedInUser) {
      setUser(signedInUser);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      Alert.alert('Sign-out Issue', error?.message ?? 'Could not sign out.');
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // Firebase still checking auth state
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary ?? '#2D6A4F'} />
        </View>
      </SafeAreaView>
    );
  }

  // No user or user has no access token — show sign-in button (must be a direct click)
  if (!user || !user.googleAccessToken) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.center}>
          {signingIn ? (
            <ActivityIndicator size="large" color={COLORS.primary ?? '#2D6A4F'} />
          ) : (
            <>
              <Text style={styles.greeting}>
                {user ? `Welcome back, ${user.name}` : 'Sign in to continue'}
              </Text>
              <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn}>
                <Text style={styles.signInText}>🔑  Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <EmailComposerScreen
        user={user}
        onBack={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
        onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
        onSignOut={() => { void handleSignOut(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 },
  greeting: { fontSize: 18, color: '#333', textAlign: 'center', paddingHorizontal: 24 },
  signInBtn: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
