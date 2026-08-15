import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ActionButton from '../components/ActionButton';
import ImpactCounter from '../components/ImpactCounter';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  onSignIn: (user: {
    uid: string;
    name: string;
    email: string;
    photoUrl?: string;
    googleAccessToken?: string;
  }) => void;
  onContinueAsGuest: () => void;
}

// Replace CLIENT_IDs with your Google OAuth client IDs from
// https://console.cloud.google.com → APIs & Services → Credentials
const EXPO_CLIENT_ID = '886924812961-f18g76anqoihgqi4583c43shc9auob5l.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '886924812961-i53itkgekg326meg1muiaivh92ces03j.apps.googleusercontent.com';
const IOS_CLIENT_ID = '886924812961-b3oatflfqr9hrtmvf1jhdd08hrsimlcj.apps.googleusercontent.com';

export default function LoginScreen({ onSignIn, onContinueAsGuest }: Props) {
  const [loading, setLoading] = useState(false);

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: EXPO_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
    redirectUri: Platform.OS === 'web' 
      ? typeof window !== 'undefined' ? window.location.origin : 'https://kazirangavoice.in'
      : AuthSession.makeRedirectUri({
          scheme: undefined,
        }),
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchGoogleUser(authentication?.accessToken ?? '');
    } else if (response?.type === 'error') {
      setLoading(false);
      Alert.alert('Sign-in failed', response.error?.message ?? 'Please try again.');
    }
  }, [response]);

  const fetchGoogleUser = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Sign in with Firebase using the Google credential
      const credential = GoogleAuthProvider.credential(null, token);
      const userCredential = await signInWithCredential(auth, credential);

      onSignIn({
        uid: userCredential.user.uid,
        name: data.name,
        email: data.email,
        photoUrl: data.picture,
        googleAccessToken: token,
      });
    } catch {
      Alert.alert('Error', 'Could not retrieve user info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    await promptAsync();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader size="large" />

      <View style={styles.bannerBox}>
        <Text style={styles.bannerTitle}>🌿 Protect Kaziranga</Text>
        <Text style={styles.bannerText}>
          Kaziranga National Park — a UNESCO World Heritage Site — is under
          threat. The proposed reduction of its Eco-Sensitive Zone and the
          construction of a luxury hotel on indigenous lands endanger the
          world's largest population of the Indian one-horned rhinoceros,
          Asian elephants, tigers, wild water buffalo, and hundreds of bird
          species.
        </Text>
        <Text style={styles.bannerText}>
          This app makes it easy to{' '}
          <Text style={styles.bold}>raise your voice</Text> — send a
          pre-drafted email to the Director of Kaziranga National Park, or
          record an offline letter you've sent via post. Every action is
          counted, every voice matters.
        </Text>
      </View>

      <View style={styles.calloutBox}>
        <Text style={styles.calloutTitle}>Protect Indigenous Lands</Text>
        <Text style={styles.calloutText}>
          Indigenous advocates such as Pranab Doley from the Mising community
          have helped spotlight that the land around Kaziranga is not just
          habitat, but homeland. The proposed hotel development must not
          silence indigenous voices or override their land, livelihood,
          cultural, and customary rights.
        </Text>
      </View>

      <View style={styles.factsBox}>
        <Text style={styles.factTitle}>Did you know?</Text>
        <Text style={styles.factItem}>🦏 Kaziranga hosts ~2,600 one-horned rhinos — 70% of the world's population.</Text>
        <Text style={styles.factItem}>🐯 It has one of the highest tiger densities globally.</Text>
        <Text style={styles.factItem}>🐘 Over 1,000 Asian elephants roam its grasslands.</Text>
        <Text style={styles.factItem}>🐦 480+ bird species — a recognised Important Bird Area.</Text>
        <Text style={styles.factItem}>🌊 The ESZ buffer is critical for flood-season wildlife migration.</Text>
      </View>

      <View style={styles.trackerIntroBox}>
        <Text style={styles.trackerIntroTitle}>Live Action Tracker</Text>
        <Text style={styles.trackerIntroText}>
          Watch the campaign move in real time as people send emails and record
          posted letters for Kaziranga.
        </Text>
      </View>

      <ImpactCounter />

      <Text style={styles.loginPrompt}>
        Sign in with Google to compose and send your message.
      </Text>

      <ActionButton
        onPress={handleSignIn}
        label="Sign in with Google"
        loading={loading}
        icon="🔑"
        variant="primary"
      />

      <ActionButton
        onPress={onContinueAsGuest}
        label="Continue without Sign-In"
        icon="👤"
        variant="outline"
      />

      <Text style={styles.privacyNote}>
        Sign-in is required to send or record actions. Guest mode is view-only.
        No data is shared with third parties.
      </Text>
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
  bannerBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 18,
    marginVertical: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  bannerText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: { fontWeight: '700' },
  calloutBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 6,
  },
  calloutText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  factsBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  factTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 8,
  },
  factItem: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 5,
    lineHeight: 20,
  },
  trackerIntroBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  trackerIntroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D47A1',
    marginBottom: 6,
  },
  trackerIntroText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
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
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 17,
  },
});
