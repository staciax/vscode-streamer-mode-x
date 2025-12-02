import vscode, { workspace } from 'vscode';
import { Utils } from 'vscode-uri';

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
        StreamerModeEditor.register(context, statusBar, logger),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-streamer-mode-x.addAssociation',
            async () => {
                logger.debug('command: addAssociation invoked');

                const config = vscode.workspace.getConfiguration();

                const workspaceFolder =
                    workspace.workspaceFolders &&
                    workspace.workspaceFolders.length > 0
                        ? workspace.workspaceFolders[0]
                        : undefined;

                const simpleDialogEnabled = vscode.workspace
                    .getConfiguration('files.simpleDialog')
                    .get<boolean>('enable');

                let selectedUris: vscode.Uri[] | undefined;

                try {
                    // Enable simple dialog if not already enabled
                    if (!simpleDialogEnabled) {
                        await config.update(
                            'files.simpleDialog.enable',
                            true,
                            vscode.ConfigurationTarget.Global,
                        );
                    }

                    selectedUris = await vscode.window.showOpenDialog({
                        defaultUri: workspaceFolder?.uri,
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        openLabel: 'Select',
                        filters: {
                            'Text Files': ['txt'],
                            'All Files': ['*'],
                        },
                        title: 'Select a file to add association',
                    });
                } finally {
                    // Restore simple dialog setting
                    await config.update(
                        'files.simpleDialog.enable',
                        simpleDialogEnabled,
                        vscode.ConfigurationTarget.Global,
                    );
                }

                if (!selectedUris || selectedUris.length === 0) {
                    return;
                }

                const selectedFileUri: vscode.Uri = selectedUris[0];

                const extname = Utils.extname(selectedFileUri);
                const basename = Utils.basename(selectedFileUri);
                const isDotfile =
                    basename.startsWith('.') && basename.lastIndexOf('.') === 0;

                const patternOptions: vscode.QuickPickItem[] = [];
                if (extname && !isDotfile) {
                    patternOptions.push({
                        label: `Extension (*${extname})`,
                        description: 'Match files by extension',
                        iconPath: new vscode.ThemeIcon('regex'),
                    });
                }

                patternOptions.push({
                    label: `File (${basename})`,
                    description: 'Exact file name match',
                    iconPath: vscode.ThemeIcon.File,
                });

                const selectedPattern = await vscode.window.showQuickPick(
                    patternOptions,
                    {
                        placeHolder: 'Choose the matching pattern to add',
                    },
                );
                if (!selectedPattern) {
                    return;
                }

                const pattern =
                    selectedPattern.label.startsWith('Extension') && extname
                        ? `*${extname}`
                        : basename;

                // Select scope
                const selectedScope = await vscode.window.showQuickPick(
                    [
                        {
                            label: 'Workspace',
                            value: 'workspace',
                        },
                        {
                            label: 'Global',
                            value: 'global',
                        },
                    ],
                    {
                        placeHolder: 'Add to which settings scope?',
                    },
                );

                if (!selectedScope) {
                    return;
                }

                if (selectedScope.value === 'workspace' && !workspaceFolder) {
                    vscode.window.showErrorMessage(
                        'No workspace open to update workspace settings',
                    );
                    return;
                }

                const target =
                    selectedScope.value === 'workspace'
                        ? vscode.ConfigurationTarget.Workspace
                        : vscode.ConfigurationTarget.Global;

                // Update configuration
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
                        `command: added association ${pattern} to ${selectedScope}`,
                    );
                    vscode.window.showInformationMessage(
                        `Added ${pattern} → ${StreamerModeEditor.viewType} to ${selectedScope}`,
                    );
                } catch (e) {
                    const errorMessage =
                        e instanceof Error ? e.message : String(e);
                    logger.error(
                        `command: failed to add association: ${errorMessage}`,
                    );
                    vscode.window.showErrorMessage(
                        `Failed to add association: ${errorMessage}`,
                    );
                }
            },
        ),
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
                        inspected.globalValue,
                    )) {
                        if (value === StreamerModeEditor.viewType) {
                            associations[pattern] = {
                                pattern: pattern,
                                target: vscode.ConfigurationTarget.Global,
                                sourceConfig: inspected.globalValue,
                            };
                        }
                    }
                }

                // Include workspace associations
                if (inspected?.workspaceValue) {
                    for (const [pattern, value] of Object.entries(
                        inspected.workspaceValue,
                    )) {
                        if (value === StreamerModeEditor.viewType) {
                            associations[pattern] = {
                                pattern,
                                target: vscode.ConfigurationTarget.Workspace,
                                sourceConfig: inspected.workspaceValue,
                            };
                        }
                    }
                }

                if (Object.keys(associations).length === 0) {
                    logger.debug('command: no associations found');
                    vscode.window.showInformationMessage(
                        'No associations found for Streamer Mode',
                    );
                    return;
                }
                logger.debug(
                    `command: found ${Object.keys(associations).length} association(s)`,
                );

                const patternItems: vscode.QuickPickItem[] = Object.entries(
                    associations,
                ).map(([pattern, assoc]) => ({
                    label: pattern,
                    description:
                        assoc.target === vscode.ConfigurationTarget.Global
                            ? 'Global'
                            : 'Workspace',
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
                        canPickMany: true,
                    },
                );

                if (!selected?.length) {
                    vscode.window.showInformationMessage(
                        'No associations removed',
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
                            `Failed to remove ${assoc.pattern}: ${errorMessage}`,
                        );
                    }
                }

                if (successCount > 0) {
                    logger.debug(
                        `command: removed ${successCount} of ${selected.length} association(s)`,
                    );
                    vscode.window.showInformationMessage(
                        `Removed ${successCount} of ${selected.length} association(s)`,
                    );
                } else {
                    logger.warn(
                        'command: failed to remove all selected associations',
                    );
                }
            },
        ),
    );

    logger.debug('extension: activated successfully');
}

export function deactivate() {
    // Clear icon theme cache
    clearThemeCache();
}
