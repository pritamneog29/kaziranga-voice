import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ImpactCounter from '../components/ImpactCounter';
import ActionButton from '../components/ActionButton';
import PetitionBlock from '../components/PetitionBlock';

interface Props {
  user: { uid: string; name: string; email: string; photoUrl?: string } | null;
  onNavigateEmail: () => void;
  onSignOut: () => void;
}

export default function HomeScreen({
  user,
  onNavigateEmail,
  onSignOut,
}: Props) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;
  const magazineMinHeight = Math.max(620, Math.round(height * 0.72));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pageShell}>
        <AppHeader size="large" />

        <Text style={styles.greeting}>
          Welcome, {user ? user.name.split(' ')[0] : 'User'} 👋
        </Text>
        <Text style={styles.subGreeting}>
          {user ? user.email : 'Sign in to continue.'}
        </Text>

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

            <View style={[styles.storyCard, styles.storyFuture]}>
              <Text style={styles.sideTitle}>Future Plan</Text>
              <Text style={styles.storyText}>
                More campaign tools may arrive later, including richer message
                personalization, progress milestones, and other ways to support
                Kaziranga.
              </Text>
            </View>
          </View>
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

        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>Why This Matters</Text>
          <Text style={styles.storyText}>
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
  pageShell: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
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
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  actionCardEmoji: { fontSize: 30, marginBottom: 6 },
  actionCardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  actionCardDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
});
