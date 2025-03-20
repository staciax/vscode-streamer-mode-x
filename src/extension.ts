import type * as vscode from 'vscode';

import { StreamerModeEditor } from '@/editor';
import { StatusBar } from '@/status-bar';

export function activate(context: vscode.ExtensionContext) {
    const statusBar = new StatusBar();
    context.subscriptions.push(StreamerModeEditor.register(context, statusBar));
}

export function deactivate() {}
