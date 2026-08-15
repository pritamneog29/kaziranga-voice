import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ImpactCounter from '../components/ImpactCounter';
import ActionButton from '../components/ActionButton';

interface Props {
  user: { uid: string; name: string; email: string; photoUrl?: string } | null;
  onNavigateEmail: () => void;
  onNavigateOffline: () => void;
  onNavigateLetterHistory: () => void;
  onSignOut: () => void;
}

export default function HomeScreen({
  user,
  onNavigateEmail,
  onNavigateOffline,
  onNavigateLetterHistory,
  onSignOut,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppHeader size="large" />

      <Text style={styles.greeting}>
        Welcome, {user ? user.name.split(' ')[0] : 'Guest'} 👋
      </Text>
      <Text style={styles.subGreeting}>
        {user ? user.email : 'You can still send/record actions without signing in.'}
      </Text>

      <View style={styles.calloutBox}>
        <Text style={styles.calloutTitle}>Protect Indigenous Lands</Text>
        <Text style={styles.calloutText}>
          Kaziranga’s surrounding indigenous lands are not just real estate —
          they are living homelands with rights, memory, and stewardship.
          Indigenous land-rights advocates such as Pranab Doley have helped
          show that the proposed hotel construction there must not override the
          voices of Mising, Karbi, and other local communities.
        </Text>
      </View>

      <ImpactCounter />

      <View style={styles.actionsHeading}>
        <Text style={styles.actionsTitle}>Take Action</Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionCardEmoji}>📧</Text>
        <Text style={styles.actionCardTitle}>Send an Email</Text>
        <Text style={styles.actionCardDesc}>
          Compose a pre-filled email to the Director of Kaziranga National Park.
          You can personalise it with your own experiences and highlight
          indigenous land rights before sending.
        </Text>
        <View style={styles.buttonRow}>
          <ActionButton
            label="Compose Email"
            onPress={onNavigateEmail}
            variant="primary"
            icon="✉️"
            inline
          />
        </View>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionCardEmoji}>✍️</Text>
        <Text style={styles.actionCardTitle}>Record Offline Letter</Text>
        <Text style={styles.actionCardDesc}>
          Drafted a physical letter to post? Take a photo of it and we'll log
          your offline action in our records, including support for indigenous
          land protection.
        </Text>
        <View style={styles.buttonRow}>
          <ActionButton
            label="Record Offline Letter"
            onPress={onNavigateOffline}
            variant="secondary"
            icon="📮"
            inline
          />
        </View>
      </View>

      {user && (
        <View style={styles.actionCard}>
          <Text style={styles.actionCardEmoji}>📋</Text>
          <Text style={styles.actionCardTitle}>View Letter History</Text>
          <Text style={styles.actionCardDesc}>
            See all the offline letters you've submitted, including photos and
            metadata, to track your contribution to protecting Kaziranga.
          </Text>
          <View style={styles.buttonRow}>
            <ActionButton
              label="View Submitted Letters"
              onPress={onNavigateLetterHistory}
              variant="secondary"
              icon="👁️"
              inline
            />
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Why This Matters</Text>
        <Text style={styles.infoText}>
          The Eco-Sensitive Zone (ESZ) is the lifeline of Kaziranga's wildlife.
          During annual Brahmaputra floods, animals migrate south through the
          ESZ to the Karbi Anglong hills. Any reduction in this buffer zone
          blocks those corridors, leaving animals stranded. Luxury hotel
          construction on indigenous lands threatens the rights, culture,
          livelihood, and stewardship of indigenous communities, and it further
          erodes the fragile socio-ecological balance that protects this UNESCO
          World Heritage Site.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <ActionButton
          label={user ? 'Sign Out' : 'Back to Login'}
          onPress={onSignOut}
          variant="outline"
          icon="🚪"
          inline
        />
      </View>
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
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  subGreeting: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  calloutBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    marginBottom: 14,
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
  actionsHeading: { marginTop: 8, marginBottom: 4 },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  actionCardEmoji: { fontSize: 30, marginBottom: 6 },
  actionCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 16,
    marginVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
});
