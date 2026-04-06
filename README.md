# Iris - Offline AI Assistant

Iris is a privacy-first React Native mobile application that enables fully offline AI interactions. It runs Large Language Models (LLMs) directly on-device using `llama.cpp` via `llama.rn`, eliminating the need for cloud connectivity and ensuring complete data privacy.

## Overview

Iris allows users to download, manage, and run `.gguf` models locally on their mobile devices. With built-in voice capabilities and seamless model handling, it provides a complete offline AI experience.

## Features

### 100% Local Inference
- No internet required after setup
- All processing happens on-device
- Zero data leaves your device

### Hugging Face Integration
- Search and browse `.gguf` models
- Download models directly within the app

### Custom Model Import
- Import `.gguf` files from local storage
- Full flexibility over model selection

### Advanced File Management
- Real-time download progress
- Cancel downloads anytime
- RAM load/unload controls for models

### Voice Capabilities
- Native Speech-to-Text (STT)
- Text-to-Speech (TTS) responses
- Hands-free AI interaction

## Tech Stack

- React Native (CLI)
- `llama.cpp` via `llama.rn`
- Native Android (C++/NDK)
- Native iOS integration (CocoaPods/Xcode)
- Hugging Face integration

## Important: Native Build Rule (Android and iOS)

This project depends on native modules (`llama.rn`, `react-native-fs`, and related platform bindings). After installing or updating any package, you must clean and rebuild native artifacts.

### Required Steps After `npm install` or Package Updates

1. Install package(s):

```bash
npm install <package-name>
```

2. Rebuild Android:

```bash
cd android
# Windows
.\gradlew clean
# macOS/Linux
./gradlew clean
cd ..
npx react-native run-android
```

3. Rebuild iOS (macOS only):

```bash
cd ios
pod install
xcodebuild clean -workspace IrisRN.xcworkspace -scheme IrisRN -configuration Debug
cd ..
npx react-native run-ios
```

> If your iOS workspace or scheme name differs, replace `IrisRN` with your project name.

Failure to follow these steps may result in build-time or runtime issues.

## System Requirements

## React Native CLI Environment Setup

Ensure your development environment is properly configured:

- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)

## Android Requirements

Install Android Studio and configure:

- `ANDROID_HOME` environment variable
- Android SDK Build-Tools
- NDK (Side by side) (required)
- CMake (required)

## iOS Requirements (macOS only)

Install and configure:

- Xcode (latest stable)
- Xcode Command Line Tools
- CocoaPods
- iOS Simulator (optional, for local testing)

Recommended installation commands:

```bash
xcode-select --install
sudo gem install cocoapods
```

## Installation and Setup

## 1) Clone Repository

```bash
git clone <your-repository-url>
cd IrisRN
npm install
```

## 2) Start Metro Bundler

```bash
npx react-native start --reset-cache
```

## 3) Run Application

In a new terminal:

### Android

```bash
npx react-native run-android
```

### iOS (macOS only)

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## Testing Guidelines

## Hardware Requirements

- Minimum 4GB-6GB available RAM for 1B-3B models
- Larger models require more memory

## Emulator / Simulator Setup

### Android Emulator

- Allocate at least 6144 MB (6GB) RAM
- Default emulator configurations may crash

### iOS Simulator

- Use a recent device profile with sufficient memory
- Close unused simulators/apps to reduce memory pressure

## Recommendation

Use a physical device for better performance and stability.

## Permissions

The app requires the following permissions:

- Storage access for downloading and managing models
- Microphone access for speech-to-text functionality

Platform notes:
- Android: declare and request runtime permissions as needed
- iOS: define `NSMicrophoneUsageDescription` and relevant file access usage descriptions in `Info.plist`

## Troubleshooting

- **Build fails after dependency update**: run full native clean/rebuild steps for your platform.
- **Android native errors**: verify NDK and CMake installation in Android Studio SDK Manager.
- **iOS pod issues**: run `cd ios && pod repo update && pod install`.
- **Out-of-memory crashes**: reduce model size or use a physical device with more RAM.

## License

Apache-2.0 license

## Contributing

Contributions are welcome. Please ensure:

- Proper testing on real devices
- Native rebuild steps are followed
- Code remains clean and maintainable
