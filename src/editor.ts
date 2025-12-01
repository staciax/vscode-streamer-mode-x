import vscode from 'vscode';

import type Logger from './logger';
import type { StatusBar } from './status-bar';
import { getNonce } from './utils/nonce';

export class StreamerModeEditor implements vscode.CustomTextEditorProvider {
    /**
     * Whether streamer mode is enabled
     */
    private isEnable = true;

    // /**
    //  *  Logger for the Streamer Mode Editor
    //  */
    // private readonly logger: Logger;

    public static register(
        context: vscode.ExtensionContext,
        statusBar: StatusBar,
        logger: Logger
    ): vscode.Disposable {
        const provider = new StreamerModeEditor(context, statusBar, logger);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            StreamerModeEditor.viewType,
            provider
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'vscode-streamer-mode-x.toggle',
                () => {
                    provider.toggle();
                    vscode.window.showInformationMessage(
                        `Streamer Mode is ${provider.isEnable ? 'Enabled' : 'Disabled'}`
                    );
                    logger.info(
                        `editor: toggled streamer mode to ${provider.isEnable}`
                    );
                }
            )
        );

        logger.debug('editor: registered custom editor provider');

        return providerRegistration;
    }

    public static readonly viewType = 'vscode-streamer-mode-x.editor';

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly statusBar: StatusBar,
        private readonly logger: Logger
    ) {}

    /**
     * Called when our custom editor is opened.
     *
     *
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this.logger.debug(
            `editor: resolving custom editor for ${document.uri.fsPath}`
        );

        if (!this.isEnable) {
            this.logger.debug(
                'editor: streamer mode disabled, opening as normal text document'
            );
            await vscode.window.showTextDocument(document);
            return;
        }

        this.logger.debug('editor: showing streamer mode warning overlay');

        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(
            webviewPanel.webview
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
                        `editor: user opened file anyway: ${document.uri.fsPath}`
                    );
                    await vscode.window.showTextDocument(document);
                    break;
                case 'close':
                    this.logger.debug(
                        // 'editor: user closed streamer mode warning'
                        `editor: user closed streamer mode warning for ${document.uri.fsPath}`
                    );
                    await vscode.commands.executeCommand(
                        'workbench.action.closeActiveEditor'
                    );
                    break;
                default:
                    break;
            }
        });

        function updateWebview() {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText()
            });
        }

        // Hook up event handlers so that we can synchronize the webview with the text document.
        //
        // The text document acts as our model, so we have to sync change in the document to our
        // editor and sync changes in the editor back to the document.
        //
        // Remember that a single text document can also be shared between multiple custom
        // editors (this happens for example when you split a custom editor)

        const changeDocumentSubscription =
            vscode.workspace.onDidChangeTextDocument(
                (e: vscode.TextDocumentChangeEvent) => {
                    if (e.document.uri.fsPath === document.uri.fsPath) {
                        // this.logger.debug(
                        //     `editor: document changed: ${document.uri.fsPath}`
                        // );
                        updateWebview();
                    }
                }
            );

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            // this.logger.debug(
            //     `editor: webview disposed for ${document.uri.fsPath}`
            // );
            changeDocumentSubscription.dispose();
        });

        updateWebview();
    }

    /**
     * Build a URI for a media file contained in the `media` directory.
     */
    private buildMediaUri(filename: string): vscode.Uri {
        return vscode.Uri.joinPath(
            this.context.extensionUri,
            'media',
            filename
        );
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const styleVSCodeUri = webview.asWebviewUri(
            this.buildMediaUri('vscode.css')
        );
        const scriptUri = webview.asWebviewUri(
            this.buildMediaUri('streamer-mode.js')
        );
        const styleMainUri = webview.asWebviewUri(
            this.buildMediaUri('streamer-mode.css')
        );

        const nonce = getNonce();
        const csp = `default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';`;

        return /* html */ `
        <!doctype html>
        <html lang="en">
        <head>
            <meta http-equiv="Content-Security-Policy" content="${csp}">
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <link href="${styleVSCodeUri}" rel="stylesheet" />
            <link href="${styleMainUri}" rel="stylesheet" />

            <title>Streamer Mode Warning</title>
        </head>
        <body>
            <div class="container">
                <div class="warning-icon">⚠️</div>
                <h1 class="warning-title">Streamer Mode Active</h1>
                <p class="warning-text">
                    File hidden for privacy. Disable streamer mode to view content.
                </p>
                <div class="button-container">
                    <button class="open-button">Open Anyway</button>
                    <button class="close-button secondary">Close</button>
                </div>
            </div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
    `;
    }

    private toggle() {
        this.isEnable = !this.isEnable;
        this.statusBar.update(this.isEnable);
    }
}
