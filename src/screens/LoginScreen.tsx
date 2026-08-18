import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import {
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ActionButton from '../components/ActionButton';
import ImpactCounter from '../components/ImpactCounter';
import PetitionBlock from '../components/PetitionBlock';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  onSignIn: (user: {
    uid: string;
    name: string;
    email: string;
    photoUrl?: string;
    googleAccessToken?: string;
  }) => void;
}

// Replace CLIENT_IDs with your Google OAuth client IDs from
// https://console.cloud.google.com → APIs & Services → Credentials
const EXPO_CLIENT_ID = '886924812961-f18g76anqoihgqi4583c43shc9auob5l.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '886924812961-i53itkgekg326meg1muiaivh92ces03j.apps.googleusercontent.com';
const IOS_CLIENT_ID = '886924812961-b3oatflfqr9hrtmvf1jhdd08hrsimlcj.apps.googleusercontent.com';

export default function LoginScreen({ onSignIn }: Props) {
  const [loading, setLoading] = useState(false);
  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;
  const magazineMinHeight = Math.max(620, Math.round(height * 0.72));

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: EXPO_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
    redirectUri: AuthSession.makeRedirectUri({
      scheme: undefined,
    }),
  });

  React.useEffect(() => {
    if (Platform.OS !== 'web' && response?.type === 'success') {
      const { authentication } = response;
      fetchGoogleUser(authentication?.accessToken ?? '');
    } else if (Platform.OS !== 'web' && response?.type === 'error') {
      setLoading(false);
      Alert.alert('Sign-in failed', response.error?.message ?? 'Please try again.');
    }
  }, [response]);

  const completeSignIn = ({
    accessToken,
    name,
    email,
    photoUrl,
    uid,
  }: {
    accessToken: string;
    name?: string | null;
    email?: string | null;
    photoUrl?: string | null;
    uid: string;
  }) => {
    onSignIn({
      uid,
      name: name?.trim() || 'Google User',
      email: email?.trim() || '',
      photoUrl: photoUrl ?? undefined,
      googleAccessToken: accessToken,
    });
  };

  const fetchGoogleUser = async (token: string) => {
    if (!token) {
      setLoading(false);
      Alert.alert('Sign-in failed', 'Google did not return an access token.');
      return;
    }

    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Google user info request failed (${res.status}).`);
      }
      const data = await res.json();

      // Sign in with Firebase using the Google credential
      const credential = GoogleAuthProvider.credential(null, token);
      const userCredential = await signInWithCredential(auth, credential);

      completeSignIn({
        uid: userCredential.user.uid,
        name: data.name ?? userCredential.user.displayName,
        email: data.email ?? userCredential.user.email,
        photoUrl: data.picture ?? userCredential.user.photoURL,
        accessToken: token,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not retrieve user info. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleWebSignIn = async () => {
    try {
      console.log('🔴 handleWebSignIn called');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('🔴 signInWithPopup result, uid:', result.user.uid);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      console.log('🔴 accessToken from credential:', accessToken ? 'EXISTS' : 'MISSING');

      if (!accessToken) {
        throw new Error('Google did not return Gmail access for this sign-in.');
      }

      console.log('🔴 About to call onSignIn with accessToken');
      onSignIn({
        uid: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        photoUrl: result.user.photoURL,
        googleAccessToken: accessToken,
      });
      console.log('🔴 onSignIn finished');
    } catch (error) {
      console.log('🔴 handleWebSignIn error:', error);
      const message =
        error instanceof Error ? error.message : 'Please try signing in again.';
      Alert.alert('Sign-in failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    console.log('🔴 LoginScreen handleSignIn called, Platform.OS:', Platform.OS);
    setLoading(true);
    if (Platform.OS === 'web') {
      console.log('🔴 Platform is web, calling handleWebSignIn');
      await handleWebSignIn();
      return;
    }

    console.log('🔴 Platform is not web, calling promptAsync');
    await promptAsync();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader size="large" />

      <View
        style={[
          styles.magazineLayout,
          isWide ? styles.magazineWide : styles.magazineNarrow,
          isWide && { minHeight: magazineMinHeight },
        ]}
      >
        <View style={[styles.mainColumn, !isWide && styles.mainColumnNarrow]}>
          <View style={[styles.storyCard, styles.storyGreen]}>
            <Text style={styles.storyTitle}>Protect Kaziranga</Text>
            <Text style={styles.storyText}>
              Kaziranga National Park — a UNESCO World Heritage Site — is under
              threat. The proposed reduction of its Eco-Sensitive Zone and the
              construction of a luxury hotel on indigenous lands endanger the
              world's largest population of the Indian one-horned rhinoceros,
              Asian elephants, tigers, wild water buffalo, and hundreds of bird
              species.
            </Text>
            <Text style={styles.storyText}>
              This app makes it easy to <Text style={styles.bold}>raise your voice</Text> — send a pre-drafted email to the Director of Kaziranga National Park. This website tracks every successful email sent in the live tracker below.
            </Text>
          </View>

          <View style={[styles.storyCard, styles.storyOrange]}>
            <Text style={styles.storyTitle}>Protect Indigenous Lands</Text>
            <Text style={styles.storyText}>
              Indigenous advocates such as Pranab Doley from the Mising
              community have helped spotlight that the land around Kaziranga is
              not just habitat, but homeland. The proposed hotel development
              must not silence indigenous voices or override their land,
              livelihood, cultural, and customary rights.
            </Text>
          </View>

          <View style={[styles.storyCard, styles.storyYellow]}>
            <Text style={styles.storyTitle}>Did you know?</Text>
            <Text style={styles.factItem}>🦏 Kaziranga hosts ~2,600 one-horned rhinos — 70% of the world's population.</Text>
            <Text style={styles.factItem}>🐯 It has one of the highest tiger densities globally.</Text>
            <Text style={styles.factItem}>🐘 Over 1,000 Asian elephants roam its grasslands.</Text>
            <Text style={styles.factItem}>🐦 480+ bird species — a recognised Important Bird Area.</Text>
            <Text style={styles.factItem}>🌊 The ESZ buffer is critical for flood-season wildlife migration.</Text>
          </View>
        </View>

        <View style={[styles.sideColumn, !isWide && styles.sideColumnNarrow]}>
          <ImpactCounter />

          <PetitionBlock />

          <View style={[styles.storyCard, styles.storyNeutral, styles.ctaCard]}>
            <Text style={styles.sideTitle}>Ready to send?</Text>
            <Text style={styles.storyText}>
              Sign in with Google to compose and send your message.
            </Text>
            <View style={styles.ctaButtonWrap}>
              <ActionButton
                onPress={handleSignIn}
                label="Sign in with Google"
                loading={loading}
                icon="🔑"
                variant="primary"
              />
            </View>
            <Text style={styles.privacyNote}>
              Sign-in is required to send email. No data is shared with third parties.
            </Text>
          </View>

          <View style={[styles.storyCard, styles.storyFuture]}>
            <Text style={styles.sideTitle}>Future Plan</Text>
            <Text style={styles.storyText}>
              Later versions may include more campaign actions, message
              refinements, and additional ways to keep the movement active.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  magazineLayout: {
    marginTop: 14,
    marginBottom: 14,
    gap: 12,
    width: '100%',
    alignSelf: 'center',
  },
  magazineWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  magazineNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  mainColumn: {
    flex: 0.96,
    maxWidth: 640,
    gap: 12,
  },
  mainColumnNarrow: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  sideColumn: {
    flex: 0.72,
    maxWidth: 360,
    gap: 12,
  },
  sideColumnNarrow: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    marginTop: 12,
  },
  ctaCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ctaButtonWrap: {
    marginTop: 14,
  },
  storyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  storyGreen: {
    backgroundColor: '#F1F8EF',
    borderLeftColor: COLORS.primary,
  },
  storyOrange: {
    backgroundColor: '#FFF4E7',
    borderLeftColor: COLORS.accent,
  },
  storyYellow: {
    backgroundColor: '#FFF8E1',
    borderLeftColor: '#F4B400',
  },
  storyBlue: {
    backgroundColor: '#EDF4FF',
    borderLeftColor: '#2B7FFF',
  },
  storyNeutral: {
    backgroundColor: '#F7F7F7',
    borderLeftColor: '#9CA3AF',
  },
  storyFuture: {
    backgroundColor: '#EDF4FF',
    borderLeftColor: '#2B7FFF',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  storyText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  factItem: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 23,
  },
  bold: { fontWeight: '700' },
  loginPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  privacyNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'left',
    marginTop: 10,
    lineHeight: 17,
  },
});
