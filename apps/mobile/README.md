# NAU-IG 📸

A powerful Instagram content capture and management tool built with Expo and Sparkly Space Repetition.

## 🚀 Features

- **Share Intent Integration**: Capture Instagram posts directly from the share menu.
- **Content Management**: Organize and tag your captured content.
- **Offline First**: Uses SQLite for local storage and seamless performance.
- **Media Caching**: Automatically caches media for offline viewing.
- **Smart Scheduling**: Implements SM-2 (SuperMemo) algorithm principles for reviewing content.

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **State Management**: React Context & Hooks
- **Storage**: [expo-file-system](https://docs.expo.dev/versions/latest/sdk/file-system/)

## 📂 Project Structure

- `src/components`: UI components.
- `src/repositories`: Database abstraction layers.
- `src/services`: Business logic and external API integrations.
- `src/context`: React Context providers.
- `src/screens`: Main application screens.
- `plugins`: Custom Expo config plugins.

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Expo Go app on your mobile device

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## 🏗 Scripts

- `npm start`: Start Expo development server.
- `npm run android`: Run on Android emulator/device.
- `npm run ios`: Run on iOS simulator.
- `npm run lint`: Run ESLint to check code quality.
- `npm run format`: Format code with Prettier.
- `npm run type-check`: Run TypeScript compiler check.
