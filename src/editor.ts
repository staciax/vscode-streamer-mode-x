import * as path from 'node:path';

import * as vscode from 'vscode';

import type { StatusBar } from '@/status-bar';
import { getNonce } from '@/utils';

export class StreamerModeEditor implements vscode.CustomTextEditorProvider {
    private isEnable = true;

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
                        `Streamer Mode is ${provider.isEnable ? 'Enabled' : 'Disabled'}`
                    );
                }
            )
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'vscode-streamer-mode-x.addAssociation',
                async () => {
                    const active = vscode.window.activeTextEditor;
                    if (!active) {
                        vscode.window.showErrorMessage('No active editor');
                        return;
                    }

                    // Get file path info
                    const uriPath = active.document.uri.fsPath;
                    const base = path.basename(uriPath);
                    const ext = path.extname(base);
                    const isDotfile =
                        base.startsWith('.') && base.lastIndexOf('.') === 0;

                    // Build pattern options
                    const patternOptions: string[] = [];
                    if (ext && !isDotfile) {
                        patternOptions.push(`Extension (*${ext})`);
                    }
                    patternOptions.push(`File (${base})`);

                    const selectedPattern = await vscode.window.showQuickPick(
                        patternOptions,
                        {
                            placeHolder: 'Choose the matching pattern to add'
                        }
                    );
                    if (!selectedPattern) {
                        return;
                    }

                    const pattern =
                        selectedPattern.startsWith('Extension') && ext
                            ? `*${ext}`
                            : base;

                    // Select scope
                    const selectedScope = await vscode.window.showQuickPick(
                        ['Workspace', 'Global'],
                        { placeHolder: 'Add to which settings scope?' }
                    );
                    if (!selectedScope) {
                        return;
                    }

                    if (
                        selectedScope === 'Workspace' &&
                        !vscode.workspace.workspaceFolders
                    ) {
                        vscode.window.showErrorMessage(
                            'No workspace open to update workspace settings'
                        );
                        return;
                    }

                    const target =
                        selectedScope === 'Workspace'
                            ? vscode.ConfigurationTarget.Workspace
                            : vscode.ConfigurationTarget.Global;

                    // Update configuration
                    const config = vscode.workspace.getConfiguration();
                    const key = 'workbench.editorAssociations';
                    const inspected =
                        config.inspect<Record<string, string>>(key);

                    const sourceConfig =
                        target === vscode.ConfigurationTarget.Workspace
                            ? inspected?.workspaceValue
                            : inspected?.globalValue;

                    const updated = { ...(sourceConfig ?? {}) };
                    updated[pattern] = StreamerModeEditor.viewType;

                    try {
                        await config.update(key, updated, target);
                        vscode.window.showInformationMessage(
                            `Added ${pattern} → ${StreamerModeEditor.viewType} to ${selectedScope}`
                        );
                    } catch (e) {
                        vscode.window.showErrorMessage(
                            `Failed to add association: ${e instanceof Error ? e.message : String(e)}`
                        );
                    }
                }
            )
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(
                'vscode-streamer-mode-x.removeAssociation',
                async () => {
                    const config = vscode.workspace.getConfiguration();
                    const key = 'workbench.editorAssociations';

                    // get workspace and global associations
                    const inspected =
                        config.inspect<Record<string, string>>(key);

                    const associations = new Map<
                        string,
                        {
                            pattern: string;
                            target: vscode.ConfigurationTarget;
                            sourceConfig: Record<string, string>;
                        }
                    >();

                    // include global associations
                    if (inspected?.globalValue) {
                        for (const [pattern, value] of Object.entries(
                            inspected.globalValue
                        )) {
                            if (value === StreamerModeEditor.viewType) {
                                associations.set(`${pattern} (Global)`, {
                                    pattern,
                                    target: vscode.ConfigurationTarget.Global,
                                    sourceConfig: inspected.globalValue
                                });
                            }
                        }
                    }

                    // include workspace associations
                    if (inspected?.workspaceValue) {
                        for (const [pattern, value] of Object.entries(
                            inspected.workspaceValue
                        )) {
                            if (value === StreamerModeEditor.viewType) {
                                associations.set(`${pattern} (Workspace)`, {
                                    pattern,
                                    target: vscode.ConfigurationTarget
                                        .Workspace,
                                    sourceConfig: inspected.workspaceValue
                                });
                            }
                        }
                    }

                    if (associations.size === 0) {
                        vscode.window.showInformationMessage(
                            'No associations found for Streamer Mode'
                        );
                        return;
                    }

                    // show list to select
                    const selected = await vscode.window.showQuickPick(
                        Array.from(associations.keys()),
                        {
                            placeHolder: 'Select associations to remove',
                            canPickMany: true
                        }
                    );

                    if (!selected?.length) {
                        vscode.window.showInformationMessage(
                            'No associations removed'
                        );
                        return;
                    }

                    // remove selected associations

                    let successCount = 0;
                    for (const label of selected) {
                        const assoc = associations.get(label);
                        if (!assoc) {
                            continue;
                        }

                        const updated = { ...assoc.sourceConfig };
                        delete updated[assoc.pattern];

                        try {
                            await config.update(key, updated, assoc.target);
                            successCount++;
                        } catch (e) {
                            vscode.window.showErrorMessage(
                                `Failed to remove ${assoc.pattern}: ${e instanceof Error ? e.message : String(e)}`
                            );
                        }
                    }

                    if (successCount > 0) {
                        vscode.window.showInformationMessage(
                            `Removed ${successCount} of ${selected.length} association(s)`
                        );
                    }
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
        if (!this.isEnable) {
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
            vscode.workspace.onDidChangeTextDocument(
                (e: vscode.TextDocumentChangeEvent) => {
                    if (e.document.uri.fsPath === document.uri.fsPath) {
                        updateWebview();
                    }
                }
            );

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
        this.isEnable = !this.isEnable;
        this.statusBar.update(this.isEnable);
    }
}
