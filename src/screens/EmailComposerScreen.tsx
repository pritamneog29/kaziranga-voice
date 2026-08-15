import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ActionButton from '../components/ActionButton';
import { DIRECTOR_EMAIL, DEFAULT_SUBJECT, buildDefaultBody } from '../config/emailTemplate';
import {
  hasUserSentOnlineMail,
  markUserOnlineMailSent,
  recordOnlineMail,
} from '../config/firestore';

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
}

type SendState = 'idle' | 'sending' | 'sent' | 'failed';
const SEND_LOCK_BYPASS_EMAIL = 'pritamneog29@gmail.com';

export default function EmailComposerScreen({ user, onBack, onHome }: Props) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [senderName, setSenderName] = useState(user?.name ?? '');
  const [senderEmail, setSenderEmail] = useState(user?.email ?? '');
  const [primaryRecipient, setPrimaryRecipient] = useState(DIRECTOR_EMAIL);
  const [otherRecipients, setOtherRecipients] = useState('');
  const [personalExperience, setPersonalExperience] = useState('');
  const [body, setBody] = useState('');
  const [bodyEdited, setBodyEdited] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendStateText, setSendStateText] = useState('');
  const [checkingSendEligibility, setCheckingSendEligibility] = useState(false);
  const [hasAlreadySent, setHasAlreadySent] = useState(false);
  const isSendLockBypassUser =
    user?.email?.trim().toLowerCase() === SEND_LOCK_BYPASS_EMAIL;
  const isSendLockedForUser = Boolean(user) && hasAlreadySent && !isSendLockBypassUser;

  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with Google to send an email. Guest mode is view-only.',
        [{ text: 'OK', onPress: onBack }],
      );
    }
  }, [onBack, user]);

  useEffect(() => {
    let active = true;

    const loadSendStatus = async () => {
      if (!user?.uid) {
        setHasAlreadySent(false);
        setSendState('idle');
        setSendStateText('');
        return;
      }

      setCheckingSendEligibility(true);
      try {
        const sent = await hasUserSentOnlineMail(user.uid);
        if (!active) {
          return;
        }

        setHasAlreadySent(sent);
        if (sent && !isSendLockBypassUser) {
          setSendState('sent');
          setSendStateText('You already sent your email from this account.');
        } else {
          setSendState('idle');
          setSendStateText('');
        }
      } catch (e: any) {
        if (active) {
          setSendState('failed');
          setSendStateText(
            `Failed to verify send status: ${e?.message ?? 'Unknown error'}`,
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
  }, [isSendLockBypassUser, user?.uid]);

  if (!user) {
    return null;
  }

  const getBody = () =>
    bodyEdited
      ? body
      : buildDefaultBody(personalExperience, senderName, senderEmail);

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

  const openMailDraft = async (mailtoLink: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = mailtoLink;
      return;
    }

    const canOpen = await Linking.canOpenURL(mailtoLink);
    if (!canOpen) {
      throw new Error('No compatible mail app was found to open this draft.');
    }
    await Linking.openURL(mailtoLink);
  };

  const handleSend = async () => {
    if (isSendLockedForUser) {
      Alert.alert(
        'Already Sent',
        'This account has already sent the email. Sending is disabled for this user.',
      );
      return;
    }

    if (!senderEmail.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address before sending the message.',
      );
      return;
    }

    setSending(true);
    setSendState('sending');
    setSendStateText('Sending...');
    try {
      const recipients = [primaryRecipient, ...parseRecipients(otherRecipients)];
      const uniqueRecipients = Array.from(new Set(recipients));
      const bodyText = getBody();

      if (user?.googleAccessToken) {
        await sendViaGmailApi(
          user.googleAccessToken,
          uniqueRecipients,
          subject,
          bodyText,
        );
        await recordOnlineMail();
        if (!isSendLockBypassUser) {
          try {
            await markUserOnlineMailSent(user.uid);
          } catch (e: any) {
            if (e?.code !== 'permission-denied') {
              throw e;
            }
          }
          setHasAlreadySent(true);
        }
        setSendState('sent');
        setSendStateText('Sent successfully via Gmail API and counted.');
        Alert.alert(
          '✅ Email Sent!',
          'Your email was sent via your Google account and recorded.',
          [{ text: 'Go Back', onPress: onBack }],
        );
        return;
      }

      if (Platform.OS === 'web') {
        const mailtoLink = `mailto:${uniqueRecipients.join(';')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        await openMailDraft(mailtoLink);
        setSendState('sent');
        setSendStateText('Draft opened in your mail app.');
        Alert.alert(
          'Draft Opened',
          'Your mail app opened with a draft. Since you are not signed in with Google send permission, this web flow cannot verify sent status automatically.',
        );
      } else {
        const available = await MailComposer.isAvailableAsync();
        if (!available) {
          Alert.alert(
            'No Email App Found',
            'Please install a mail app (Gmail, Outlook) and try again, or use the offline letter option.',
          );
          return;
        }

        const result = await MailComposer.composeAsync({
          recipients: uniqueRecipients,
          subject,
          body: bodyText,
        });

        if (result.status === MailComposer.MailComposerStatus.SENT) {
          await recordOnlineMail();
          if (user?.uid && !isSendLockBypassUser) {
            try {
              await markUserOnlineMailSent(user.uid);
            } catch (e: any) {
              if (e?.code !== 'permission-denied') {
                throw e;
              }
            }
            setHasAlreadySent(true);
          }
          setSendState('sent');
          setSendStateText('Sent successfully and counted.');
          Alert.alert(
            '✅ Email Sent!',
            'Thank you for speaking up for Kaziranga. Your message has been sent and recorded.',
            [{ text: 'Go Back', onPress: onBack }],
          );
        } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
          setSendState('idle');
          setSendStateText('Send cancelled.');
        } else {
          setSendState('failed');
          setSendStateText('Send status could not be confirmed.');
          Alert.alert('Unknown Status', 'The email status could not be confirmed.');
        }
      }
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
  };

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
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <AppHeader size="small" onPressHome={onHome} />

      <Text style={styles.screenTitle}>📧 Compose Email</Text>
      
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
        {user
          ? 'Using your signed-in identity. You can still edit it below.'
          : 'You are using guest mode. Please enter your name and email.'}
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

      {/* Subject */}
      <Text style={styles.label}>Subject</Text>
      <TextInput
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
        multiline
        returnKeyType="done"
      />

      {/* Personal Experience */}
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

      {/* Email Body Preview/Edit */}
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
          ✏️ Tap the body above to personalise it. Your personal experience
          section above is automatically included, and the letter already
          includes stronger language on indigenous land rights.
        </Text>
      )}

      <ActionButton
        label={isSendLockedForUser ? 'Email Already Sent' : 'Send Email'}
        onPress={handleSend}
        loading={sending}
        disabled={checkingSendEligibility || isSendLockedForUser}
        variant="primary"
        icon="📨"
      />

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
        Signed-in users send through Gmail API with delivery confirmation.
        Unsigned web users open a mail draft and are not auto-counted.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 36,
    paddingBottom: 40,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 8,
    marginBottom: 4,
  },
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
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  experienceBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
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
    color: '#795548',
    marginBottom: 10,
    lineHeight: 18,
  },
  experienceInput: {
    backgroundColor: '#FFFDE7',
    borderRadius: 10,
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
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    minHeight: 240,
    marginBottom: 10,
  },
  previewBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  statusBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  statusSending: {
    backgroundColor: '#E3F2FD',
    borderColor: '#64B5F6',
  },
  statusSent: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  statusFailed: {
    backgroundColor: '#FFEBEE',
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
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
  },
});
