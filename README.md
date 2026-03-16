# Iris - Offline AI Assistant 🤖

Iris is a powerful, privacy-first React Native mobile application that runs Large Language Models (LLMs) completely offline on your device's hardware. It leverages `llama.cpp` (via `llama.rn`) to execute `.gguf` models directly on mobile processors without any cloud dependency.

## ✨ Key Features
* **100% Local Inference:** Chat with AI without an internet connection. No data ever leaves your device.
* **Hugging Face Integration:** Search, browse, and directly download `.gguf` models from Hugging Face repositories within the app.
* **Custom Model Import:** Import your own `.gguf` files directly from your phone's local storage.
* **Advanced File Management:** Real-time download progress tracking, cancelable downloads, and active RAM-loading toggles.
* **Voice-Enabled:** Integrated Native Speech-to-Text (Mic) and Text-to-Speech (TTS) for hands-free interactions.

---

## 🛑 MUST READ: The Golden Rule of Node Modules
Because this project relies heavily on native Android C++ code (`llama.rn`, `react-native-fs`), simply running `npm install` is **not enough** when adding or updating packages. 

Every time you install a new node module, you MUST clean the Android build cache before running the app again. **Run these exact commands in order:**

```bash
# 1. Install your new package
npm install <package-name>

# 2. Navigate to the android folder
cd android

# 3. Clean the gradle cache (Windows)
.\gradlew clean
# (Mac/Linux users: ./gradlew clean)

# 4. Go back to the root folder
cd ..

# 5. Rebuild the entire app
npx react-native run-android
🖥️ System & Android Studio Setup
To build this project, you must have proper knowledge of Android Studio and the React Native CLI setup. This is not an Expo project.

1. React Native CLI Setup:
You must follow the official React Native CLI Quickstart guide to configure your machine:
👉 React Native Environment Setup

2. Android Studio Requirements:

Install Android Studio and configure your ANDROID_HOME environment variables.

Open Android Studio -> SDK Manager -> SDK Tools and ensure these are installed:

Android SDK Build-Tools

NDK (Side by side) (Critical for compiling the C++ AI engine)

CMake (Critical for compiling llama.rn)

🚀 How to Build and Run
Step 1: Clone and Install
Bash
git clone <your-repository-url>
cd IrisRN
npm install
Step 2: Start Metro
You will need to run Metro, the JavaScript build tool for React Native.

Bash
npx react-native start --reset-cache
Step 3: Build the App
With Metro running, open a new terminal window/pane from the root of your project, and build the Android app:

Bash
npx react-native run-android
⚠️ Important Testing Notes
Hardware Requirements: Running .gguf models requires significant RAM. A 1B to 3B parameter model usually requires 4GB to 6GB of available RAM.

Emulators: If testing on an Android Emulator, you MUST configure the AVD (Android Virtual Device) to have at least 6144 MB (6GB) of RAM. Standard emulators will crash when attempting to load the model into memory. Testing on a physical Android device is highly recommended.

Permissions: The app requires Storage (for downloading/reading models) and Microphone permissions (for Voice-to-Text) to function correctly.


***