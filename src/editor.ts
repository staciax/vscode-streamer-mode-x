import vscode from 'vscode';

import type Logger from './logger';
import { getSettings, updateConfig } from './settings';
import type { StatusBar } from './status-bar';
import { getNonce } from './utils/nonce';

export class StreamerModeEditor implements vscode.CustomTextEditorProvider {
    /**
     * The custom editor view type
     */
    public static readonly viewType = 'streamer-mode';

    /**
     * Whether streamer mode is enabled
     */
    public get isEnable(): boolean {
        return getSettings().enabled;
    }

    public static register(
        context: vscode.ExtensionContext,
        statusBar: StatusBar,
        logger: Logger,
    ): StreamerModeEditor {
        const provider = new StreamerModeEditor(context, statusBar, logger);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            StreamerModeEditor.viewType,
            provider,
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('streamer-mode.toggle', () => {
                provider.toggle();
                vscode.window.showInformationMessage(
                    `Streamer Mode is ${provider.isEnable ? 'Enabled' : 'Disabled'}`,
                );
                logger.info(
                    `editor: toggled streamer mode to ${provider.isEnable}`,
                );
            }),
        );

        context.subscriptions.push(providerRegistration);

        logger.debug('editor: registered custom editor provider');

        return provider;
    }

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly statusBar: StatusBar,
        private readonly logger: Logger,
    ) {}

    /**
     * Called when our custom editor is opened.
     *
     *
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
    ): Promise<void> {
        this.logger.debug(
            `editor: resolving custom editor for ${document.uri.fsPath}`,
        );

        if (!this.isEnable) {
            this.logger.debug(
                'editor: streamer mode disabled, opening as normal text document',
            );
            await vscode.window.showTextDocument(document);
            return;
        }

        this.logger.debug('editor: showing streamer mode warning overlay');

        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = this.getHtmlForWebview(
            webviewPanel.webview,
        );

        type WebviewMessage = { type: 'open' } | { type: 'close' };
        // | { type: 'ready' };

        webviewPanel.webview.onDidReceiveMessage(async (e: WebviewMessage) => {
            // this.logger.debug(`editor: user action: ${e.type}`);
            switch (e.type) {
                // case 'ready':
                //     updateWebview();
                //     break;
                case 'open':
                    this.logger.debug(
                        `editor: user opened file anyway: ${document.uri.fsPath}`,
                    );
                    await vscode.window.showTextDocument(document);
                    break;
                case 'close':
                    this.logger.debug(
                        // 'editor: user closed streamer mode warning'
                        `editor: user closed streamer mode warning for ${document.uri.fsPath}`,
                    );
                    await vscode.commands.executeCommand(
                        'workbench.action.closeActiveEditor',
                    );
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'vscode.css',
            ),
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'streamer-mode.js',
            ),
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'streamer-mode.css',
            ),
        );
        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'node_modules',
                '@vscode/codicons',
                'dist',
                'codicon.css',
            ),
        );

        const nonce = getNonce();
        const csp = `default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';`;

        return /* html */ `
        <!doctype html>
        <html lang="en">
        <head>
            <meta http-equiv="Content-Security-Policy" content="${csp}">
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <link href="${styleVSCodeUri}" rel="stylesheet" />
            <link href="${codiconsUri}" rel="stylesheet" />
            <link href="${styleMainUri}" rel="stylesheet" />

            <title>Streamer Mode Warning</title>
        </head>
        <body>
            <div class="container">
                <div class="warning-icon">
                    <i class="codicon codicon-lock"></i>
                </div>
                <h1 class="warning-title">Streamer Mode Active</h1>
                <p class="warning-text">
                    File hidden for privacy. Disable streamer mode to view content.
                </p>
                <div class="button-container">
                    <button class="open-button">Open Once</button>
                    <button class="close-button secondary">Close</button>
                </div>
            </div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
    `;
    }

    public async toggle() {
        await this.setEnable(!this.isEnable);
    }

    public async setEnable(enable: boolean) {
        if (this.isEnable === enable) {
            return;
        }
        await updateConfig('streamer-mode', 'enabled', enable);
        this.statusBar.update(enable);
    }
}
