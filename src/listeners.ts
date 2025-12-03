import vscode from 'vscode';

import { StreamerModeEditor } from './editor';
import type { FileDecorator } from './file-decorator';
import type { PollingService } from './polling';
import type { StatusBar } from './status-bar';

export function handleStreamerModeConfigChange(
    e: vscode.ConfigurationChangeEvent,
    pollingService: PollingService,
    statusBar: StatusBar,
    editor: StreamerModeEditor,
) {
    if (
        e.affectsConfiguration('streamer-mode.enabled') ||
        e.affectsConfiguration('streamer-mode.autoDetected')
    ) {
        pollingService.start();
        statusBar.update(editor.isEnable);
    }
}

export function createEditorAssociationsHandler(
    fileDecorator: FileDecorator,
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
            const hasChanged =
                Object.entries(currentAssociations).some(
                    ([key, value]) =>
                        value === StreamerModeEditor.viewType &&
                        previousAssociations[key] !== value,
                ) ||
                Object.entries(previousAssociations).some(
                    ([key, value]) =>
                        value === StreamerModeEditor.viewType &&
                        currentAssociations[key] !== value,
                );

            if (hasChanged) {
                fileDecorator.refresh();
            }

            previousAssociations = currentAssociations;
        }
    };
}
