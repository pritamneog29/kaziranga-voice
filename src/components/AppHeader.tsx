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
      <View>
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
  large: { marginBottom: 8 },
  small: { marginBottom: 0 },
  emoji: { },
  emojiLarge: { fontSize: 42 },
  emojiSmall: { fontSize: 26 },
  title: {
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleLarge: { fontSize: 28 },
  titleSmall: { fontSize: 20 },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
