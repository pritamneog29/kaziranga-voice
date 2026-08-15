import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ActionButton from '../components/ActionButton';
import { DIRECTOR_EMAIL, DEFAULT_SUBJECT, buildDefaultBody } from '../config/emailTemplate';
import { recordOnlineMail } from '../config/firestore';

interface Props {
  user: { uid: string; name: string; email: string; photoUrl?: string } | null;
  onBack: () => void;
}

export default function EmailComposerScreen({ user, onBack }: Props) {
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

  const getBody = () =>
    bodyEdited
      ? body
      : buildDefaultBody(personalExperience, senderName, senderEmail);

  const parseRecipients = (value: string): string[] =>
    value
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSend = async () => {
    if (!senderEmail.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your email address before sending the message.',
      );
      return;
    }

    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      Alert.alert(
        'No Email App Found',
        'Please install a mail app (Gmail, Outlook) and try again, or use the offline letter option.',
      );
      return;
    }

    setSending(true);
    try {
      const recipients = [primaryRecipient, ...parseRecipients(otherRecipients)];
      const uniqueRecipients = Array.from(new Set(recipients));

      const result = await MailComposer.composeAsync({
        recipients: uniqueRecipients,
        subject,
        body: getBody(),
      });

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        await recordOnlineMail();
        Alert.alert(
          '✅ Email Sent!',
          'Thank you for speaking up for Kaziranga. Your message has been sent and recorded.',
          [{ text: 'Go Back', onPress: onBack }],
        );
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        // User cancelled — no action needed
      } else {
        Alert.alert('Unknown Status', 'The email status could not be confirmed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not open mail composer.');
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

      <AppHeader size="small" />

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
        label="Send Email"
        onPress={handleSend}
        loading={sending}
        variant="primary"
        icon="📨"
      />

      <Text style={styles.disclaimer}>
        Tapping "Send Email" will open your device's mail app pre-filled with
        this message. Once you send from there, the action will be recorded in
        our counter.
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
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
  },
});
