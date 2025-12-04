# Change Log

All notable changes to the "vscode-streamer-mode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2025-03-20

- Initial release
- Basic Streamer Mode functionality for protecting sensitive files
- Toggle command to enable/disable protection

## [0.0.2] - 2025-03-20

- fix: update README to use local demo GIF for preview
- fix: correct repository and bugs URLs in package.json
- fix: add activation event for onStartupFinished in package.json

## [0.0.3] - 2025-03-20

- fix: typo custom editor view type

## [0.0.4] - 2025-03-20

- fix: downgrade vscode engine version to ^1.95.0
- fix: downgrade @types/vscode version to ^1.95.0

## [0.0.5] - 2025-03-20

- chore: version bump

## [0.0.6] - 2025-03-20

- chore: version bump

## [0.0.7] - 2025-03-20

- chore: version bump

## [0.0.8] - 2025-12-03

- feat: add "Add File Association" command to dynamically add file patterns to Streamer Mode protection
- feat: add "Remove File Association" command to remove file patterns from protection
- feat: migrate from ESLint and Prettier to BiomeJS for linting and formatting

**Full Changelog**: https://github.com/staciax/vscode-streamer-mode-x/compare/v0.0.3...v0.0.8

## [0.1.0] - 2025-12-03

### Added
- **Walkthrough**: New "Get Started" page to guide users.
- **Keybindings**:
    - `Cmd+Option+H` (Mac) / `Ctrl+Alt+H`: Toggle Hide File.
    - `Cmd+Option+S` (Mac) / `Ctrl+Alt+S`: Toggle Streamer Mode.
- **Editor Title Menu**: Eye icon to quickly hide/unhide files.
- **Badges**: 'S' badge for hidden files in Explorer.
- **Configuration**: New setting `streamer-mode.autoDetected.additionalApps` to allow users to specify custom streaming apps.
- **Documentation**: Updated supported apps list and added compatibility warning for Auto-Detection.
- **Codebase Cleanup**: Optimized performance.

### Removed
- **Commands**: Removed `Add File Association` and `Remove File Association` commands in favor of the new toggle functionality.
