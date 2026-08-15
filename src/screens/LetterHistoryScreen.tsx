import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { COLORS } from '../config/theme';
import ActionButton from '../components/ActionButton';
import { subscribeToUserLetters, OfflineLetterRecord } from '../config/firestore';

interface Props {
  user: { uid: string; name: string; email: string; photoUrl?: string } | null;
  onBack: () => void;
}

export default function LetterHistoryScreen({ user, onBack }: Props) {
  const [letters, setLetters] = useState<OfflineLetterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<OfflineLetterRecord | null>(null);

  useEffect(() => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to view your letter history.');
      onBack();
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserLetters(user.uid, (data) => {
      setLetters(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ActionButton
            label="← Back"
            onPress={onBack}
            variant="outline"
            icon=""
          />
          <Text style={styles.headerTitle}>Letter History</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading your letters...</Text>
        </View>
      </View>
    );
  }

  if (letters.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ActionButton
            label="← Back"
            onPress={onBack}
            variant="outline"
            icon=""
          />
          <Text style={styles.headerTitle}>Letter History</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>✉️</Text>
          <Text style={styles.emptyTitle}>No Letters Yet</Text>
          <Text style={styles.emptySubtitle}>
            Submit an offline letter to see it here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ActionButton
          label="← Back"
          onPress={onBack}
          variant="outline"
          icon=""
        />
        <Text style={styles.headerTitle}>Letter History</Text>
      </View>
      <ScrollView style={styles.content}>
        {letters.map((letter) => (
          <TouchableOpacity
            key={letter.id}
            style={styles.letterCard}
            onPress={() => setSelectedLetter(letter)}
          >
            <Image
              source={{ uri: letter.photoUrl }}
              style={styles.photoThumbnail}
            />
            <View style={styles.letterInfo}>
              <View>
                <Text style={styles.date}>
                  {formatDate(letter.timestamp)}
                </Text>
                <Text
                  style={styles.letterPreview}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {letter.letterText}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>✅ {letter.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedLetter !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedLetter(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedLetter(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {selectedLetter && (
              <ScrollView style={styles.modalScroll}>
                <Image
                  source={{ uri: selectedLetter.photoUrl }}
                  style={styles.photoFull}
                  resizeMode="contain"
                />
                <View style={styles.letterDetails}>
                  <Text style={styles.detailDate}>
                    {formatDate(selectedLetter.timestamp)}
                  </Text>
                  <Text style={styles.letterTextLabel}>Letter Text</Text>
                  <Text style={styles.letterTextFull}>
                    {selectedLetter.letterText}
                  </Text>

                  <View style={styles.divider} />

                  <Text style={styles.userLabel}>Submitted By</Text>
                  <Text style={styles.userName}>{selectedLetter.userName}</Text>
                  <Text style={styles.userEmail}>
                    {selectedLetter.userEmail}
                  </Text>

                  <View style={styles.statusContainer}>
                    <Text style={styles.statusTextFull}>
                      ✅ Letter Submitted Successfully
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  letterCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  photoThumbnail: {
    width: 100,
    height: 130,
    backgroundColor: '#e5e7eb',
  },
  letterInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  letterPreview: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.85,
    overflow: 'hidden',
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: '300',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  photoFull: {
    width: '100%',
    height: 400,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
  },
  letterDetails: {
    paddingHorizontal: 4,
  },
  detailDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  letterTextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  letterTextFull: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  userLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTextFull: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
});
