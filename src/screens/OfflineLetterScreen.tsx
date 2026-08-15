import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../config/theme';
import AppHeader from '../components/AppHeader';
import ActionButton from '../components/ActionButton';
import { recordOfflineLetter } from '../config/firestore';
import { DIRECTOR_EMAIL } from '../config/emailTemplate';

interface Props {
  user: { uid: string; name: string; email: string; photoUrl?: string } | null;
  onBack: () => void;
  onHome: () => void;
}

export default function OfflineLetterScreen({ user, onBack, onHome }: Props) {
  const [letterText, setLetterText] = useState(
    DEFAULT_OFFLINE_LETTER(user?.name ?? 'Concerned Citizen'),
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to photograph your letter.');
        return;
      }
    }
    setCameraOpen(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.75 });
      setPhotoUri(photo?.uri ?? null);
      setCameraOpen(false);
    } catch {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert(
        'Photo Required',
        'Please take or upload a photo of your letter before submitting.',
      );
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to submit your offline letter.');
      return;
    }
    setSubmitting(true);
    try {
      await recordOfflineLetter(photoUri, letterText, user);
      Alert.alert(
        '✅ Letter Recorded!',
        'Your offline letter has been logged. Thank you for taking action for Kaziranga!',
        [{ text: 'Go Back', onPress: onBack }],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not record your letter.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraInstruction}>
              📄 Position your letter inside the frame
            </Text>
            <View style={styles.cameraButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCameraOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shutterBtn} onPress={takePicture}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <AppHeader size="small" onPressHome={onHome} />

      <Text style={styles.screenTitle}>✍️ Offline Letter</Text>
      <Text style={styles.screenSubtitle}>
        Draft a letter to post to the Director of Kaziranga National Park.
        Photograph your signed letter to record your action. You can also
        mention indigenous land-rights advocates like Pranab Doley if it fits
        your personal message.
      </Text>

      <View style={styles.addressBox}>
        <Text style={styles.addressLabel}>📮 Post to:</Text>
        <Text style={styles.addressLine}>The Director,</Text>
        <Text style={styles.addressLine}>Kaziranga National Park & Tiger Reserve,</Text>
        <Text style={styles.addressLine}>Bokakhat, Golaghat, Assam – 785 612</Text>
        <Text style={styles.addressLine}>Email: {DIRECTOR_EMAIL}</Text>
      </View>

      {/* Letter Draft */}
      <Text style={styles.label}>Your Letter Draft</Text>
      <TextInput
        style={styles.letterInput}
        value={letterText}
        onChangeText={setLetterText}
        multiline
        textAlignVertical="top"
        scrollEnabled={false}
      />

      {/* Photo Section */}
      <Text style={styles.label}>📷 Photo of Your Signed Letter</Text>
      <Text style={styles.photoHint}>
        Once you've written and signed your physical letter, take a photo here
        to record the action.
      </Text>

      {photoUri ? (
        <View style={styles.photoPreviewBox}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.retakeBtnText}>🔄 Retake / Change Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoButtonsRow}>
          <ActionButton
            label="📸 Take Photo"
            onPress={openCamera}
            variant="primary"
          />
          <ActionButton
            label="🖼️ Pick from Gallery"
            onPress={pickFromGallery}
            variant="outline"
          />
        </View>
      )}

      <ActionButton
        label="Submit & Record Letter"
        onPress={handleSubmit}
        loading={submitting}
        variant="secondary"
        icon="📮"
        disabled={!photoUri}
      />

      <Text style={styles.disclaimer}>
        Submitting records this action in our collective counter. Your photo
        stays on your device — it is not uploaded to any server.
      </Text>
    </ScrollView>
  );
}

const DEFAULT_OFFLINE_LETTER = (name: string) => `To,
The Director,
Kaziranga National Park & Tiger Reserve,
Bokakhat, Golaghat, Assam – 785612

Subject: Urgent Concern Regarding Reduction of Eco-Sensitive Zone & Hotel Construction

Respected Sir/Madam,

I am writing as a deeply concerned citizen to urge your office to take immediate action to protect Kaziranga National Park — a UNESCO World Heritage Site and home to the world's largest population of Indian one-horned rhinoceros.

I am gravely concerned about:

1. The proposed reduction of the Eco-Sensitive Zone (ESZ) surrounding the park, which serves as a critical buffer and migration corridor for wildlife, especially during Brahmaputra floods.

2. Reports of luxury hotel construction (including a proposed Hyatt property) on indigenous lands near the park, which threatens both the ecological integrity of the ESZ and the land rights of indigenous communities.

I respectfully request that your office:
- Formally oppose any reduction in the ESZ boundaries.
- Ensure transparent Environmental Impact Assessments for all construction proposals.
- Protect the land rights of indigenous communities under the Forest Rights Act, 2006.
- Strengthen wildlife corridors to the Karbi Anglong hills.

Kaziranga is irreplaceable. I urge you to protect it.

Thanking you,

${name}
[Address]
[Contact]`;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 36,
    paddingBottom: 40,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 8,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  addressBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  addressLabel: {
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  addressLine: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  letterInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 13,
    color: COLORS.textPrimary,
    minHeight: 340,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 20,
  },
  photoHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  photoButtonsRow: { gap: 0 },
  photoPreviewBox: {
    marginBottom: 16,
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  retakeBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFCCBC',
    borderRadius: 20,
  },
  retakeBtnText: { color: '#BF360C', fontWeight: '700', fontSize: 13 },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 17,
  },
  // Camera styles
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 36,
  },
  cameraInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cancelBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
});
