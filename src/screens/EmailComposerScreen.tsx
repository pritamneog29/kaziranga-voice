import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '../config/theme';
import ActionButton from '../components/ActionButton';
import ImpactCounter from '../components/ImpactCounter';
import {
  DIRECTOR_EMAIL,
  DEFAULT_SUBJECT,
  buildDefaultBody,
} from '../config/emailTemplate';
import {
  cleanupExpiredUserOnlineMailStatus,
  deleteAllUserOnlineMailStatus,
  getUserOnlineMailStatus,
  markUserOnlineMailSent,
  recordOnlineMail,
} from '../config/firestore';
import PetitionBlock from '../components/PetitionBlock';

interface Props {
  user: {
    uid: string;
    name: string;
    email: string;
    photoUrl?: string;
    googleAccessToken?: string;
  } | null;
  onBack: () => void;
  onHome: () => void;
  onSignOut: () => void;
}

type SendState = 'idle' | 'sending' | 'sent' | 'failed';

interface OnlineMailStatusPanel {
  recipient: string;
  dayKey: string;
  senderName: string;
  senderEmail: string;
  sentAt: Date | null;
}

const onlineMailStatusCache = new Map<string, OnlineMailStatusPanel>();
const onlineMailStatusCleanupCache = new Set<string>();

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EmailComposerScreen({ user, onBack, onHome, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [draftSeed, setDraftSeed] = useState(
    () => `${Date.now()}-${Math.random()}`,
  );
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [senderName, setSenderName] = useState(user?.name ?? '');
  const [senderEmail, setSenderEmail] = useState(user?.email ?? '');
  const [primaryRecipient, setPrimaryRecipient] = useState(DIRECTOR_EMAIL);
  const [otherRecipients, setOtherRecipients] = useState('');
  const [personalExperience, setPersonalExperience] = useState('');
  const [body, setBody] = useState('');
  const [bodyEdited, setBodyEdited] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const currentDayKey = getLocalDayKey();
  const normalizedPrimaryRecipient = primaryRecipient.trim().toLowerCase();
  const currentStatusKey = `${user?.uid ?? 'no-user'}|${normalizedPrimaryRecipient}|${currentDayKey}`;
  const cachedStatus = onlineMailStatusCache.get(currentStatusKey) ?? null;
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendStateText, setSendStateText] = useState('');
  const [checkingSendEligibility, setCheckingSendEligibility] = useState(false);
  const [hasAlreadySent, setHasAlreadySent] = useState(Boolean(cachedStatus));
  const [loadedStatusKey, setLoadedStatusKey] = useState('');
  const [statusPanel, setStatusPanel] = useState<OnlineMailStatusPanel | null>(
    cachedStatus,
  );
  const isCurrentStatusLoaded = loadedStatusKey === currentStatusKey;
  const isSendLockedForUser = isCurrentStatusLoaded && hasAlreadySent;

  const clearCachedStatusForUser = (uid: string) => {
    const userPrefix = `${uid}|`;
    for (const cacheKey of onlineMailStatusCache.keys()) {
      if (cacheKey.startsWith(userPrefix)) {
        onlineMailStatusCache.delete(cacheKey);
      }
    }
  };

  const handleDeleteMyData = async () => {
    if (!user?.uid) return;
    setDeletingData(true);
    try {
      await deleteAllUserOnlineMailStatus(user.uid);
      clearCachedStatusForUser(user.uid);
      setHasAlreadySent(false);
      setStatusPanel(null);
      setLoadedStatusKey(currentStatusKey);
      setSendState('idle');
      setSendStateText('');
      Alert.alert('Deleted', 'Your data has been deleted. You will need to sign in again to send emails.');
      // Log out user so they have to re-authenticate and get a fresh token
      onSignOut();
    } catch (error: any) {
      Alert.alert('Something went wrong', error?.message ?? 'Could not delete your data. Please try again.');
    } finally {
      setDeletingData(false);
    }
  };

  useEffect(() => {
    setDraftSeed(`${Date.now()}-${Math.random()}`);
  }, [primaryRecipient]);

  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with Google to send an email.',
        [{ text: 'OK', onPress: onBack }],
      );
    }
  }, [onBack, user]);

  useEffect(() => {
    let active = true;

    const loadSendStatus = async () => {
      if (!user?.uid) {
        setHasAlreadySent(false);
        setLoadedStatusKey('');
        setStatusPanel(null);
        setSendState('idle');
        setSendStateText('');
        return;
      }

      setCheckingSendEligibility(true);
      try {
        const cleanupKey = `${user.uid}|${currentDayKey}`;
        if (!onlineMailStatusCleanupCache.has(cleanupKey)) {
          try {
            await cleanupExpiredUserOnlineMailStatus(user.uid);
            onlineMailStatusCleanupCache.add(cleanupKey);
          } catch (cleanupError: any) {
            console.warn(
              'Failed to clean up expired user online-mail records:',
              cleanupError?.message ?? 'Unknown error',
            );
          }
        }

        const record = await getUserOnlineMailStatus(
          user.uid,
          primaryRecipient,
          currentDayKey,
        );
        if (!active) {
          return;
        }

        const sent = Boolean(record?.sent);
        setHasAlreadySent(sent);
        setLoadedStatusKey(currentStatusKey);
        setStatusPanel(
          record
            ? {
                recipient: record.recipient,
                dayKey: record.dayKey,
                senderName: record.senderName || senderName || user.name,
                senderEmail: record.senderEmail || senderEmail || user.email,
                sentAt: record.sentAt,
              }
            : null,
        );
        if (record) {
          onlineMailStatusCache.set(currentStatusKey, {
            recipient: record.recipient,
            dayKey: record.dayKey,
            senderName: record.senderName || senderName || user.name,
            senderEmail: record.senderEmail || senderEmail || user.email,
            sentAt: record.sentAt,
          });
        } else {
          onlineMailStatusCache.delete(currentStatusKey);
        }
        if (sent) {
          setSendState('sent');
          setSendStateText('You already sent to this recipient today.');
        } else {
          setSendState('idle');
          setSendStateText('');
        }
      } catch (e: any) {
        if (active) {
          const fallback = onlineMailStatusCache.get(currentStatusKey) ?? null;
          const sent = Boolean(fallback);
          setHasAlreadySent(sent);
          setLoadedStatusKey(currentStatusKey);
          setStatusPanel(fallback);
          setSendState(sent ? 'sent' : 'idle');
          setSendStateText(sent ? 'You already sent to this recipient today.' : '');
          console.warn(
            'Failed to verify send status; using cached status if available:',
            e?.message ?? 'Unknown error',
          );
        }
      } finally {
        if (active) {
          setCheckingSendEligibility(false);
        }
      }
    };

    void loadSendStatus();
    return () => {
      active = false;
    };
  }, [currentDayKey, currentStatusKey, primaryRecipient, user?.uid]);

  if (!user) {
    return null;
  }

  const getBody = () =>
    bodyEdited
      ? body
      : buildDefaultBody(personalExperience, senderName, draftSeed);

  const parseRecipients = (value: string): string[] =>
    value
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const encodeBase64Url = (text: string): string => {
    if (typeof globalThis.btoa !== 'function') {
      throw new Error('Base64 encoder is not available on this device.');
    }
    const binaryUtf8 = encodeURIComponent(text).replace(
      /%([0-9A-F]{2})/g,
      (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
    );
    return globalThis
      .btoa(binaryUtf8)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  };

  const sendViaGmailApi = async (
    accessToken: string,
    recipients: string[],
    currentSubject: string,
    currentBody: string,
  ) => {
    const rfc822Message = [
      `To: ${recipients.join(', ')}`,
      `Subject: ${currentSubject}`,
      `Reply-To: ${senderEmail.trim()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      currentBody,
    ].join('\r\n');

    const raw = encodeBase64Url(rfc822Message);
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gmail API send failed (${response.status}): ${errorText || 'Unknown error'}`,
      );
    }
  };

  const handleSend = useCallback(async () => {
    console.log('🔴 DEBUG: handleSend called');
    console.log('🔴 DEBUG: isSendLockedForUser =', isSendLockedForUser);
    if (isSendLockedForUser) {
      Alert.alert(
        'Already Sent',
        'This account has already sent the email. Sending is disabled for this user.',
      );
      return;
    }

    console.log('🔴 DEBUG: senderEmail =', senderEmail, 'trimmed =', senderEmail.trim());
    if (!senderEmail.trim()) {
      Alert.alert(
       'Email Required',
       'Please enter your email address before sending the message.',
      );
      return;
    }

    console.log('🔴 DEBUG: user?.googleAccessToken =', !!user?.googleAccessToken);
    if (!user?.googleAccessToken) {
      Alert.alert(
       'Google Sign-In Required',
       'Please sign in again so the app can send through your Google account.',
      );
      return;
    }
    
    console.log('🔴 DEBUG: Passed all checks, proceeding to send...');

    setSending(true);
    setSendState('sending');
    setSendStateText('Sending...');
    try {
      const recipients = [primaryRecipient, ...parseRecipients(otherRecipients)];
      const uniqueRecipients = Array.from(new Set(recipients));
      const bodyText = getBody();

      await sendViaGmailApi(
       user.googleAccessToken,
       uniqueRecipients,
       subject,
       bodyText,
      );
      try {
       await recordOnlineMail();
      } catch (e: any) {
       console.error('Record mail failed:', e);
      }
      try {
       await markUserOnlineMailSent(
         user.uid,
         primaryRecipient,
         {
           uid: user.uid,
           name: senderName.trim() || user.name,
           email: senderEmail.trim() || user.email,
         },
         currentDayKey,
       );
      } catch (e: any) {
       console.warn('Mark send failed (non-critical):', e?.message);
      }
      setHasAlreadySent(true);
      setLoadedStatusKey(currentStatusKey);
      const nextStatusPanel = {
        recipient: normalizedPrimaryRecipient,
        dayKey: currentDayKey,
        senderName: senderName.trim() || user.name,
        senderEmail: senderEmail.trim() || user.email,
        sentAt: new Date(),
      };
      setStatusPanel(nextStatusPanel);
      onlineMailStatusCache.set(currentStatusKey, nextStatusPanel);
      setSendState('sent');
      setSendStateText('Sent successfully via Gmail API and counted.');
      Alert.alert(
       '✅ Email Sent!',
       'Your email was sent via your Google account and recorded.',
       [{ text: 'Go Back', onPress: onBack }],
      );
    } catch (e: any) {
      const message = e?.message ?? 'Could not send email.';
      setSendState('failed');
      setSendStateText(`Failed: ${message}`);
      if (message.includes('Gmail API send failed (403)')) {
       Alert.alert(
         'Permission Not Granted Yet',
         'Google blocked Gmail API send for this app right now (usually because the app is unverified or consent was not fully granted). Please continue from the warning screen with "unsafe", ensure your account is added as a test user, then try again.',
       );
      } else {
       Alert.alert('Error', message);
      }
    } finally {
      setSending(false);
    }
  }, [isSendLockedForUser, senderEmail, user, sendViaGmailApi, parseRecipients, otherRecipients, subject, getBody, recordOnlineMail, markUserOnlineMailSent, currentDayKey, senderName, setHasAlreadySent, setLoadedStatusKey, currentStatusKey, normalizedPrimaryRecipient, setStatusPanel, onlineMailStatusCache, setSendState, setSendStateText, onBack, setSending, primaryRecipient]);

  const handleBodyChange = (text: string) => {
    setBody(text);
    setBodyEdited(true);
  };

  const handleResetBody = () => {
    Alert.alert('Reset Email Body', 'Reset to the default pre-drafted message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => {
          setBodyEdited(false);
          setBody('');
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Green header bar — matches landing page */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/';
            } else {
              onBack();
            }
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageHeaderTitle}>🦏 Kaziranga Voice</Text>
        <Text style={styles.pageHeaderSub}>📧 Compose Email</Text>
      </View>

      <View style={styles.pageShell}>
        <View style={[styles.magazineLayout, isWide ? styles.magazineWide : styles.magazineNarrow]}>
          <View style={[styles.mainColumn, !isWide && styles.mainColumnNarrow]}>
            {!isWide && (
              <>
                <View style={[styles.storyCard, styles.storyBlue]}>
                  <Text style={styles.sideTitle}>Compose guide</Text>
                  <Text style={styles.sideText}>
                    Keep the message direct, personal, and rooted in Kaziranga's wildlife and indigenous land rights.
                  </Text>
                </View>

                <View style={[styles.storyCard, styles.storyOrange]}>
                  <Text style={styles.sideTitle}>Personal touch</Text>
                  <Text style={styles.sideText}>
                    Add one memory or observation from Kaziranga to make the email feel authentic.
                  </Text>
                </View>
              </>
            )}

            <Text style={styles.label}>Primary Recipient (To:)</Text>
            <TextInput
              style={styles.input}
              value={primaryRecipient}
              onChangeText={setPrimaryRecipient}
              placeholder="recipient@example.com"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.recipientHint}>
              Default is the Director of Kaziranga National Park. For testing, you can change this to your own email.
            </Text>

            <Text style={styles.label}>Additional Recipients</Text>
            <TextInput
              style={styles.input}
              value={otherRecipients}
              onChangeText={setOtherRecipients}
              placeholder="comma-separated emails, e.g. local.officer@example.com, activist@example.org"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.recipientHint}>
              Add other recipients to copy them on this message (optional).
            </Text>

            <Text style={styles.senderNote}>
              Using your signed-in identity. You can still edit it below.
            </Text>

            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={senderName}
              onChangeText={setSenderName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>Your Email</Text>
            <TextInput
              style={styles.input}
              value={senderEmail}
              onChangeText={setSenderEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              multiline
              returnKeyType="done"
            />

            <View style={styles.experienceBox}>
              <Text style={styles.experienceTitle}>🌿 Your Personal Experience at Kaziranga</Text>
              <Text style={styles.experienceHint}>
                Have you visited Kaziranga? Share a memory, a sighting, or what this
                place means to you. If you have a connection with the indigenous
                communities or their lands, please mention that too. This personal
                touch makes your message more powerful. (Optional)
              </Text>
              <TextInput
                style={styles.experienceInput}
                value={personalExperience}
                onChangeText={setPersonalExperience}
                placeholder="e.g. I visited Kaziranga in 2019 and watched a rhino wade through a beel at dawn. That memory stays with me. Kaziranga is irreplaceable..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.bodyHeader}>
              <Text style={styles.label}>Email Body</Text>
              <View style={styles.bodyActions}>
                <TouchableOpacity onPress={() => setShowPreview(!showPreview)} style={styles.previewBtn}>
                  <Text style={styles.previewBtnText}>{showPreview ? 'Edit' : 'Preview'}</Text>
                </TouchableOpacity>
                {bodyEdited && (
                  <TouchableOpacity onPress={handleResetBody} style={styles.resetBtn}>
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showPreview ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>{getBody()}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.bodyInput}
                value={bodyEdited ? body : getBody()}
                onChangeText={handleBodyChange}
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
              />
            )}

            {!bodyEdited && (
              <Text style={styles.editHint}>
                ✏️ Please personalize the email before sending. A short personal
                note can help it feel more genuine and less likely to be treated
                as bulk mail.
              </Text>
            )}

            <Text style={styles.sendTip}>
              Tip: even one small personal edit helps the message feel authentic.
            </Text>

            <ActionButton
              label={isSendLockedForUser ? 'Email Already Sent' : 'Send Email'}
              onPress={handleSend}
              loading={sending}
              disabled={
                sending ||
                deletingData ||
                checkingSendEligibility ||
                !isCurrentStatusLoaded ||
                isSendLockedForUser
              }
              variant="primary"
              icon="📨"
            />

            <View style={styles.dataControls}>
              <TouchableOpacity
                onPress={handleDeleteMyData}
                disabled={deletingData}
                style={[styles.resetSendBtn, deletingData && styles.resetSendBtnDisabled]}
              >
                <Text style={styles.resetSendBtnText}>
                  {deletingData ? 'Deleting...' : '🗑 Delete My Data'}
                </Text>
              </TouchableOpacity>
            </View>

            {statusPanel && isCurrentStatusLoaded && (
              <View style={styles.senderBlockCard}>
                <Text style={styles.senderBlockTitle}>Sent by you today</Text>
                <Text style={styles.senderBlockText}>
                  Sender: {statusPanel.senderName || 'Unknown'}
                </Text>
                <Text style={styles.senderBlockText}>
                  Email: {statusPanel.senderEmail || 'Unknown'}
                </Text>
                <Text style={styles.senderBlockText}>
                  Recipient: {statusPanel.recipient}
                </Text>
                <Text style={styles.senderBlockText}>
                  Day: {statusPanel.dayKey}
                </Text>
                <Text style={styles.senderBlockText}>
                  Sent at:{' '}
                  {statusPanel.sentAt ? statusPanel.sentAt.toLocaleString() : 'Now'}
                </Text>
              </View>
            )}

            {sendState !== 'idle' && (
              <View
                style={[
                  styles.statusBox,
                  sendState === 'sending'
                    ? styles.statusSending
                    : sendState === 'sent'
                    ? styles.statusSent
                    : styles.statusFailed,
                ]}
              >
                <Text style={styles.statusText}>{sendStateText}</Text>
              </View>
            )}

            <Text style={styles.disclaimer}>
              Signed-in users send through Gmail API with delivery confirmation and
              each successful send is counted in the live tracker.
            </Text>

            <View style={styles.signOutWrap}>
              <ActionButton
                label="Sign out"
                onPress={onSignOut}
                variant="outline"
                icon="🚪"
              />
            </View>
          </View>

          <View style={[styles.sideColumn, !isWide && styles.sideColumnNarrow]}>
            <ImpactCounter />

            <PetitionBlock />

            {isWide && (
              <>
                <View style={[styles.storyCard, styles.storyBlue]}>
                  <Text style={styles.sideTitle}>Compose guide</Text>
                  <Text style={styles.sideText}>
                    Keep the message direct, personal, and rooted in Kaziranga's wildlife and indigenous land rights.
                  </Text>
                </View>

                <View style={[styles.storyCard, styles.storyOrange]}>
                  <Text style={styles.sideTitle}>Personal touch</Text>
                  <Text style={styles.sideText}>
                    Add one memory or observation from Kaziranga to make the email feel authentic.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: 40,
  },
  pageHeader: {
    backgroundColor: '#174B22',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pageHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  pageHeaderSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  pageShell: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  magazineLayout: {
    marginTop: 14,
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
    maxWidth: 820,
    gap: 10,
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
    flex: 1,
    maxWidth: 400,
    gap: 14,
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
    minHeight: 120,
  },
  storyBlue: {
    backgroundColor: '#EDF4FF',
    borderLeftColor: '#2B7FFF',
  },
  storyOrange: {
    backgroundColor: '#FFF4E7',
    borderLeftColor: COLORS.accent,
  },
  storyNeutral: {
    backgroundColor: '#F7F7F7',
    borderLeftColor: '#9CA3AF',
  },
  sideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  sideText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  recipientBadge: {
    backgroundColor: '#E8F5E9',
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  recipientHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    lineHeight: 17,
  },
  senderNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C8DFC8',
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  experienceBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 6,
  },
  experienceHint: {
    fontSize: 12,
    color: '#6D4C41',
    marginBottom: 10,
    lineHeight: 18,
  },
  experienceInput: {
    backgroundColor: '#FFFDF3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  bodyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bodyActions: { flexDirection: 'row', gap: 8 },
  previewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  previewBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  resetBtn: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  resetBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bodyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C8DFC8',
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    minHeight: 240,
    marginBottom: 10,
  },
  previewBox: {
    backgroundColor: '#F8FBF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C8DFC8',
    padding: 14,
    minHeight: 240,
    marginBottom: 10,
  },
  previewText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  editHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  sendTip: {
    fontSize: 12,
    color: '#355E3B',
    marginTop: -6,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  senderBlockCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E5D6',
    backgroundColor: '#F6FBF5',
    padding: 12,
  },
  senderBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  senderBlockText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  dataControls: {
    marginTop: 6,
    marginBottom: 2,
    alignItems: 'center',
  },
  resetSendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  resetSendBtnDisabled: {
    opacity: 0.5,
  },
  resetSendBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C62828',
    textDecorationLine: 'underline',
  },
  statusBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  statusSending: {
    backgroundColor: '#EDF4FF',
    borderColor: '#64B5F6',
  },
  statusSent: {
    backgroundColor: '#F1F8EF',
    borderColor: '#81C784',
  },
  statusFailed: {
    backgroundColor: '#FFF1F1',
    borderColor: '#E57373',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'left',
    marginTop: 8,
    lineHeight: 17,
  },
  signOutWrap: {
    marginTop: 16,
  },
});

