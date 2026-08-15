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
  const cardScaleOnline = React.useRef(new Animated.Value(1)).current;
  const cardScaleOffline = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsub = subscribeToStats((s) => {
      setStats(s);
      // Pulse animation on update
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 250, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      // Card bounce on online count change
      if (s.online_count > stats.online_count) {
        Animated.sequence([
          Animated.timing(cardScaleOnline, { toValue: 1.12, duration: 150, useNativeDriver: true }),
          Animated.timing(cardScaleOnline, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }

      // Card bounce on offline count change
      if (s.offline_count > stats.offline_count) {
        Animated.sequence([
          Animated.timing(cardScaleOffline, { toValue: 1.12, duration: 150, useNativeDriver: true }),
          Animated.timing(cardScaleOffline, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
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
        <Animated.View style={[styles.card, styles.onlineCard, { transform: [{ scale: cardScaleOnline }] }]}>
          <View style={styles.iconBg}>
            <Text style={styles.cardEmoji}>📧</Text>
          </View>
          <Text style={styles.cardNumber}>{stats.online_count}</Text>
          <Text style={styles.cardLabel}>Emails Sent</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.offlineCard, { transform: [{ scale: cardScaleOffline }] }]}>
          <View style={styles.iconBgOrange}>
            <Text style={styles.cardEmoji}>✉️</Text>
          </View>
          <Text style={styles.cardNumber}>{stats.offline_count}</Text>
          <Text style={styles.cardLabel}>Letters Posted</Text>
        </Animated.View>
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
    backgroundColor: 'linear-gradient(135deg, #F0F8F4 0%, #E8F5E9 100%)',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  totalBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  totalNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 78,
    letterSpacing: -2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#C8E6C9',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  row: { flexDirection: 'row', gap: 14, justifyContent: 'space-between' },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0,
  },
  onlineCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  offlineCard: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  iconBg: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBgOrange: {
    backgroundColor: '#FFE8D1',
    borderRadius: 16,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: { fontSize: 28 },
  cardNumber: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: COLORS.textPrimary,
    lineHeight: 40,
  },
  cardLabel: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  lastUpdated: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
