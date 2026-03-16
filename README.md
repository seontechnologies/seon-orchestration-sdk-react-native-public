# SEON Orchestration SDK – React Native Sample App

A sample React Native application demonstrating how to integrate the [`@seontechnologies/seon-react-native-orchestration`](https://www.npmjs.com/package/@seontechnologies/seon-react-native-orchestration) SDK for identity verification flows on iOS and Android.

---

## Installation

### React Native

```sh
npm install @seontechnologies/seon-react-native-orchestration
# or
yarn add @seontechnologies/seon-react-native-orchestration
```

For iOS, install the pods:

```sh
cd ios && pod install
```

### Expo

```sh
npx expo install @seontechnologies/seon-react-native-orchestration
```

Add the config plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "@seontechnologies/seon-react-native-orchestration"
    ]
  }
}
```

Then run `npx expo prebuild` to generate native projects.

---

## Quick Start

```typescript
import { initialize, startVerification, SeonVerificationStatus } from '@seontechnologies/seon-react-native-orchestration';

// 1. Initialize the SDK
await initialize({
  baseUrl: 'https://your-api-endpoint.com',
  token: 'your-auth-token',
  language: 'en', // optional
});

// 2. Start the verification flow
const result = await startVerification();

switch (result.status) {
  case SeonVerificationStatus.completedSuccess:
    console.log('Verification passed!');
    break;
  case SeonVerificationStatus.completedFailed:
    console.log('Verification failed.');
    break;
  case SeonVerificationStatus.interruptedByUser:
    console.log('User cancelled.');
    break;
  case SeonVerificationStatus.error:
    console.log('Error:', result.errorMessage);
    break;
}
```

### With Custom Theme

The `theme` parameter accepts a JSON string to customize the verification UI. Refer to the [SEON workflow initialization docs](https://docs.seon.io) for the full theme schema.

```typescript
await initialize({
  baseUrl: 'https://your-api-endpoint.com',
  token: 'your-auth-token',
  language: 'en',
  theme: JSON.stringify({ /* your theme config */ }),
});
```

---

## API Overview

| Function | Description |
|----------|-------------|
| `initialize(config)` | Initialize the SEON SDK with base URL, token, and optional language/theme |
| `startVerification()` | Present the verification UI and return the result |

| Type | Description |
|------|-------------|
| `SeonConfig` | Configuration object for `initialize()` |
| `SeonVerificationResult` | Result object from `startVerification()` |
| `SeonVerificationStatus` | Enum of all possible verification outcomes |
| `SeonErrorCode` | Enum of error codes thrown by the SDK |

---

## Expo Config Plugin

Customize permission strings via plugin props:

```json
{
  "expo": {
    "plugins": [
      [
        "@seontechnologies/seon-react-native-orchestration",
        {
          "cameraPermission": "We need camera access for identity verification",
          "microphonePermission": "We need microphone access for verification",
          "photoLibraryPermission": "We need photo library access for verification",
          "locationPermission": "We need location for fraud prevention (optional)"
        }
      ]
    ]
  }
}
```

---

## Permissions

The SEON SDK requires camera, microphone, and storage permissions. Location is optional (only if your workflow uses geolocation-based fraud detection).

**Expo**: The config plugin handles this automatically (see above).

**React Native**: The library's Android manifest auto-merges the required permissions and hardware features. For iOS, add these to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Required for ID verification and selfie capture</string>
<key>NSMicrophoneUsageDescription</key>
<string>Required for video liveness checks</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Required for proof of address document upload</string>
```

If your workflow uses geolocation-based fraud detection, also add `ACCESS_FINE_LOCATION` (Android) and `NSLocationWhenInUseUsageDescription` (iOS).

---

## Platform Requirements

| Platform | Minimum Version |
|----------|----------------|
| iOS | 13.0+ |
| Android | SDK 26+ (Android 8.0) |
| React Native | 0.71+ |

---

## Running the Sample App

> **Note**: Make sure you have completed the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) before proceeding.

**1. Install dependencies**

```sh
npm install
```

**2. Install iOS pods** (iOS only)

```sh
bundle install
cd ios && bundle exec pod install
```

**3. Start Metro**

```sh
npm start
```

**4. Run on device or simulator**

```sh
# Android
npm run android

# iOS
npm run ios
```

---

## Changelog

### 0.1.1

- Fixed an issue with collision of Privacy Manifest

### 0.0.1

- Initial release
