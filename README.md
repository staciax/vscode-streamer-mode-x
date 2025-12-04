# streamer-mode-x

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/staciax.vscode-streamer-mode-x?label=Visual%20Studio%20Marketplace&labelColor=374151&color=60a5fa)](https://marketplace.visualstudio.com/items?itemName=staciax.vscode-streamer-mode-x)
[![Open VSX Registry](https://img.shields.io/visual-studio-marketplace/v/staciax.vscode-streamer-mode-x?label=Open%20VSX%20Registry&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSI0LjYgNSA5Ni4yIDEyMi43IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGQ9Ik0zMCA0NC4yTDUyLjYgNUg3LjN6TTQuNiA4OC41aDQ1LjNMMjcuMiA0OS40em01MSAwbDIyLjYgMzkuMiAyMi42LTM5LjJ6IiBmaWxsPSIjYzE2MGVmIi8+CiAgPHBhdGggZD0iTTUyLjYgNUwzMCA0NC4yaDQ1LjJ6TTI3LjIgNDkuNGwyMi43IDM5LjEgMjIuNi0zOS4xem01MSAwTDU1LjYgODguNWg0NS4yeiIgZmlsbD0iI2E2MGVlNSIvPgo8L3N2Zz4=&labelColor=374151&color=60a5fa)](https://open-vsx.org/extension/staciax/vscode-streamer-mode-x)

A Visual Studio Code extension that protects sensitive files like `.env`, especially useful while streaming your screen.

<!-- When you try to open a protected file, **a warning screen** will appear instead of showing the file content. You can either **open the file anyway** or **close the warning**, keeping your secrets safe from accidental leaks during streams or presentations. -->

<!-- ![Preview](docs/demo.gif) -->
<!-- wait for update -->

## Installation

The extension for VS Code is available on the **Visual Studio Marketplace**
- [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=staciax.vscode-streamer-mode-x)
- [Open VSX Registry](https://open-vsx.org/extension/staciax/vscode-streamer-mode-x)

## Key Features

- **Zero-Leak Protection**: Unlike other extensions, this uses VS Code's Custom Editor API to intercept files *before* they render, ensuring no content ever flashes on screen.
- **[Auto-Detection](#auto-detection)**: Automatically enables protection when streaming apps (OBS, Streamlabs) are running.
- **Seamless & Easy to Use**: Designed to be "set and forget" with simple one-click toggles via status bar or keybindings.
- **Visual Confidence**: A clear 'S' badge and color coding in the Explorer lets you know exactly which files are safe.
- **Comprehensive Security**: Out-of-the-box protection for `.env`, `.pem`, `.key`, `.pfx`, and more, with support for custom file patterns.

## Usage

### Protected File Types
The extension automatically protects the following file types:
- Environment files (`.env`)
- Certificate and key files (`.pem`, `.key`, `.cer`, `.crt`)
- Certificate stores (`.p12`, `.pfx`)

### Toggling Streamer Mode

You can enable/disable the protection in multiple ways:

1. **Status Bar**: Click on the "Streamer Mode" indicator in the status bar
2. **Keybinding**: Press `Cmd+Option+S` (Mac) or `Ctrl+Alt+S` (Windows/Linux)
3. **Command Palette**: 
   - Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type "Toggle Streamer Mode"
   - Select to enable/disable

When disabled, protected files will open normally without the warning screen.

### Auto-Detection

The extension can automatically enable Streamer Mode when it detects streaming software running on your computer.

> [!WARNING]
> This feature has only been tested on VS Code Version: 1.106.3 (Universal) on macOS.

- **Supported Apps**: OBS Studio, Streamlabs, XSplit.
- **Configuration**:
  - `streamer-mode.autoDetected.enable`: Enable/disable auto-detection (default: `false`).
  - `streamer-mode.autoDetected.interval.active`: Polling interval when Streamer Mode is enabled (default: `60` seconds).
  - `streamer-mode.autoDetected.interval.inactive`: Polling interval when Streamer Mode is disabled (default: `30` seconds).
  - `streamer-mode.autoDetected.additionalApps`: List of additional process names to detect as streaming apps.

### Hiding/Unhiding Files

You can quickly hide or unhide the current file:

1. **Editor Title Menu**: Click the **Eye Icon** in the top-right corner of the editor.
2. **Keybinding**: Press `Cmd+Option+P` (Mac) or `Ctrl+Alt+P` (Windows/Linux).
3. **Context Menu**: Right-click a file in Explorer and select "Toggle File Protection".

## Development

### Runtime Environment

> [!WARNING]  
> This project currently uses [Bun](https://bun.sh/) instead of [Node.js](https://nodejs.org/) as a runtime environment. While it's working in the current state, there are some limitations I've encountered. If you fork or clone this repository, you might face compatibility issues. This is an experimental setup as I explore Bun's capabilities compared to Node.js.

### Prerequisites

- [Bun](https://bun.sh/) 1.3+
- [Node.js](https://nodejs.org/) 24+ (recommended)
- VSCode: 1.95.0+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/staciax/vscode-streamer-mode-x.git
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Compile the extension:
   ```bash
   bun run compile
   ```
4. Run in debug mode:
   - Open the project in VS Code
   - Press `F5` to launch a new Extension Development Host window

## License

This project is licensed under the GNUv3 License - see the [LICENSE](LICENSE.md) file for details.