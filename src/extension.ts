import * as path from 'node:path';

import * as vscode from 'vscode';

import { StreamerModeEditor } from '@/editor';
import { StatusBar } from '@/status-bar';

export function activate(context: vscode.ExtensionContext) {
    const statusBar = new StatusBar();
    context.subscriptions.push(StreamerModeEditor.register(context, statusBar));

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
                const ext = path.extname(base); // .toLowerCase();
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
                const inspected = config.inspect<Record<string, string>>(key);

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

                // Get workspace and global associations
                const inspected = config.inspect<Record<string, string>>(key);

                const associations = new Map<
                    string,
                    {
                        pattern: string;
                        target: vscode.ConfigurationTarget;
                        sourceConfig: Record<string, string>;
                    }
                >();

                // Include global associations
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

                // Include workspace associations
                if (inspected?.workspaceValue) {
                    for (const [pattern, value] of Object.entries(
                        inspected.workspaceValue
                    )) {
                        if (value === StreamerModeEditor.viewType) {
                            associations.set(`${pattern} (Workspace)`, {
                                pattern,
                                target: vscode.ConfigurationTarget.Workspace,
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

                // Show list to select
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

                // Remove selected associations
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
}

export function deactivate() {}
