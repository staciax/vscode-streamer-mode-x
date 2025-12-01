import path from 'node:path';

import vscode from 'vscode';

import { StreamerModeEditor } from './editor';
import Logger from './logger';
import { StatusBar } from './status-bar';
import { clearThemeCache, getFileIconUri } from './utils/theme';

// import { generateExcludePattern } from '@/utils/exclude-pattern';

export function activate(context: vscode.ExtensionContext) {
    const logger = new Logger('VSCode Streamer Mode');

    logger.debug('extension: activating');

    const statusBar = new StatusBar(logger);

    context.subscriptions.push(
        StreamerModeEditor.register(context, statusBar, logger)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-streamer-mode-x.addAssociation',
            async () => {
                logger.debug('command: addAssociation invoked');

                const editor = vscode.window.activeTextEditor;
                const document = editor?.document;

                let selectedFileUri: vscode.Uri;

                if (
                    document?.uri.scheme === 'file' ||
                    document?.uri.scheme.startsWith('vscode-notebook')
                ) {
                    selectedFileUri = vscode.Uri.file(document.uri.fsPath);
                } else {
                    if (!vscode.workspace.workspaceFolders?.length) {
                        return;
                    }
                    // const excludePattern = await generateExcludePattern();

                    // const files2: vscode.Uri[] = [];
                    // console.log('Generated exclude pattern:', excludePattern);

                    // if (vscode.workspace.workspaceFolders.length === 1) {
                    //     // const folder: vscode.WorkspaceFolder =
                    //     //     vscode.workspace.workspaceFolders[0];

                    //     for (const folder of vscode.workspace
                    //         .workspaceFolders) {
                    //         const folderFiles =
                    //             await vscode.workspace.findFiles(
                    //                 new vscode.RelativePattern(folder, '**/*')
                    //                 // excludePattern,
                    //                 // 100 // limit to first 100 files
                    //             );
                    //         files2.push(...folderFiles);
                    //     }
                    // } else {
                    //     console.log('Multiple workspace folders');
                    // }

                    const files = await vscode.workspace.findFiles(
                        '**/*'
                        // excludePattern,
                        // 100 // limit to first 100 files
                    );

                    if (files.length === 0) {
                        vscode.window.showErrorMessage(
                            'No files found in workspace'
                        );
                        return;
                    }

                    const fileItems: (vscode.QuickPickItem & {
                        label: string;
                        description: string;
                        iconPath: vscode.ThemeIcon | vscode.Uri;
                        uri: vscode.Uri;
                    })[] = [];

                    const sortedFiles = files.sort((a, b) =>
                        a.fsPath.localeCompare(b.fsPath)
                    );

                    for (const file of sortedFiles) {
                        const basename = path.basename(file.fsPath);
                        const relativePath =
                            vscode.workspace.asRelativePath(file);
                        const iconUri = await getFileIconUri(file.fsPath);
                        fileItems.push({
                            label: basename,
                            description: relativePath,
                            iconPath: iconUri ? iconUri : vscode.ThemeIcon.File,
                            uri: file
                        });
                    }

                    const pick = await vscode.window.showQuickPick(fileItems, {
                        placeHolder: 'Select files to add association',
                        matchOnDescription: true
                        // canPickMany: true,
                    });

                    if (!pick) {
                        return;
                    }

                    selectedFileUri = pick.uri;
                }

                // console.log('selectedFileUri:', selectedFileUri);

                // if (!editor) {
                //     logger.debug('command: no active editor');
                //     vscode.window.showErrorMessage('No active editor');
                //     return;
                // }

                logger.debug(
                    `command: adding association for ${selectedFileUri.fsPath}`
                );

                const base = path.basename(selectedFileUri.fsPath);
                const ext = path.extname(base); // .toLowerCase();
                const isDotfile =
                    base.startsWith('.') && base.lastIndexOf('.') === 0;

                // Build pattern options
                const patternOptions: vscode.QuickPickItem[] = [];
                if (ext && !isDotfile) {
                    patternOptions.push({
                        // label: `Extension`,
                        // description: `*${ext}`,
                        label: `Extension (*${ext})`,
                        description: 'Match files by extension',
                        iconPath: new vscode.ThemeIcon('regex')
                    });
                }

                // const iconUri = await getFileIconUri(selectedFileUri.fsPath);

                patternOptions.push({
                    // label: `File`,
                    // description: `${base}`,
                    label: `File (${base})`,
                    description: 'Exact file name match',
                    // iconPath: iconUri ? iconUri : vscode.ThemeIcon.File
                    iconPath: vscode.ThemeIcon.File
                });

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
                    selectedPattern.label.startsWith('Extension') && ext
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
                    logger.debug(
                        `command: added association ${pattern} to ${selectedScope}`
                    );
                    vscode.window.showInformationMessage(
                        `Added ${pattern} → ${StreamerModeEditor.viewType} to ${selectedScope}`
                    );
                } catch (e) {
                    const errorMessage =
                        e instanceof Error ? e.message : String(e);
                    logger.error(
                        `command: failed to add association: ${errorMessage}`
                    );
                    vscode.window.showErrorMessage(
                        `Failed to add association: ${errorMessage}`
                    );
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-streamer-mode-x.removeAssociation',
            async () => {
                logger.debug('command: removeAssociation invoked');

                const config = vscode.workspace.getConfiguration();
                const key = 'workbench.editorAssociations';

                // Get workspace and global associations
                const inspected = config.inspect<Record<string, string>>(key);

                const associations: Record<
                    string,
                    {
                        pattern: string;
                        target: vscode.ConfigurationTarget;
                        sourceConfig: Record<string, string>;
                    }
                > = {};

                // Include global associations
                if (inspected?.globalValue) {
                    for (const [pattern, value] of Object.entries(
                        inspected.globalValue
                    )) {
                        if (value === StreamerModeEditor.viewType) {
                            associations[pattern] = {
                                pattern: pattern,
                                target: vscode.ConfigurationTarget.Global,
                                sourceConfig: inspected.globalValue
                            };
                        }
                    }
                }

                // Include workspace associations
                if (inspected?.workspaceValue) {
                    for (const [pattern, value] of Object.entries(
                        inspected.workspaceValue
                    )) {
                        if (value === StreamerModeEditor.viewType) {
                            associations[pattern] = {
                                pattern,
                                target: vscode.ConfigurationTarget.Workspace,
                                sourceConfig: inspected.workspaceValue
                            };
                        }
                    }
                }

                if (Object.keys(associations).length === 0) {
                    logger.debug('command: no associations found');
                    vscode.window.showInformationMessage(
                        'No associations found for Streamer Mode'
                    );
                    return;
                }
                logger.debug(
                    `command: found ${Object.keys(associations).length} association(s)`
                );

                const patternItems: vscode.QuickPickItem[] = Object.entries(
                    associations
                ).map(([pattern, assoc]) => ({
                    label: pattern,
                    description:
                        assoc.target === vscode.ConfigurationTarget.Global
                            ? 'Global'
                            : 'Workspace'
                    // iconPath:
                    //     assoc.target === vscode.ConfigurationTarget.Global
                    //         ? new vscode.ThemeIcon('globe')
                    //         : new vscode.ThemeIcon('briefcase')
                }));

                // Show list to select
                const selected = await vscode.window.showQuickPick(
                    patternItems,
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
                for (const item of selected) {
                    const assoc = associations[item.label];
                    if (!assoc) {
                        continue;
                    }

                    const updated = { ...assoc.sourceConfig };
                    delete updated[assoc.pattern];

                    try {
                        await config.update(key, updated, assoc.target);
                        successCount++;
                    } catch (e) {
                        const errorMessage =
                            e instanceof Error ? e.message : String(e);
                        vscode.window.showErrorMessage(
                            `Failed to remove ${assoc.pattern}: ${errorMessage}`
                        );
                    }
                }

                if (successCount > 0) {
                    logger.debug(
                        `command: removed ${successCount} of ${selected.length} association(s)`
                    );
                    vscode.window.showInformationMessage(
                        `Removed ${successCount} of ${selected.length} association(s)`
                    );
                } else {
                    logger.warn(
                        'command: failed to remove all selected associations'
                    );
                }
            }
        )
    );

    logger.debug('extension: activated successfully');
}

export function deactivate() {
    // Clear icon theme cache
    clearThemeCache();
}
