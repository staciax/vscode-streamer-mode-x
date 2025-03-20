# vscode-streamer-mode-x

A Visual Studio Code extension that protects sensitive files like `.env`, especially useful while streaming your screen.

<!-- When you try to open a protected file, **a warning screen** will appear instead of showing the file content. You can either **open the file anyway** or **close the warning**, keeping your secrets safe from accidental leaks during streams or presentations. -->

![Preview](https://i.imgur.com/fAbDBSh.gif)

## Installation

The extension for VS Code is available on the **Visual Studio Marketplace**
- [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=staciax.vscode-streamer-mode-x)

## Features

- **Easy to Use** – The warning disappears once you confirm the action.
- **Supports Many File Types** – Protects `.env`, `.pem`, `.key`, `.crt`, `.pfx`, and more.
- **Perfect for Streamers** – Prevent accidental exposure of sensitive information during live streams.
- **Status Bar Control** – Visual indicator shows current mode (enabled/disabled) and allows toggling.

## Usage

### Protected File Types
The extension automatically protects the following file types:
- Environment files (`.env`)
- Certificate and key files (`.pem`, `.key`, `.cer`, `.crt`)
- Certificate stores (`.p12`, `.pfx`)

### Toggling Streamer Mode

You can enable/disable the protection in two ways:

1. **Status Bar**: Click on the "Streamer Mode" indicator in the status bar
2. **Command Palette**: 
   - Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type "Toggle Streamer Mode"
   - Select to enable/disable

When disabled, protected files will open normally without the warning screen.

## Runtime Environment

> [!WARNING]  
> This project currently uses [Bun](https://bun.sh/) instead of [Node.js](https://nodejs.org/) as a runtime environment. While it's working in the current state, there are some limitations I've encountered. If you fork or clone this repository, you might face compatibility issues. This is an experimental setup as I explore Bun's capabilities compared to Node.js.

## License

This project is licensed under the GNUv3 License - see the [LICENSE](LICENSE.md) file for details.

<!-- TODO -->
<!-- custom html, css -->
<!-- eslint,prettier to biomejs -->
