import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Alert, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
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
        <ScrollView contentContainerStyle={styles.signInScroll} showsVerticalScrollIndicator={false}>
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
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>What signing in looks like</Text>
                <Text style={styles.demoText}>
                  These are the Google screens you'll see before Kaziranga Voice can send emails on your behalf.
                </Text>
                <View style={styles.demoGrid}>
                  <View style={styles.demoCard}>
                    <Image
                      source={require('./assets/google-auth-account-blurred.png')}
                      style={styles.demoImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.demoCaption}>Choose the Google account you want to use.</Text>
                  </View>
                  <View style={styles.demoCard}>
                    <Image
                      source={require('./assets/google-auth-consent-highlighted.png')}
                      style={styles.demoImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.demoCaption}>Review the permissions and tap Allow to continue.</Text>
                  </View>
                </View>
                <View style={styles.demoNote}>
                  <Text style={styles.demoNoteTitle}>What you're signing up for:</Text>
                  <Text style={styles.demoNoteBody}>
                    You are allowing Kaziranga Voice to use your Google account to send advocacy emails and keep a
                    record of successful sends. You can disconnect Google access and delete your saved details yourself
                    later.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
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
  signInScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  greeting: { fontSize: 18, color: '#333', textAlign: 'center', paddingHorizontal: 24 },
  signInBtn: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  demoSection: {
    width: '100%',
    maxWidth: 980,
    marginTop: 10,
    gap: 12,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
  },
  demoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  demoCard: {
    width: 340,
    maxWidth: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  demoImage: {
    width: '100%',
    height: 340,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
  },
  demoCaption: {
    marginTop: 10,
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    textAlign: 'center',
  },
  demoNote: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
    borderRadius: 12,
    padding: 14,
  },
  demoNoteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 6,
  },
  demoNoteBody: {
    fontSize: 14,
    color: '#234',
    lineHeight: 20,
  },
});
