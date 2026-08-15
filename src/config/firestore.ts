// Firestore helpers for tracking mail/letter counts and storing offline letters.
// Collections:
//   "stats" / "mail_counter" → counter tracking
//   "offline_letters" → individual letter submissions with photos

import { db, storage } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const COUNTER_REF = doc(db, 'stats', 'mail_counter');
const USER_ONLINE_MAIL_STATUS_COLLECTION = 'user_online_mail_status';

export interface MailStats {
  total: number;
  online_count: number;
  offline_count: number;
  last_updated: Date | null;
}

export interface OfflineLetterRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  letterText: string;
  photoUrl: string;
  timestamp: Date;
  status: 'submitted'; // can extend to 'draft' or 'sent' later
}

/** Ensure the counter document exists with zeroed fields. */
async function ensureCounter(): Promise<void> {
  const snap = await getDoc(COUNTER_REF);
  if (!snap.exists()) {
    await setDoc(COUNTER_REF, {
      total: 0,
      online_count: 0,
      offline_count: 0,
      last_updated: serverTimestamp(),
    });
  }
}

/** Increment the online email counter. */
export async function recordOnlineMail(): Promise<void> {
  await ensureCounter();
  await updateDoc(COUNTER_REF, {
    total: increment(1),
    online_count: increment(1),
    last_updated: serverTimestamp(),
  });
}

/** Mark that a user has already sent an online mail. */
export async function markUserOnlineMailSent(userId: string): Promise<void> {
  const statusRef = doc(db, USER_ONLINE_MAIL_STATUS_COLLECTION, userId);
  await setDoc(
    statusRef,
    {
      sent: true,
      sentAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Check whether a user has already sent an online mail. */
export async function hasUserSentOnlineMail(userId: string): Promise<boolean> {
  try {
    const statusRef = doc(db, USER_ONLINE_MAIL_STATUS_COLLECTION, userId);
    const snap = await getDoc(statusRef);
    if (!snap.exists()) {
      return false;
    }
    return Boolean(snap.data().sent);
  } catch (error: any) {
    // If rules are not yet updated for this collection, keep send unlocked.
    if (error?.code === 'permission-denied') {
      return false;
    }
    throw error;
  }
}

/** Increment the offline letter counter and store letter + photo. */
export async function recordOfflineLetter(
  photoUri: string,
  letterText: string,
  user: { name: string; email: string; uid: string },
): Promise<void> {
  try {
    // 1. Upload photo to Firebase Storage
    const photoRef = ref(
      storage,
      `offline_letters/${user.uid}/${Date.now()}.jpg`,
    );
    const response = await fetch(photoUri);
    const blob = await response.blob();
    await uploadBytes(photoRef, blob);
    const photoUrl = await getDownloadURL(photoRef);

    // 2. Store metadata in Firestore
    await addDoc(collection(db, 'offline_letters'), {
      userId: user.uid,
      userEmail: user.email,
      userName: user.name,
      letterText,
      photoUrl,
      timestamp: serverTimestamp(),
      status: 'submitted',
    });

    // 3. Increment counter
    await ensureCounter();
    await updateDoc(
      doc(db, 'stats', 'mail_counter'),
      {
        total: increment(1),
        offline_count: increment(1),
        last_updated: serverTimestamp(),
      },
    );
  } catch (error) {
    console.error('Error recording offline letter:', error);
    throw error;
  }
}

/** Subscribe to live counter updates; returns an unsubscribe function. */
export function subscribeToStats(
  callback: (stats: MailStats) => void,
): Unsubscribe {
  return onSnapshot(COUNTER_REF, (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      callback({
        total: d.total ?? 0,
        online_count: d.online_count ?? 0,
        offline_count: d.offline_count ?? 0,
        last_updated: d.last_updated?.toDate?.() ?? null,
      });
    } else {
      callback({ total: 0, online_count: 0, offline_count: 0, last_updated: null });
    }
  });
}

/** Fetch all offline letters for a specific user. */
export async function getUserOfflineLetters(
  userId: string,
): Promise<OfflineLetterRecord[]> {
  try {
    const q = query(
      collection(db, 'offline_letters'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      userEmail: doc.data().userEmail,
      userName: doc.data().userName,
      letterText: doc.data().letterText,
      photoUrl: doc.data().photoUrl,
      timestamp: doc.data().timestamp?.toDate?.() ?? new Date(),
      status: doc.data().status ?? 'submitted',
    }));
  } catch (error) {
    console.error('Error fetching offline letters:', error);
    return [];
  }
}

/** Subscribe to user's offline letters in real-time. */
export function subscribeToUserLetters(
  userId: string,
  callback: (letters: OfflineLetterRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'offline_letters'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const letters = snap.docs.map((doc) => ({
      id: doc.id,
      userId: doc.data().userId,
      userEmail: doc.data().userEmail,
      userName: doc.data().userName,
      letterText: doc.data().letterText,
      photoUrl: doc.data().photoUrl,
      timestamp: doc.data().timestamp?.toDate?.() ?? new Date(),
      status: doc.data().status ?? 'submitted',
    }));
    callback(letters);
  });
}
