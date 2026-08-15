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
  user: { name: string; email: string } | null;
  onNavigateEmail: () => void;
  onNavigateOffline: () => void;
  onSignOut: () => void;
}

export default function HomeScreen({
  user,
  onNavigateEmail,
  onNavigateOffline,
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

      <ImpactCounter />

      <View style={styles.actionsHeading}>
        <Text style={styles.actionsTitle}>Take Action</Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionCardEmoji}>📧</Text>
        <Text style={styles.actionCardTitle}>Send an Email</Text>
        <Text style={styles.actionCardDesc}>
          Compose a pre-filled email to the Director of Kaziranga National Park.
          You can personalise it with your own experiences before sending.
        </Text>
        <ActionButton
          label="Compose Email"
          onPress={onNavigateEmail}
          variant="primary"
          icon="✉️"
        />
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionCardEmoji}>✍️</Text>
        <Text style={styles.actionCardTitle}>Record Offline Letter</Text>
        <Text style={styles.actionCardDesc}>
          Drafted a physical letter to post? Take a photo of it and we'll log
          your offline action in our records.
        </Text>
        <ActionButton
          label="Record Offline Letter"
          onPress={onNavigateOffline}
          variant="secondary"
          icon="📮"
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Why This Matters</Text>
        <Text style={styles.infoText}>
          The Eco-Sensitive Zone (ESZ) is the lifeline of Kaziranga's wildlife.
          During annual Brahmaputra floods, animals migrate south through the
          ESZ to the Karbi Anglong hills. Any reduction in this buffer zone
          blocks those corridors, leaving animals stranded. Luxury hotel
          construction on indigenous lands further erodes the fragile
          socio-ecological balance that protects this UNESCO World Heritage Site.
        </Text>
      </View>

      <ActionButton
        label={user ? 'Sign Out' : 'Back to Login'}
        onPress={onSignOut}
        variant="outline"
        icon="🚪"
      />
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
