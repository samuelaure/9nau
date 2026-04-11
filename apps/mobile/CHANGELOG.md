# Changelog

All notable changes to this project will be documented in this file.

## [1.0.8] - 2026-02-08

### Added
- **Performance Virtualization**: Implemented "Settle-to-Play" strategy for feed videos. Videos now only mount and play when the user stops scrolling (250ms delay) and the item is fully visible.
- **Local Thumbnails**: Added `expo-video-thumbnails` to generate cover images from local video files, removing the need for re-downloads or API calls.
- **Restricted Content Handling**: Added specific UI and delete actions for restricted Instagram content.
- **System Logs**: Added in-app log viewer in Settings for easier debugging.

### Changed
- **Resource Management**: Feed items now aggressively unmount video players when off-screen, replacing them with lightweight cached thumbnails.
- **Sync Safety**: Improved re-download logic to preserve existing data during sync retries.
- **UI Improvements**: Added `ScrollView` to modals and sidebars to prevent content cutoff on smaller screens.

### Fixed
- **App Freezing**: Solved severe UI freezing issues caused by multiple video instances mounting simultaneously during fast scrolling.
- **Linting**: Addressed numerous styling and linting issues in `SettingsModal` and other components.

## [1.0.7] - 2026-02-07

### Added
- **Database Backup**: Added ability to export and share the database file from Settings for data safety during updates.
- **Tagging System**: Extracted `TagPickerModal` for reusable tag management across the app.
- **Post-Hoc Tagging**: Added "Add Tag" button to feed items to categorize existing captures.
- **Improved Video Player**: Added `InstagramVideo` with better gesture controls (Single Tap Mute, Double Tap Review, Long Press Pause).
- **Video Posters**: Implemented `posterSource` to prevent white flashes during video loading.

### Changed
- **Capture Workflow**: Redesigned `CaptureModal` to focus on content first. Captures now default to unscheduled, allowing users to categorize and schedule later.
- **UI Renaming**: Renamed "Backlog" to "Archive" throughout the UI for clearer taxonomy.
- **Styling**: Refined `LabelManagementModal` and `SettingsModal` with proper color constants and improved layouts.
- **Assets**: Updated application icons.

### Fixed
- **Gesture Conflicts**: Resolved conflict between single and double taps on video media.
- **Build Compatibility**: Downgraded `expo-sharing` to match Expo v50 requirements.
- **Linting**: Fixed 100+ linting issues related to color literals and unused variables.

## [1.0.6] - 2026-02-05
- Previous version.
