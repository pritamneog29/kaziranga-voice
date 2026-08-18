import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import {
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

const EXPO_CLIENT_ID = '886924812961-f18g76anqoihgqi4583c43shc9auob5l.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '886924812961-i53itkgekg326meg1muiaivh92ces03j.apps.googleusercontent.com';
const IOS_CLIENT_ID = '886924812961-b3oatflfqr9hrtmvf1jhdd08hrsimlcj.apps.googleusercontent.com';

export interface GoogleUser {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  googleAccessToken?: string;
}

export interface UseGoogleAuthResult {
  signIn: () => Promise<GoogleUser | null>;
  loading: boolean;
  error: string | null;
}

export const useGoogleAuth = (): UseGoogleAuthResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: EXPO_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
    redirectUri: AuthSession.makeRedirectUri({
      scheme: undefined,
    }),
  });

  const fetchGoogleUser = useCallback(
    async (token: string): Promise<GoogleUser | null> => {
      if (!token) {
        const err = 'Google did not return an access token.';
        setError(err);
        setLoading(false);
        return null;
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

        const user: GoogleUser = {
          uid: userCredential.user.uid,
          name: data.name ?? userCredential.user.displayName ?? 'Google User',
          email: data.email ?? userCredential.user.email ?? '',
          photoUrl: data.picture ?? userCredential.user.photoURL ?? undefined,
          googleAccessToken: token,
        };

        setError(null);
        return user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not retrieve user info.';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleWebSignIn = useCallback(async (): Promise<GoogleUser | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Google did not return Gmail access for this sign-in.');
      }

      setError(null);
      return {
        uid: result.user.uid,
        name: result.user.displayName ?? 'Google User',
        email: result.user.email ?? '',
        photoUrl: result.user.photoURL ?? undefined,
        googleAccessToken: accessToken,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try signing in again.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (): Promise<GoogleUser | null> => {
    setLoading(true);
    setError(null);

    // Check if we're on web
    if (typeof window !== 'undefined') {
      return await handleWebSignIn();
    }

    // Mobile flow
    await promptAsync();

    if (response?.type === 'success') {
      const { authentication } = response;
      return await fetchGoogleUser(authentication?.accessToken ?? '');
    } else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Sign-in failed');
      setLoading(false);
      return null;
    }

    setLoading(false);
    return null;
  }, [response, promptAsync, fetchGoogleUser, handleWebSignIn]);

  return { signIn, loading, error };
};
