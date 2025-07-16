import * as vscode from 'vscode';

import type { StatusBar } from '@/status-bar';
import { getNonce } from '@/utils';

export class StreamerModeEditor implements vscode.CustomTextEditorProvider {
    private isEnabled = true;

    public static register(
        context: vscode.ExtensionContext,
        statusBar: StatusBar
    ): vscode.Disposable {
        const provider = new StreamerModeEditor(context, statusBar);
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
                        `Streamer Mode is ${provider.isEnabled ? 'Enabled' : 'Disabled'}`
                    );
                }
            )
        );

        return providerRegistration;
    }

    private static readonly viewType = 'vscode-streamer-mode-x.editor';

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly statusBar: StatusBar
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
        if (!this.isEnabled) {
            await vscode.window.showTextDocument(document);
            return;
        }

        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(
            webviewPanel.webview
        );

        webviewPanel.webview.onDidReceiveMessage(
            async (e: { type: string }) => {
                switch (e.type) {
                    case 'open':
                        await vscode.window.showTextDocument(document);
                        break;
                    case 'close':
                        await vscode.commands.executeCommand(
                            'workbench.action.closeActiveEditor'
                        );
                        break;
                    default:
                        break;
                }
            }
        );

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
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document.uri.toString() === document.uri.toString()) {
                    updateWebview();
                }
            });

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        updateWebview();
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'vscode.css'
            )
        );

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'streamer-mode.js'
            )
        );

        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.context.extensionUri,
                'media',
                'streamer-mode.css'
            )
        );

        const nonce = getNonce();

        return /* html */ `
        <!doctype html>
        <html lang="en">
        <head>
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
        this.isEnabled = !this.isEnabled;
        this.statusBar.update(this.isEnabled);
    }
}
