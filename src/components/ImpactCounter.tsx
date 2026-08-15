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
  const [displayedStats, setDisplayedStats] = useState({
    total: 0,
    online_count: 0,
    offline_count: 0,
  });
  const pulse = React.useRef(new Animated.Value(1)).current;
  const cardScaleOnline = React.useRef(new Animated.Value(1)).current;
  const cardScaleOffline = React.useRef(new Animated.Value(1)).current;
  const previousStatsRef = React.useRef({
    total: 0,
    online_count: 0,
    offline_count: 0,
  });

  useEffect(() => {
    const unsub = subscribeToStats((s) => {
      setStats(s);

      const previousStats = previousStatsRef.current;
      // Pulse animation on update
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 250, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      // Card bounce on online count change
      if (s.online_count > previousStats.online_count) {
        Animated.sequence([
          Animated.timing(cardScaleOnline, { toValue: 1.12, duration: 150, useNativeDriver: true }),
          Animated.timing(cardScaleOnline, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }

      // Card bounce on offline count change
      if (s.offline_count > previousStats.offline_count) {
        Animated.sequence([
          Animated.timing(cardScaleOffline, { toValue: 1.12, duration: 150, useNativeDriver: true }),
          Animated.timing(cardScaleOffline, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }

      previousStatsRef.current = {
        total: s.total,
        online_count: s.online_count,
        offline_count: s.offline_count,
      };
    });
    return unsub;
  }, []);

  useEffect(() => {
    const startValues = displayedStats;
    const endValues = {
      total: stats.total,
      online_count: stats.online_count,
      offline_count: stats.offline_count,
    };

    if (
      startValues.total === endValues.total &&
      startValues.online_count === endValues.online_count &&
      startValues.offline_count === endValues.offline_count
    ) {
      return;
    }

    const durationMs = 1100;
    const startTime = Date.now();
    let frameId = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayedStats({
        total: Math.round(startValues.total + (endValues.total - startValues.total) * easedProgress),
        online_count: Math.round(
          startValues.online_count +
            (endValues.online_count - startValues.online_count) * easedProgress,
        ),
        offline_count: Math.round(
          startValues.offline_count +
            (endValues.offline_count - startValues.offline_count) * easedProgress,
        ),
      });

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [stats]);

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>📬 Campaign Activity</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>
      <Animated.View style={[styles.totalBox, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.totalNumber}>{displayedStats.total}</Text>
        <Text style={styles.totalLabel}>Actions Logged</Text>
      </Animated.View>
      <View style={styles.row}>
        <Animated.View style={[styles.card, styles.onlineCard, { transform: [{ scale: cardScaleOnline }] }]}>
          <View style={styles.iconBg}>
            <Text style={styles.cardEmoji}>📧</Text>
          </View>
          <Text style={styles.cardNumber}>{displayedStats.online_count}</Text>
          <Text style={styles.cardLabel}>Emails Sent</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.offlineCard, { transform: [{ scale: cardScaleOffline }] }]}>
          <View style={styles.iconBgOrange}>
            <Text style={styles.cardEmoji}>✉️</Text>
          </View>
          <Text style={styles.cardNumber}>{displayedStats.offline_count}</Text>
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
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.8,
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
