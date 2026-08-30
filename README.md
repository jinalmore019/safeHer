# 🛡️ SafeHer - Advanced Personal Safety Application

*Safety shouldn't be a privilege. It should be one tap away. Building tech that stands between a woman and danger, one line of code at a time. 💪*

**We'd love for you to experience it yourself:**
👇🎥 **Watch the demo video:** [Click Here to Watch](https://lnkd.in/dFj8T3Gy)
📲 **Download the app (APK):** [Click Here to Download](https://lnkd.in/dYypRcwh)
📝 **Try it & share your feedback:** [Give Feedback](https://lnkd.in/dDNDTViW)

---

**SafeHer** is a comprehensive, privacy-first personal safety application built for women. Designed to provide immediate assistance and evidence collection during critical situations, SafeHer combines automated triggers, offline functionality, and secure data handling to ensure safety at all times.

---

## 🌟 Key Features

### 🚨 Core SOS & Emergency Response
*   **Intelligent SOS Engine**: State machine manages IDLE -> TRIGGERED (5s countdown) -> CONFIRMED -> ACTIVE.
*   **5-Second Cancellation Window**: Prevents accidental triggers.
*   **Duress PIN**: Gracefully handles silent disarming if forced by an attacker (secured with `expo-crypto`).
*   **Emergency SMS**: Seamlessly triggers background locations via custom native wrapper to alert emergency contacts.

### ⚡ Automated & Covert Triggers
*   **Shake SOS**: Accelerometer detects 3 sudden, strong movements (triple shake) to instantly trigger the SOS countdown.
*   **Distress Audio Detection**: Background microphone monitoring detects sustained volume spikes (like screams) to trigger an alert.
*   **Safe-word Integration**: Configure a hidden, custom phrase to silently initiate the SOS sequence.
*   **Fake/Escort Call**: Simulates a realistic incoming call screen (e.g., from "Dad" or "Brother") with a configurable delay to deter potential threats.

### 📍 Advanced Tracking & Routing
*   **Safe Route & Journey Sentinel**: Start a journey and monitor it in real-time.
*   **Deviation Alerts**: Background tracking checks for >500m route deviations or unexpected stops (e.g., >5 minutes).
*   **Automated Check-ins**: Prompts the user every 10 minutes during a journey; failure to respond escalates to a full SOS.

### 📸 Evidence & Legal Support
*   **Evidence Capturer**: Silently records photos and audio in the background upon SOS confirmation.
*   **Secure Evidence Vault**: Locked behind standard PIN/Biometrics to review all media securely.
*   **Automated Reports & FIR Drafts**: Generates deterministic, structured PDF Incident Reports and FIR Drafts using local data to aid legal processes.

### 📶 Offline First & Reliability
*   **Local Database**: Uses SQLite to store incidents, locations, and queue offline sync events.
*   **Offline Sync Queue**: A pending sync badge ensures data isn't lost if the network drops.
*   **Network Handling**: Seamless transitions between online and offline states.

---

## 🛠️ Technology Stack

*   **Frontend**: React Native, Expo
*   **Local Storage**: SQLite, Expo Secure Store
*   **Native Modules**: Android Native SMS integration, Accelerometer, Audio/Camera Modules
*   **Security**: `expo-crypto` for secure PIN hashing

---

## 🚀 Getting Started (For Evaluation / Local Setup)

Follow these steps to run the app locally:

### 1. Prerequisites
*   Node.js (v18+)
*   Expo CLI (`npm install -g expo-cli`)
*   Android Studio (for emulator) or Expo Go app on your physical device.

### 2. Installation

Clone the repository and install dependencies:

    git clone https://github.com/jinalmore019/safeHer.git
    cd safeHer
    npm install

### 3. Running the App

Start the Expo development server:

    npx expo start

*   Press `a` to open in the Android emulator.
*   Scan the QR code with the **Expo Go** app on your physical Android/iOS device.

### 4. Production Build (Android)
To build the final signed APK using Expo Application Services (EAS):

    eas build -p android --profile production

---

## 📋 Hackathon Submission Details

*   **Hackathon**: DoraHacks 2.0
*   **Product Name**: SafeHer
*   **Category**: Consumer / Health / Safety
*   **Status**: Final Integration Complete. All planned features tested and operational.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.






