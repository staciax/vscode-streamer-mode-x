import * as vscode from 'vscode';

export class StatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            'vscode-streamer-mode-x.status',
            vscode.StatusBarAlignment.Left,
            -1
        );
        this.statusBarItem.text = '$(check) Streamer Mode';
        this.statusBarItem.command = 'vscode-streamer-mode-x.toggle';
        this.statusBarItem.show();
    }

    public update(enable: boolean): void {
        this.statusBarItem.text = enable
            ? '$(check) Streamer Mode'
            : '$(x) Streamer Mode';
    }

    public hide() {
        this.statusBarItem.hide();
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
