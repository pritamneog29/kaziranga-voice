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
