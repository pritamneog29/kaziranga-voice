import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../config/theme';

interface Props {
  onPress: () => void;
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  icon?: string;
}

export default function ActionButton({
  onPress,
  label,
  loading = false,
  variant = 'primary',
  disabled = false,
  icon,
}: Props) {
  const bg =
    variant === 'primary'
      ? COLORS.primary
      : variant === 'secondary'
      ? COLORS.accent
      : 'transparent';

  const textColor =
    variant === 'outline' ? COLORS.primary : '#FFFFFF';

  const borderStyle =
    variant === 'outline'
      ? { borderWidth: 2, borderColor: COLORS.primary }
      : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bg },
        borderStyle,
        (disabled || loading) && styles.disabled,
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 18 },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
