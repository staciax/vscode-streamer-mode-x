import vscode from 'vscode';

import { toggleFileProtection } from './commands';
import { StreamerModeEditor } from './editor';
import { FileDecorator } from './file-decorator';
import {
    createEditorAssociationsHandler,
    handleStreamerModeConfigChange,
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

    const pollingService = new PollingService(editor, logger);

    // Check immediately
    await pollingService.check();
    pollingService.start();

    context.subscriptions.push(pollingService);

    const fileDecorator = FileDecorator.register(context);

    const handleEditorAssociations =
        createEditorAssociationsHandler(fileDecorator);

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            handleStreamerModeConfigChange(e, statusBar, editor, fileDecorator);
            handleEditorAssociations(e);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'streamer-mode.toggleFileProtection',
            (uri?: vscode.Uri) => toggleFileProtection(uri, logger),
        ),
    );

    logger.debug('extension: activated successfully');
}

// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional empty deactivate
export function deactivate() {}
