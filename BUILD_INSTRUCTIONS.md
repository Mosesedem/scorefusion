# ScoreFusion Hybrid Mobile App - Build Instructions

## Overview
This is a React Native (Expo) hybrid WebView app that wraps the ScoreFusion website with native mobile features including push notifications and social media integration.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g expo-cli`
4. **EAS CLI** (for building APK/IPA): `npm install -g eas-cli`

## Installation

```bash
npm install
```

## Development

### Run on Expo Go (Testing)

```bash
npm run dev
```

This will start the development server. You can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your physical device

## Building for Production

### Step 1: Configure EAS Build

First, log in to your Expo account:

```bash
eas login
```

Then configure the build:

```bash
eas build:configure
```

This will create an `eas.json` file with build configurations.

### Step 2: Build APK for Android

For development build:
```bash
eas build --platform android --profile development
```

For production build (Google Play Store):
```bash
eas build --platform android --profile production
```

For APK (sideload):
```bash
eas build -p android --profile preview
```

### Step 3: Build IPA for iOS

For development build:
```bash
eas build --platform ios --profile development
```

For production build (App Store):
```bash
eas build --platform ios --profile production
```

**Note**: iOS builds require an Apple Developer account ($99/year).

## Push Notifications Configuration

### Using Expo Push Notifications (Recommended for Testing)

The app is already configured to use Expo's push notification service. When you run the app:

1. The app will request notification permissions
2. Upon granting permission, you'll see the push token in the console
3. Save this token to send notifications

#### Sending Test Notifications

Use the Expo Push Notification Tool:
https://expo.dev/notifications

Or use the Expo Push API:

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "title": "Hello from ScoreFusion",
       "body": "This is a test notification",
       "sound": "default"
     }'
```

### Using Firebase Cloud Messaging (FCM) for Production

For production apps, you may want to integrate FCM:

1. Create a Firebase project at https://console.firebase.google.com
2. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Add FCM plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#ffffff",
          "defaultChannel": "default"
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

4. Follow the Expo FCM guide: https://docs.expo.dev/push-notifications/fcm/

## Customizing the App

### Modifying the Website URL

Edit `components/WebViewComponent.tsx`:

```typescript
const WEBSITE_URL = 'https://www.getscorefusion.com/';
```

### Customizing Social Media Links

Edit `components/SocialFollowModal.tsx`:

```typescript
const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/scorefusion',
  twitter: 'https://twitter.com/scorefusion',
  facebook: 'https://www.facebook.com/scorefusion',
  tiktok: 'https://www.tiktok.com/@scorefusion',
};
```

### Adjusting Popup Timing

In `components/SocialFollowModal.tsx`:

```typescript
const ONE_DAY = 24 * 60 * 60 * 1000;      // "Remind me later" duration
const THREE_DAYS = 3 * ONE_DAY;            // "Don't show for now" duration
```

### Changing App Name and Bundle IDs

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

### Splash Screen Duration

Edit `app/index.tsx`:

```typescript
const timer = setTimeout(async () => {
  setAppReady(true);
  await SplashScreen.hideAsync();
}, 2500); // Change duration in milliseconds
```

## App Store Submission

### Android (Google Play Store)

1. Build production APK: `eas build -p android --profile production`
2. Download the APK/AAB file from EAS dashboard
3. Create a Google Play Developer account ($25 one-time fee)
4. Upload your app to Google Play Console
5. Fill in store listing details, screenshots, privacy policy
6. Submit for review

### iOS (App Store)

1. Enroll in Apple Developer Program ($99/year)
2. Build production IPA: `eas build -p ios --profile production`
3. Download the IPA from EAS dashboard
4. Use Transporter app to upload to App Store Connect
5. Fill in app information, screenshots, privacy policy
6. Submit for review

## Features Included

✅ Full-screen WebView with ScoreFusion website
✅ Pull-to-refresh functionality
✅ External links open in device browser
✅ Caching for faster load times
✅ Splash screen (2.5 seconds)
✅ Push notification support with permission handling
✅ Social media follow popup (customizable timing)
✅ No internet connection screen
✅ Error fallback screen
✅ AsyncStorage for persistent popup dismissal
✅ iOS and Android support

## App Structure

```
project/
├── app/
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Main app screen
├── components/
│   ├── WebViewComponent.tsx  # WebView wrapper
│   ├── SocialFollowModal.tsx # Social media popup
│   ├── NoInternetScreen.tsx  # No connection screen
│   └── ErrorScreen.tsx       # Error fallback
├── hooks/
│   ├── useFrameworkReady.ts  # Framework initialization
│   └── useNotifications.ts   # Push notification logic
└── assets/
    └── images/
        └── icon.png          # App icon & splash screen
```

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Clear cache: `expo start -c`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Check EAS build logs in the dashboard

### Notification Issues

- Notifications don't work in Expo Go on iOS
- Use development builds or production builds for testing notifications
- Ensure you're testing on a physical device (not simulator)

### WebView Not Loading

- Check internet connection
- Verify the website URL is accessible
- Check for CORS issues (website must allow embedding)

## Support

For Expo-related issues: https://docs.expo.dev
For EAS Build: https://docs.expo.dev/build/introduction
For Push Notifications: https://docs.expo.dev/push-notifications/overview

## License

This project is configured for the ScoreFusion app. Modify as needed for your use case.
