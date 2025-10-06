# iOS Setup Guide for FRC 7790 App

## ✅ What's Done
- ✅ iOS platform added to Capacitor
- ✅ `@capacitor/ios` package installed
- ✅ Web app built successfully
- ✅ Capacitor config updated with iOS settings
- ✅ Package.json scripts added for iOS
- ✅ iOS folder created with Xcode project

## 📋 Next Steps (You Need To Do)

### 1. Accept Xcode License
Run this command in your terminal:
```bash
sudo xcodebuild -license
```
Press space to scroll through the license, then type "agree"

### 2. Install CocoaPods
```bash
sudo gem install cocoapods
```

### 3. Complete iOS Setup
After accepting the license and installing CocoaPods, run:
```bash
npm run ios:build
```

This will:
- Build your web app
- Copy files to iOS
- Install iOS dependencies (pods)
- Sync everything

### 4. Open in Xcode
```bash
npm run cap:open:ios
```

This opens your project in Xcode where you can:
- Configure app signing (requires Apple Developer account)
- Test on simulator (FREE)
- Build for physical device (requires $99/yr Apple Developer)
- Submit to App Store (requires $99/yr Apple Developer)

## 🎯 Push Notifications on iOS

Your existing code in `pushClient.ts` and `localNotifications.ts` will work on iOS too! The same Capacitor APIs work cross-platform:

- ✅ `@capacitor/push-notifications` - Remote push (FCM for Android, APNs for iOS)
- ✅ `@capacitor/local-notifications` - Local notifications

### Additional iOS Setup for Push Notifications:

1. **In Xcode**: Enable "Push Notifications" capability
2. **APNs Certificate**: Set up in Apple Developer Portal
3. **Backend**: Update your backend to send to both FCM (Android) and APNs (iOS)

The push notification backend endpoint at `/chat/notifications/register-device` will need to handle iOS tokens differently (APNs vs FCM).

## 🔧 Useful Commands

```bash
# Build web app and sync to iOS
npm run ios:build

# Open project in Xcode
npm run cap:open:ios

# Copy web assets only
npx cap copy ios

# Full sync (copy + update dependencies)
npx cap sync ios

# Run on connected device/simulator (from Xcode)
# Press the "Play" button in Xcode
```

## 📱 Testing Options

### Option 1: iOS Simulator (FREE)
- Test app functionality
- Test most features except:
  - Push notifications (simulator limitation)
  - Camera in some cases
  - Some hardware features

### Option 2: Real Device (Requires Apple Developer $99/yr)
- Full testing including push notifications
- Required for App Store submission

## 🚀 App Store Deployment

When ready to publish:

1. **Apple Developer Account** ($99/year)
2. **Configure in Xcode**:
   - Bundle identifier: `com.frc7790.app`
   - Team signing
   - Version/Build numbers
3. **Archive and Submit**:
   - Product → Archive
   - Upload to App Store Connect
   - Fill out App Store listing
   - Submit for review

## 🔐 App Signing

For development testing on real devices, you'll need to:
1. Add your Apple ID in Xcode → Settings → Accounts
2. Select your team in project settings
3. Xcode will handle provisioning profiles

## 📝 Notes

- The app ID is: `com.frc7790.app`
- The app name is: "FRC 7790"
- The app loads your live website: `https://frc7790.com`
- Same codebase works for Android and iOS (that's the beauty of Capacitor!)
- You can set `CAP_USE_BUNDLED=1` to bundle the web app offline

## ⚠️ Current Status

You're at the "accept license and install CocoaPods" stage. Once those are done:
1. Run `npm run ios:build`
2. Run `npm run cap:open:ios`
3. Test in simulator or configure signing for device

## 🆘 Troubleshooting

**Error: "You have not agreed to the Xcode license agreements"**
- Run: `sudo xcodebuild -license`
- Press space to scroll, type "agree"

**Error: "Skipping pod install because CocoaPods is not installed"**
- Run: `sudo gem install cocoapods`

**Error: "xcode-select: error: tool 'xcodebuild' requires Xcode"**
- Install Xcode from App Store
- Run: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

**Signing Errors in Xcode**
- Add Apple ID in Xcode → Settings → Accounts
- Select your team in project signing settings
- For App Store, you need the $99/yr developer program

## 🎉 What You Get on iOS

Same features as Android:
- ✅ Push notifications (remote)
- ✅ Local notifications
- ✅ Native app experience
- ✅ App icon on home screen
- ✅ Full screen (no browser UI)
- ✅ Background sync capabilities
- ✅ Access to native device features
- ✅ App Store distribution

## 🔄 What Changed in Your Code

### package.json
Added these scripts:
- `cap:ios` - Add iOS platform
- `cap:open:ios` - Open project in Xcode
- `ios:build` - Build and sync to iOS

### capacitor.config.ts
Added iOS configuration:
```typescript
ios: {
  contentInset: 'automatic',
}
```

### Dependencies
Added `@capacitor/ios` package to your project
