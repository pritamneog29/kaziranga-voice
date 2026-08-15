// Firestore helpers for tracking mail/letter counts.
// Collection: "stats" / Document: "mail_counter"
// Fields: total (number), online_count (number), offline_count (number), last_updated (Timestamp)

import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

const COUNTER_REF = doc(db, 'stats', 'mail_counter');

export interface MailStats {
  total: number;
  online_count: number;
  offline_count: number;
  last_updated: Date | null;
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

/** Increment the offline letter counter. */
export async function recordOfflineLetter(): Promise<void> {
  await ensureCounter();
  await updateDoc(COUNTER_REF, {
    total: increment(1),
    offline_count: increment(1),
    last_updated: serverTimestamp(),
  });
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
