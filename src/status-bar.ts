import * as vscode from 'vscode';

import type Logger from '@/logger';

export class StatusBar implements vscode.Disposable {
    /**
     * Logger for Status Bar
     * */
    private readonly logger: Logger;

    /**
     * The status bar item
     */
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor(logger: Logger) {
        this.logger = logger;
        this.statusBarItem = vscode.window.createStatusBarItem(
            'vscode-streamer-mode-x.status',
            vscode.StatusBarAlignment.Left,
            -1
        );
        this.statusBarItem.text = '$(check) Streamer Mode';
        this.statusBarItem.command = 'vscode-streamer-mode-x.toggle';
        this.show();

        this.logger.debug('status bar: initialized');
    }

    public update(enable: boolean): void {
        this.statusBarItem.text = enable
            ? '$(check) Streamer Mode'
            : '$(x) Streamer Mode';
    }

    public show() {
        this.statusBarItem.show();
        // this.logger.debug('status bar: item shown');
    }

    public hide() {
        this.statusBarItem.hide();
        this.logger.debug('status bar: item hidden');
    }

    public dispose(): void {
        this.statusBarItem.dispose();
        this.logger.debug('status bar: item disposed');
    }
}
