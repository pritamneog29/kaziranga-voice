import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../config/theme';
import { subscribeToStats, MailStats } from '../config/firestore';

export default function ImpactCounter() {
  const [stats, setStats] = useState<MailStats>({
    total: 0,
    online_count: 0,
    offline_count: 0,
    last_updated: null,
  });
  const pulse = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsub = subscribeToStats((s) => {
      setStats(s);
      // Pulse animation on update
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
    return unsub;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📬 Collective Impact</Text>
      <Animated.View style={[styles.totalBox, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.totalNumber}>{stats.total}</Text>
        <Text style={styles.totalLabel}>Total Actions Taken</Text>
      </Animated.View>
      <View style={styles.row}>
        <View style={[styles.card, { borderColor: COLORS.primary }]}>
          <Text style={styles.cardEmoji}>📧</Text>
          <Text style={styles.cardNumber}>{stats.online_count}</Text>
          <Text style={styles.cardLabel}>Emails Sent</Text>
        </View>
        <View style={[styles.card, { borderColor: COLORS.accent }]}>
          <Text style={styles.cardEmoji}>✉️</Text>
          <Text style={styles.cardNumber}>{stats.offline_count}</Text>
          <Text style={styles.cardLabel}>Letters Posted</Text>
        </View>
      </View>
      {stats.last_updated && (
        <Text style={styles.lastUpdated}>
          Last action: {stats.last_updated.toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.counterBg,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  totalBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  totalNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  totalLabel: {
    fontSize: 13,
    color: '#C8E6C9',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cardEmoji: { fontSize: 24, marginBottom: 4 },
  cardNumber: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  cardLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  lastUpdated: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
