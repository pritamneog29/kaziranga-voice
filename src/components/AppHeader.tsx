import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/theme';

interface Props {
  size?: 'small' | 'large';
  onPressHome?: () => void;
}

export default function AppHeader({ size = 'large', onPressHome }: Props) {
  const isLarge = size === 'large';
  const content = (
    <View style={[styles.container, isLarge ? styles.large : styles.small]}>
      <Text style={[styles.emoji, isLarge ? styles.emojiLarge : styles.emojiSmall]}>
        🦏
      </Text>
      <View style={styles.titleWrap}>
        <Text style={[styles.title, isLarge ? styles.titleLarge : styles.titleSmall]}>
          Kaziranga Voice
        </Text>
        {isLarge && (
          <Text style={styles.subtitle}>Speak up for the Wild</Text>
        )}
      </View>
    </View>
  );

  if (onPressHome) {
    return (
      <TouchableOpacity onPress={onPressHome} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    content
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  large: {
    marginBottom: 8,
    width: '100%',
    justifyContent: 'center',
  },
  small: { marginBottom: 0 },
  emoji: { },
  emojiLarge: { fontSize: 42 },
  emojiSmall: { fontSize: 26 },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  titleLarge: { fontSize: 30 },
  titleSmall: { fontSize: 20 },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
