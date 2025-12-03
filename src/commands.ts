import vscode from 'vscode';
import { Utils } from 'vscode-uri';

import { StreamerModeEditor } from './editor';
import type Logger from './logger';
import { getSettings, updateConfig } from './settings';

export async function toggleFileProtection(
    uri: vscode.Uri | undefined,
    logger: Logger,
) {
    const settings = getSettings();

    if (!settings.enabled) {
        vscode.window.showInformationMessage(
            'Streamer Mode is disabled. Enable it to use file protection.',
        );
        return;
    }

    if (!uri) {
        vscode.window.showInformationMessage('No file selected');
        return;
    }

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
