# AppFitness - Mobile App Project

## Project Type
React Native (Expo) mobile app with Node.js Express backend

## Project Structure
- `/frontend` - React Native Expo mobile application
- `/backend` - Node.js Express API server

## Tech Stack
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Testing**: Android Emulator via Expo Go, iOS Simulator (macOS only)

## Development Workflow
1. Start backend server: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Run on Android emulator: Press 'a' in Expo CLI or scan QR with Expo Go app
4. Run on iOS simulator (macOS): Press 'i' in Expo CLI

## iOS Setup (macOS only)
1. Run `npx expo prebuild --platform ios` in frontend/
2. Run `cd ios && pod install`
3. Open `FitTrack.xcworkspace` in Xcode
4. See `frontend/IOS_SETUP.md` for detailed instructions
