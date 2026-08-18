import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { COLORS } from '../config/theme';
import ActionButton from './ActionButton';

const PETITION_URL = 'https://www.change.org/p/save-kaziranga-protect-wildlife-land-and-people';

export default function PetitionBlock() {
  const openPetition = async () => {
    await Linking.openURL(PETITION_URL);
  };

  return (
    <View style={styles.card}>
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>🔐 Big tech already knows plenty about us 😅</Text>
        <Text style={styles.noticeText}>
          Here, we only use Google sign-in to send your email and keep count for
          Kaziranga — we don’t save your data or use it for ads.
        </Text>
        <Text style={styles.noticeText}>
          We’re also working on ways to count emails without login in the future ✨
          Too shy to sign in? No problem — you can still sign the petition 📝
        </Text>
      </View>

      <Text style={styles.title}>📣 Support the petition</Text>
      <Text style={styles.text}>
        Add your name to the Change.org petition to protect Kaziranga's wildlife,
        land, and people.
      </Text>
      <ActionButton
        label="Sign the petition"
        onPress={openPetition}
        variant="secondary"
        icon="✍️"
        inline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  noticeCard: {
    backgroundColor: '#EDF4FF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2B7FFF',
    gap: 8,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  noticeText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  text: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 23,
  },
});
