import vscode from 'vscode';

import { addAssociation, removeAssociation } from './commands';
import { StreamerModeEditor } from './editor';
import { FileDecorator } from './file-decorator';
import Logger from './logger';
import { PollingService } from './polling';
import { StatusBar } from './status-bar';
import { detectStreamingApps } from './utils/streamer';

export async function activate(context: vscode.ExtensionContext) {
    const logger = new Logger('VSCode Streamer Mode');

    try {
        console.log(`Streaming app running: ${await detectStreamingApps()}`);
    } catch (error) {
        logger.error(`Failed to check streaming apps: ${error}`);
    }

    logger.debug('extension: activating');

    const statusBar = new StatusBar(logger);

    const editor = StreamerModeEditor.register(context, statusBar, logger);
    statusBar.update(editor.isEnable);

    const pollingService = new PollingService(editor, logger);

    // Check immediately
    pollingService.check();
    pollingService.start();

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration('streamer-mode.enabled') ||
                e.affectsConfiguration('streamer-mode.autoDetected')
            ) {
                pollingService.start();
                statusBar.update(editor.isEnable);
            }
        }),
    );

    context.subscriptions.push(pollingService);

    FileDecorator.register(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('streamer-mode.addAssociation', () =>
            addAssociation(logger),
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('streamer-mode.removeAssociation', () =>
            removeAssociation(logger),
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-streamer-mode-x.toggleHideFile',
            async (uri: vscode.Uri) => {
                if (!uri) {
                    return;
                }

                console.log(`Hide file command invoked for: ${uri.fsPath}`);
            },
        ),
    );

    logger.debug('extension: activated successfully');
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional empty deactivate
export function deactivate() {}
