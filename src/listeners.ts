import vscode from 'vscode';

import { StreamerModeEditor } from './editor';
import type { StreamerModeFileDecorationProvider } from './file-decorator';
import { getSettings } from './settings';
import type { StatusBar } from './status-bar';

export function streamerModeConfigChangeHandler(
    e: vscode.ConfigurationChangeEvent,
    statusBar: StatusBar,
    fileDecorator: StreamerModeFileDecorationProvider,
) {
    if (e.affectsConfiguration('streamer-mode.enabled')) {
        const settings = getSettings();
        statusBar.update(settings.enabled);
        fileDecorator.refresh();
    }
    // e.affectsConfiguration('streamer-mode.autoDetected')
}

export function createEditorAssociationsHandler(
    fileDecorator: StreamerModeFileDecorationProvider,
): (e: vscode.ConfigurationChangeEvent) => void {
    let previousAssociations =
        vscode.workspace
            .getConfiguration()
            .get<Record<string, string>>('workbench.editorAssociations') || {};

    return (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('workbench.editorAssociations')) {
            const config = vscode.workspace.getConfiguration();
            const currentAssociations =
                config.get<Record<string, string>>(
                    'workbench.editorAssociations',
                ) || {};

            // Check if any association involving StreamerModeEditor.viewType has changed
            const changedKeys: string[] = [];

            for (const [key, value] of Object.entries(currentAssociations)) {
                if (
                    value === StreamerModeEditor.viewType &&
                    previousAssociations[key] !== value
                ) {
                    changedKeys.push(key);
                }
            }

            for (const [key, value] of Object.entries(previousAssociations)) {
                if (
                    value === StreamerModeEditor.viewType &&
                    currentAssociations[key] !== value
                ) {
                    changedKeys.push(key);
                }
            }

            if (changedKeys.length > 0) {
                fileDecorator.refresh(changedKeys);
            }

            previousAssociations = currentAssociations;
        }
    };
}
