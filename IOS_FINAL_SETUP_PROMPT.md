# Prompt for Claude Sonnet 4.5 - iOS Final Setup

Copy and paste this entire prompt to Claude on your other computer (with Xcode and admin privileges):

---

I have a Capacitor project for an iOS app that needs final setup steps requiring Xcode and admin privileges. The iOS platform has already been added to the project. Here's what needs to be done:

## Project Info
- **Project Directory**: `/Users/gmoceri/Documents/FRC7790.com` (adjust to wherever you cloned the repo)
- **App ID**: `com.frc7790.app`
- **App Name**: FRC 7790
- **iOS Folder**: Already exists at `ios/`

## Tasks to Complete

### 1. Accept Xcode License Agreement
If the Xcode license hasn't been accepted yet, run:
```bash
sudo xcodebuild -license
```
- Enter admin password when prompted
- Press space to scroll through the license
- Type "agree" at the end

### 2. Verify Xcode Command Line Tools
Ensure Xcode command line tools are properly configured:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 3. Install CocoaPods
CocoaPods is the dependency manager for iOS. Install it:
```bash
sudo gem install cocoapods
```

### 4. Navigate to Project Directory
```bash
cd /Users/gmoceri/Documents/FRC7790.com
```
(Or wherever the project is located on this computer)

### 5. Install Node Dependencies
Make sure all npm packages are installed:
```bash
npm install
```

### 6. Build the Web App
```bash
npm run build
```

### 7. Sync with iOS Platform
This will copy web assets and install iOS dependencies (pods):
```bash
npx cap sync ios
```

This should complete successfully now that CocoaPods is installed and Xcode license is accepted.

### 8. Open in Xcode
```bash
npx cap open ios
```
or
```bash
npm run cap:open:ios
```

This will open the project in Xcode.

### 9. Configure App Signing in Xcode

Once Xcode opens:

1. **Select the project** in the left sidebar (top item, blue icon)
2. **Select the "App" target** in the main pane
3. **Go to "Signing & Capabilities" tab**
4. **Check "Automatically manage signing"**
5. **Add your Apple ID**:
   - Click on "Team" dropdown
   - Click "Add an Account..."
   - Sign in with your Apple ID (free or paid developer account)
6. **Select your team** from the dropdown

For simulator testing, a free Apple ID is sufficient. For real device testing and App Store submission, you need a paid Apple Developer account ($99/year).

### 10. Test in Simulator

1. In Xcode, select a simulator from the device dropdown (top toolbar)
   - e.g., "iPhone 15 Pro"
2. Click the **Play button** (▶️) or press `Cmd+R`
3. The simulator should launch with your app

### 11. Test Push Notifications (Optional - Real Device Required)

Push notifications don't work in the iOS Simulator. To test them:

1. **Enable Push Notifications Capability** in Xcode:
   - Select the "App" target
   - Go to "Signing & Capabilities" tab
   - Click the "+" button
   - Add "Push Notifications"

2. **Connect a real iOS device** via USB
   - Unlock the device
   - Trust the computer if prompted
   - Select your device from the device dropdown in Xcode
   - Click Play to build and run on device

3. **Trust the Developer** on the device:
   - Go to Settings → General → VPN & Device Management
   - Tap your developer account
   - Tap "Trust"

### 12. Verify Everything Works

Please run these commands and report back any errors:

```bash
# Should show no errors
npx cap doctor

# Check if iOS platform is properly configured
npx cap ls
```

## Expected Success Output

After `npx cap sync ios`, you should see:
```
✔ Copying web assets from dist to ios/App/App/public
✔ Creating capacitor.config.json in ios/App/App
✔ copy ios
✔ Updating iOS plugins
✔ Updating iOS native dependencies with pod install
✔ update ios
```

## If You Encounter Errors

Please share:
1. The exact error message
2. Which step failed
3. Output of `npx cap doctor`

## Additional Notes

- The app loads the live website (`https://frc7790.com`) in a WebView
- Push notifications use Capacitor's Push Notifications plugin
- The same codebase works for both Android and iOS
- To update the web content, just run `npm run ios:build` to rebuild and sync

---

Please run through these steps and let me know if everything builds and runs successfully, or if you encounter any errors. Take screenshots of the app running in the simulator if possible!
