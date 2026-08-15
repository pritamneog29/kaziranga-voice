# 🦏 Kaziranga Voice

**A citizen-action app to protect Kaziranga National Park.**

Kaziranga Voice makes it easy for anyone to raise their voice against the proposed reduction of Kaziranga's Eco-Sensitive Zone (ESZ) and the construction of luxury hotels on indigenous lands — threats that endanger the world's largest population of Indian one-horned rhinoceros and hundreds of other species.

---

## Features

| Feature | Description |
|---|---|
| 🔑 **Optional Google Sign-In** | OAuth login to auto-fill your name/email; guest mode is also supported |
| 📧 **Pre-drafted Email** | Fully researched, editable email to the Director of Kaziranga NP |
| 🌿 **Personal Experience Section** | Add your own Kaziranga memories to make the message powerful |
| 📮 **Offline Letter** | Draft a physical letter, photograph it, and record it in the counter |
| 📊 **Live Impact Counter** | Real-time Firestore counter of emails sent + letters posted |
| 📷 **In-App Camera** | Photograph your signed offline letter directly in the app |

---

## Screens

1. **Login Screen** — App purpose, key facts, optional Google Sign-In or continue as guest
2. **Home Screen** — Welcome, live counter, action cards
3. **Email Composer** — Editable email with personal experience section, preview/edit toggle
4. **Offline Letter** — Letter draft, camera/gallery photo, submit to record

---

## Setup

### 1. Clone & Install

```bash
git clone <repo>
cd kaziranga-voice
npm install
```

### 2. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `kaziranga-voice`)
3. Enable **Firestore Database** (start in test mode initially)
4. Enable **Authentication → Google** sign-in method
5. Go to **Project Settings → Your apps** → Add a Web app → copy the config

### 3. Configure Firebase

Open `src/config/firebase.ts` and replace the placeholder values:

```ts
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

### 4. Configure Google OAuth Client IDs

Open `src/screens/LoginScreen.tsx` and fill in your Google OAuth client IDs
(from [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com)):

```ts
const EXPO_CLIENT_ID = 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
```

For Expo Go development, you only need the **Web/Expo client ID**.

### 5. Run the App

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your Android or iOS device.

---

## Firestore Data Model

```
stats/
  mail_counter/
    total          (number)  — total actions (emails + letters)
    online_count   (number)  — emails sent via the app
    offline_count  (number)  — offline letters recorded
    last_updated   (timestamp)
```

Counter visibility is intended to be public. Use Firestore rules accordingly if you want unauthenticated users to read and write this counter.

---

## Director Contact

**Primary Email:** `dir.kaziranganp@gmail.com`

**Postal Address:**
The Director,
Kaziranga National Park & Tiger Reserve,
Bokakhat, Golaghat, Assam – 785612

---

## Why Kaziranga?

- 🦏 ~2,600 Indian one-horned rhinos — **70% of the world's entire population**
- 🐯 One of the highest tiger densities globally
- 🐘 1,000+ Asian elephants
- 🐦 480+ bird species — a UNESCO Important Bird Area
- 🌍 UNESCO World Heritage Site since 1985

The Eco-Sensitive Zone is not a bureaucratic formality — it is the migration corridor animals depend on to survive annual Brahmaputra floods. Shrinking it, or allowing commercial construction within it, fractures that lifeline.

---

## Tech Stack

- [Expo](https://expo.dev) (React Native)
- [Firebase Firestore](https://firebase.google.com/products/firestore) — real-time counter
- [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/) — Google OAuth
- [expo-mail-composer](https://docs.expo.dev/versions/latest/sdk/mail-composer/) — email sending
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) — letter photography
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) — gallery access

---

## License

MIT — build on this, share it, use it to protect what matters.
