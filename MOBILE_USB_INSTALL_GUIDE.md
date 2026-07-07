# 📱 ERPOne Mobile USB Installation & Developer Guide

This guide will show you exactly how to package **ERPOne** into a fully native Android app (`.apk`) and install it directly onto your physical mobile phone using **Developer USB Debugging**. 

Since we have pre-configured **Capacitor** inside this workspace, the codebase is 100% mobile-ready!

---

## 🛠️ Step 1: Prepare Your Phone (Enable USB Debugging)
Before connecting to your laptop/PC, you must enable **Developer Options** on your mobile phone:

### For Android:
1. Open your phone's **Settings**.
2. Go to **About Phone** (or **Software Information**).
3. Tap **Build Number** **7 times** rapidly until you see a popup saying *"You are now a developer!"*.
4. Go back to the main Settings page, open the newly unlocked **Developer Options**.
5. Scroll down and **Turn on USB Debugging**.
6. **Turn on Install via USB** (on some devices like Xiaomi, Realme, Oppo, or OnePlus, this is an additional toggle).

### For iPhone (Requires a macOS laptop):
1. Go to **Settings** > **Privacy & Security** > scroll down to **Developer Mode** and turn it **On**.
2. Restart your device as prompted and enter your passcode.

---

## 💾 Step 2: Download the Code to Your Laptop
To run native mobile builds, you need to export this project to your local machine:
1. Click the **Settings (Gear Icon)** in the top-right corner of Google AI Studio.
2. Select **Export as ZIP** (or export to your **GitHub** repository).
3. Unzip the downloaded file on your laptop.

---

## 💻 Step 3: Install Local Prerequisites on Your Laptop
Open your laptop's terminal (or Command Prompt) inside your unzipped project folder and install the tools:

1. **Node.js**: Make sure you have Node.js installed ([Download here](https://nodejs.org/)).
2. **Install project dependencies**:
   ```bash
   npm install
   ```
3. **Install Android/iOS Tools**:
   * **For Android:** Install **Android Studio** ([Download here](https://developer.android.com/studio)).
   * **For iOS:** Install **Xcode** (macOS only, from the Mac App Store).

---

## 🔌 Step 4: Plug Your Phone and Install via USB

### Method A: One-Click Installation via Android Studio (easiest & recommended)
1. Plug your phone into your laptop using a **USB Cable**.
2. If prompted on your phone, select **"Allow USB Debugging"** and select **"File Transfer / MTP"** mode.
3. In your laptop terminal, run:
   ```bash
   # 1. Build the production web app assets
   npm run build
   
   # 2. Add the Android platform code
   npx cap add android
   
   # 3. Sync web code into the native Android platform
   npx cap sync
   
   # 4. Launch your project inside Android Studio
   npx cap open android
   ```
4. **Android Studio** will open. Wait 1-2 minutes for Gradle to index.
5. Look at the top toolbar in Android Studio. You will see your **physical mobile phone's name** selected in the device dropdown list!
6. Click the green **Run (Play button ▶)** next to your phone's name.
7. Android Studio will compile the app and automatically install it onto your phone via the USB cable.

---

### Method B: Install Directly via Terminal (Using ADB command line)
If you already have the Android SDK command line tools installed and want to sideload without opening Android Studio:

1. Build the release APK:
   ```bash
   npm run build
   npx cap add android
   npx cap sync
   cd android
   ./gradlew assembleDebug
   ```
2. Once compiled, your installable `.apk` file will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
3. Connect your phone via USB and run:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. The app will be instantly sideloaded onto your phone's app drawer!

---

## 🚀 Key Advantages of this Native USB Build
* **100% Native Container:** Runs as a fast, hardware-accelerated app on your device's WebView.
* **Offline-Ready:** Powered by our pre-installed Service Worker to load and run even without internet.
* **Splash Screens & Icons:** Fully customizable native launcher assets!
