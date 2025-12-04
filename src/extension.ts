import vscode from 'vscode';

import { toggleFileProtection } from './commands';
import { StreamerModeEditor } from './editor';
import { FileDecorator } from './file-decorator';
import {
    createEditorAssociationsHandler,
    streamerModeConfigChangeHandler,
} from './listeners';
import Logger from './logger';
import { PollingService } from './polling';
import { StatusBar } from './status-bar';

export async function activate(context: vscode.ExtensionContext) {
    const logger = new Logger('VSCode Streamer Mode');

    logger.debug('extension: activating');

    const statusBar = new StatusBar(logger);

    const editor = StreamerModeEditor.register(context, statusBar, logger);
    statusBar.update(editor.isEnable);

    const pollingService = new PollingService(logger);

    // Check immediately
    await pollingService.check();
    pollingService.start();

    context.subscriptions.push(pollingService);

    const fileDecorator = FileDecorator.register(context);

    const editorAssociationsHandler =
        createEditorAssociationsHandler(fileDecorator);

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            streamerModeConfigChangeHandler(
                e,
                statusBar,
                editor,
                fileDecorator,
            );
            editorAssociationsHandler(e);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'streamer-mode.toggleFileProtection',
            async (uri?: vscode.Uri) => {
                const targetUri =
                    uri ?? vscode.window.activeTextEditor?.document.uri;
                await toggleFileProtection(targetUri, logger);
            },
        ),
    );

    logger.debug('extension: activated successfully');
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional empty deactivate
export function deactivate() {}
