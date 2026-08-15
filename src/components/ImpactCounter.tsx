import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { COLORS } from '../config/theme';
import { subscribeToStats, MailStats } from '../config/firestore';

export default function ImpactCounter() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [stats, setStats] = useState<MailStats>({
    total: 0,
    last_updated: null,
  });
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const pulse = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const unsub = subscribeToStats((s) => {
      setStats(s);
      // Pulse animation on update
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 250, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const startValue = displayedTotal;
    const endValue = stats.total;

    if (startValue === endValue) {
      return;
    }

    const durationMs = 1100;
    const startTime = Date.now();
    let frameId = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayedTotal(Math.round(startValue + (endValue - startValue) * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [stats]);

  return (
    <View style={[styles.container, !isWide && styles.containerNarrow]}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Campaign activity</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      <Animated.View style={[styles.statBlock, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.statLabel}>Emails sent</Text>
        <Text style={styles.totalNumber}>{displayedTotal}</Text>
        <Text style={styles.totalKicker}>Total emails sent</Text>
      </Animated.View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Each send helps keep attention on Kaziranga and the ESZ issue.
        </Text>
        <Text style={styles.metaText}>
          {stats.last_updated ? `Last sent ${stats.last_updated.toLocaleString()}` : 'No sends yet'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#174B22',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A6834',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginVertical: 16,
    minHeight: 360,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  containerNarrow: {
    minHeight: 280,
    marginVertical: 12,
    paddingVertical: 16,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  heading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F2FFF3',
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 183, 77, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 77, 0.34)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8F7C5',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD38A',
    letterSpacing: 0.8,
  },
  statBlock: {
    flex: 1,
    marginTop: 4,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#E8F5E9',
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  totalNumber: {
    fontSize: 88,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 88,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  totalKicker: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 0.3,
    marginTop: 4,
    textAlign: 'center',
  },
  metaRow: {
    marginTop: 10,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.86)',
  },
});
