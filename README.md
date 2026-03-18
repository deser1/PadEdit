# PadEdit - Mobile Code Editor

PadEdit is a powerful code editor for Android and iOS, built with React Native and Expo.

## Features

- **Syntax Highlighting & Autocomplete**: Supports multiple languages using Monaco Editor.
- **FTP Editing**: Edit files directly on remote servers (Planned/In-progress).
- **Git Integration**: Clone, commit, push, pull repositories using `isomorphic-git`.
- **File Management**: Local file system access.
- **AI Engine**: Code modeling and generation (Paid feature placeholder).
- **Customizable**: Themes and settings.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npx expo start
   ```

3. Scan the QR code with Expo Go app on your mobile device.

## Project Structure

- `src/components`: UI Components (CodeEditor, etc.)
- `src/screens`: App Screens (Home, Editor, Git, Settings)
- `src/services`: Logic for Git, etc.
- `src/utils`: Helpers and Polyfills.

## Requirements

- Node.js
- Expo Go (on mobile) or Android/iOS Simulator.

## License

MIT
