import vscode from 'vscode';

import { toggleFileProtection } from './commands';
import { StreamerModeEditor } from './editor';
import { StreamerModeFileDecorationProvider } from './file-decorator';
import {
    createEditorAssociationsHandler,
    streamerModeConfigChangeHandler,
} from './listeners';
import Logger from './logger';
import { PollingService } from './polling';
import { getSettings } from './settings';
import { StatusBar } from './status-bar';

export async function activate(context: vscode.ExtensionContext) {
    const logger = new Logger('VSCode Streamer Mode');

    logger.debug('extension: activating');

    const statusBar = new StatusBar(logger);

    StreamerModeEditor.register(context, statusBar, logger);
    const pollingService = new PollingService(logger);

    // Check immediately
    await pollingService.check();
    const updatedSettings = getSettings();
    statusBar.update(updatedSettings.enabled);
    pollingService.start();

    context.subscriptions.push(pollingService);

    const fileDecorator = StreamerModeFileDecorationProvider.register(context);

    const editorAssociationsHandler =
        createEditorAssociationsHandler(fileDecorator);

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            streamerModeConfigChangeHandler(e, statusBar, fileDecorator);
            editorAssociationsHandler(e);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'streamer-mode.toggleFileProtection',
            async (uri?: vscode.Uri) => {
                await toggleFileProtection(uri, logger);
            },
        ),
    );

    logger.debug('extension: activated successfully');
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional empty deactivate
export function deactivate() {}
