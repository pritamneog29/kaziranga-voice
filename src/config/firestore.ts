// Firestore helpers for tracking mail counts and legacy offline letter records.
// Collections:
//   "stats" / "mail_counter" → legacy/base counter seed
//   "stats" / "mail_counter" / "shards" → high-scale distributed counter writes
//   "offline_letters" → individual letter submissions with photos

import { db, storage } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
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
const COUNTER_SHARDS_REF = collection(db, 'stats', 'mail_counter', 'shards');
const COUNTER_SHARD_COUNT = 32;
const USER_ONLINE_MAIL_STATUS_COLLECTION = 'user_online_mail_status';

export interface MailStats {
  total: number;
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

function getRandomShardId(): string {
  return String(Math.floor(Math.random() * COUNTER_SHARD_COUNT)).padStart(2, '0');
}

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeRecipientForLock(recipient: string): string {
  return recipient.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'unknown_recipient';
}

function getOnlineMailStatusDocId(userId: string, recipient: string, dayKey: string): string {
  return `${userId}__${dayKey}__${normalizeRecipientForLock(recipient)}`;
}

async function incrementCounterShard(
  counterType: 'online_count' | 'offline_count',
): Promise<void> {
  const shardRef = doc(COUNTER_SHARDS_REF, getRandomShardId());
  await setDoc(
    shardRef,
    {
      total: increment(1),
      [counterType]: increment(1),
      last_updated: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Increment the online email counter. */
export async function recordOnlineMail(): Promise<void> {
  await incrementCounterShard('online_count');
}

/** Mark that a user has already sent to a recipient on a specific day. */
export async function markUserOnlineMailSent(
  userId: string,
  recipient: string,
  dayKey = getLocalDayKey(),
): Promise<void> {
  const statusRef = doc(
    db,
    USER_ONLINE_MAIL_STATUS_COLLECTION,
    getOnlineMailStatusDocId(userId, recipient, dayKey),
  );
  await setDoc(
    statusRef,
    {
      sent: true,
      sentAt: serverTimestamp(),
      recipient: recipient.trim().toLowerCase(),
      dayKey,
    },
    { merge: true },
  );
}

/** Check whether a user has already sent to a recipient on a specific day. */
export async function hasUserSentOnlineMail(
  userId: string,
  recipient: string,
  dayKey = getLocalDayKey(),
): Promise<boolean> {
  try {
    const statusRef = doc(
      db,
      USER_ONLINE_MAIL_STATUS_COLLECTION,
      getOnlineMailStatusDocId(userId, recipient, dayKey),
    );
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
    await incrementCounterShard('offline_count');
  } catch (error) {
    console.error('Error recording offline letter:', error);
    throw error;
  }
}

function readDocStats(data: Record<string, any> | undefined): MailStats {
  return {
    total: Number(data?.total ?? 0),
    last_updated: data?.last_updated?.toDate?.() ?? null,
  };
}

function latestDate(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/** Subscribe to live counter updates; returns an unsubscribe function. */
export function subscribeToStats(
  callback: (stats: MailStats) => void,
): Unsubscribe {
  let legacyStats: MailStats = { total: 0, last_updated: null };
  let shardStats: MailStats = { total: 0, last_updated: null };

  const emitCombined = () => {
    callback({
      total: legacyStats.total + shardStats.total,
      last_updated: latestDate(legacyStats.last_updated, shardStats.last_updated),
    });
  };

  const unsubscribeLegacy = onSnapshot(COUNTER_REF, (snap) => {
    legacyStats = snap.exists()
      ? readDocStats(snap.data() as Record<string, any>)
      : { total: 0, last_updated: null };
    emitCombined();
  });

  const unsubscribeShards = onSnapshot(COUNTER_SHARDS_REF, (snap) => {
    let total = 0;
    let mostRecent: Date | null = null;

    snap.forEach((shardDoc) => {
      const shardData = shardDoc.data();
      total += Number(shardData.total ?? 0);
      const shardDate = shardData.last_updated?.toDate?.() ?? null;
      mostRecent = latestDate(mostRecent, shardDate);
    });

    shardStats = { total, last_updated: mostRecent };
    emitCombined();
  });

  return () => {
    unsubscribeLegacy();
    unsubscribeShards();
  };
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
