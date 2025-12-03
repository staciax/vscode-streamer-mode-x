import vscode from 'vscode';
import { Utils } from 'vscode-uri';

import { StreamerModeEditor } from './editor';
import type Logger from './logger';
import { updateConfig } from './settings';

// export async function addAssociation(logger: Logger) {
//     logger.debug('command: addAssociation invoked');

//     const workspaceFolder =
//         vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
//             ? vscode.workspace.workspaceFolders[0]
//             : undefined;

//     const simpleDialogEnabled = getConfig(
//         'files.simpleDialog',
//         'enable',
//         false,
//     );
//     let selectedUris: vscode.Uri[] | undefined;

//     try {
//         // Enable simple dialog if not already enabled
//         if (!simpleDialogEnabled) {
//             await updateConfig('files.simpleDialog', 'enable', true);
//         }

//         selectedUris = await vscode.window.showOpenDialog({
//             defaultUri: workspaceFolder?.uri,
//             canSelectFiles: true,
//             canSelectFolders: false,
//             canSelectMany: false,
//             openLabel: 'Select',
//             filters: {
//                 'Text Files': ['txt'],
//                 'All Files': ['*'],
//             },
//             title: 'Select a file to add association',
//         });
//     } finally {
//         // Restore simple dialog setting
//         await updateConfig('files.simpleDialog', 'enable', simpleDialogEnabled);
//     }

//     if (!selectedUris || selectedUris.length === 0) {
//         return;
//     }

//     const selectedFileUri: vscode.Uri = selectedUris[0];

//     const extname = Utils.extname(selectedFileUri);
//     const basename = Utils.basename(selectedFileUri);
//     const isDotfile =
//         basename.startsWith('.') && basename.lastIndexOf('.') === 0;

//     const patternOptions: vscode.QuickPickItem[] = [];
//     if (extname && !isDotfile) {
//         patternOptions.push({
//             label: `Extension (*${extname})`,
//             description: 'Match files by extension',
//             iconPath: new vscode.ThemeIcon('regex'),
//         });
//     }

//     patternOptions.push({
//         label: `File (${basename})`,
//         description: 'Exact file name match',
//         iconPath: vscode.ThemeIcon.File,
//     });

//     const selectedPattern = await vscode.window.showQuickPick(patternOptions, {
//         placeHolder: 'Choose the matching pattern to add',
//     });
//     if (!selectedPattern) {
//         return;
//     }

//     const pattern =
//         selectedPattern.label.startsWith('Extension') && extname
//             ? `*${extname}`
//             : basename;

//     const scopeOptions: {
//         label: string;
//         value: string;
//         description: string;
//         iconPath: vscode.ThemeIcon;
//     }[] = [
//         {
//             label: 'Global',
//             value: 'global',
//             description: 'User settings for all workspaces',
//             iconPath: new vscode.ThemeIcon('globe'),
//         },
//     ];

//     if (workspaceFolder) {
//         scopeOptions.unshift({
//             label: 'Workspace',
//             value: 'workspace',
//             description: 'Current workspace settings',
//             iconPath: new vscode.ThemeIcon('folder'),
//         });
//     }

//     // Select scope
//     const selectedScope = await vscode.window.showQuickPick(scopeOptions, {
//         placeHolder: 'Add to which settings scope?',
//     });

//     if (!selectedScope) {
//         return;
//     }

//     const target =
//         selectedScope.value === 'workspace'
//             ? vscode.ConfigurationTarget.Workspace
//             : vscode.ConfigurationTarget.Global;

//     // Update configuration
//     const config = vscode.workspace.getConfiguration();
//     const key = 'workbench.editorAssociations';
//     const inspected = config.inspect<Record<string, string>>(key);

//     const sourceConfig =
//         target === vscode.ConfigurationTarget.Workspace
//             ? inspected?.workspaceValue
//             : inspected?.globalValue;

//     const updated = { ...(sourceConfig ?? {}) };
//     updated[pattern] = StreamerModeEditor.viewType;

//     try {
//         await updateConfig('workbench', 'editorAssociations', updated, target);
//         logger.debug(
//             `command: added association ${pattern} to ${selectedScope}`,
//         );
//         vscode.window.showInformationMessage(
//             `Added ${pattern} → ${StreamerModeEditor.viewType} to ${selectedScope}`,
//         );
//     } catch (e) {
//         const errorMessage = e instanceof Error ? e.message : String(e);
//         logger.error(`command: failed to add association: ${errorMessage}`);
//         vscode.window.showErrorMessage(
//             `Failed to add association: ${errorMessage}`,
//         );
//     }
// }

// export async function removeAssociation(logger: Logger) {
//     logger.debug('command: removeAssociation invoked');

//     const config = vscode.workspace.getConfiguration();
//     const key = 'workbench.editorAssociations';

//     // Get workspace and global associations
//     const inspected = config.inspect<Record<string, string>>(key);
//     const globalAssociations = inspected?.globalValue ?? {};
//     const workspaceAssociations = inspected?.workspaceValue ?? {};

//     const patternOptions: ({
//         scope: vscode.ConfigurationTarget;
//         value: string;
//     } & vscode.QuickPickItem)[] = [];

//     if (Object.keys(globalAssociations).length > 0) {
//         // add separater
//         patternOptions.push({
//             label: 'Global',
//             alwaysShow: true,
//             kind: vscode.QuickPickItemKind.Separator,
//             scope: vscode.ConfigurationTarget.Global,
//             value: 'global',
//         });
//         for (const [pattern, value] of Object.entries(globalAssociations)) {
//             if (value === StreamerModeEditor.viewType) {
//                 patternOptions.push({
//                     label: pattern,
//                     scope: vscode.ConfigurationTarget.Global,
//                     value: pattern,
//                     iconPath: new vscode.ThemeIcon('globe'),
//                 });
//             }
//         }
//     }

//     if (Object.keys(workspaceAssociations).length > 0) {
//         // add separater
//         patternOptions.push({
//             label: 'Workspace',
//             alwaysShow: true,
//             kind: vscode.QuickPickItemKind.Separator,
//             scope: vscode.ConfigurationTarget.Workspace,
//             value: 'workspace',
//         });

//         for (const [pattern, value] of Object.entries(workspaceAssociations)) {
//             if (value === StreamerModeEditor.viewType) {
//                 patternOptions.push({
//                     label: pattern,
//                     value: pattern,
//                     scope: vscode.ConfigurationTarget.Workspace,
//                     iconPath: new vscode.ThemeIcon('folder'),
//                 });
//             }
//         }
//     }

//     if (patternOptions.length === 0) {
//         logger.debug('command: no associations found');
//         vscode.window.showInformationMessage(
//             'No associations found for Streamer Mode',
//         );
//         return;
//     }
//     logger.debug(`command: found ${patternOptions.length} association(s)`);

//     // Show list to select
//     const selected = await vscode.window.showQuickPick(patternOptions, {
//         placeHolder: 'Select associations to remove',
//         canPickMany: true,
//     });

//     if (!selected?.length) {
//         vscode.window.showInformationMessage('No associations removed');
//         return;
//     }

//     let globalRemovedCount = 0;
//     let workspaceRemovedCount = 0;

//     for (const item of selected) {
//         if (item.scope === vscode.ConfigurationTarget.Global) {
//             delete globalAssociations[item.label];
//             globalRemovedCount++;
//         } else if (item.scope === vscode.ConfigurationTarget.Workspace) {
//             delete workspaceAssociations[item.label];
//             workspaceRemovedCount++;
//         }
//     }

//     try {
//         await Promise.all([
//             updateConfig(
//                 'workbench',
//                 'editorAssociations',
//                 globalAssociations,
//                 vscode.ConfigurationTarget.Global,
//             ),
//             updateConfig(
//                 'workbench',
//                 'editorAssociations',
//                 workspaceAssociations,
//                 vscode.ConfigurationTarget.Workspace,
//             ),
//         ]);
//     } catch (e) {
//         const errorMessage = e instanceof Error ? e.message : String(e);
//         logger.error(`command: failed to remove association: ${errorMessage}`);
//         vscode.window.showErrorMessage(
//             `Failed to remove association: ${errorMessage}`,
//         );
//         return;
//     }

//     const messages: string[] = [];

//     if (globalRemovedCount > 0) {
//         messages.push(`${globalRemovedCount} global`);
//     }
//     if (workspaceRemovedCount > 0) {
//         messages.push(`${workspaceRemovedCount} workspace`);
//     }

//     vscode.window.showInformationMessage(
//         `Removed ${messages.join(' and ')} association(s)`,
//     );
//     logger.debug(`command: removed ${messages.join(' and ')} association(s)`);
// }

export async function toggleFileProtection(uri: vscode.Uri, logger: Logger) {
    const stat = await vscode.workspace.fs.stat(uri);
    const isFolder = stat.type === vscode.FileType.Directory;

    const config = vscode.workspace.getConfiguration();
    const key = 'workbench.editorAssociations';

    let pattern: string;
    if (isFolder) {
        const relativePath = vscode.workspace.asRelativePath(uri);
        pattern = `${relativePath}/**`;
    } else {
        const basename = Utils.basename(uri);
        pattern = basename;
    }

    const inspected = config.inspect<Record<string, string>>(key);
    const workspaceValue = inspected?.workspaceValue ?? {};
    const updated = { ...workspaceValue };

    // Check if already protected
    const isCurrentlyProtected =
        updated[pattern] === StreamerModeEditor.viewType;

    if (isCurrentlyProtected) {
        delete updated[pattern];
    } else {
        updated[pattern] = StreamerModeEditor.viewType;
    }

    try {
        await updateConfig(
            'workbench',
            'editorAssociations',
            updated,
            vscode.ConfigurationTarget.Workspace,
        );

        if (isCurrentlyProtected) {
            logger.debug(`Unprotected: ${pattern}`);
            vscode.window.showInformationMessage(`Unprotected: ${pattern}`);
        } else {
            logger.debug(`Protected: ${pattern}`);
            vscode.window.showInformationMessage(
                `Protected in Streamer Mode: ${pattern}`,
            );
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        const action = isCurrentlyProtected ? 'unprotect' : 'protect';
        logger.error(`Failed to ${action}: ${errorMessage}`);
        vscode.window.showErrorMessage(`Failed to ${action}: ${errorMessage}`);
        return;
    }

    // Refresh if active
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (activeTab) {
        const input = activeTab.input;
        let match = false;

        if (
            input instanceof vscode.TabInputText &&
            input.uri.fsPath === uri.fsPath
        ) {
            match = true;
        } else if (
            input instanceof vscode.TabInputCustom &&
            input.uri.fsPath === uri.fsPath
        ) {
            match = true;
        }

        if (match) {
            await vscode.commands.executeCommand(
                'workbench.action.closeActiveEditor',
            );
            await vscode.commands.executeCommand('vscode.open', uri);
        }
    }
}
