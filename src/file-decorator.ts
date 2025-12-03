import vscode from 'vscode';

import { StreamerModeEditor } from './editor';
import { getConfig, getSettings } from './settings';

export class FileDecorator implements vscode.FileDecorationProvider {
    private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<
        vscode.Uri | vscode.Uri[]
    >();
    readonly onDidChangeFileDecorations =
        this._onDidChangeFileDecorations.event;

    private hiddenPatterns = new Set<string>();

    constructor() {
        this.loadHiddenPatterns();
    }

    private loadHiddenPatterns() {
        const associations = getConfig<Record<string, string>>(
            'workbench',
            'editorAssociations',
            {},
        );

        this.hiddenPatterns.clear();
        for (const [pattern, value] of Object.entries(associations)) {
            if (value === StreamerModeEditor.viewType) {
                this.hiddenPatterns.add(pattern);
            }
        }
    }

    public refresh() {
        this.loadHiddenPatterns();
        // biome-ignore lint/suspicious/noExplicitAny: VS Code API requires passing undefined to fire for all resources
        this._onDidChangeFileDecorations.fire(undefined as any);
    }

    async provideFileDecoration(
        uri: vscode.Uri,
        token: vscode.CancellationToken,
    ): Promise<vscode.FileDecoration | undefined> {
        const cancelPromise = new Promise<undefined>((resolve) => {
            token.onCancellationRequested(() => resolve(undefined));
        });

        const providePromise = this._provideFileDecoration(uri);

        return Promise.any([cancelPromise, providePromise]);
    }

    private async _provideFileDecoration(
        uri: vscode.Uri,
    ): Promise<vscode.FileDecoration | undefined> {
        const basename = vscode.workspace.asRelativePath(uri);
        const shouldPropagate = getSettings().decoration.propagate;

        for (const pattern of this.hiddenPatterns) {
            if (this.matchPattern(basename, pattern)) {
                return {
                    badge: 'S',
                    tooltip: 'Hidden in Streamer Mode',
                    color: new vscode.ThemeColor('streamerMode.hiddenFile'),
                    propagate: shouldPropagate,
                };
            }
        }

        return undefined;
    }

    private matchPattern(path: string, pattern: string): boolean {
        // Simple glob matching
        if (pattern.startsWith('*')) {
            // Extension match: *.txt
            return path.endsWith(pattern.substring(1));
        } else if (pattern.includes('/')) {
            // Folder pattern: folder/**
            const folderPath = pattern.replace('/**', '');
            return path.startsWith(folderPath);
        } else {
            // Exact filename match
            return path.endsWith(pattern) || path === pattern;
        }
    }

    public static register(context: vscode.ExtensionContext): FileDecorator {
        const decorator = new FileDecorator();
        context.subscriptions.push(
            vscode.window.registerFileDecorationProvider(decorator),
        );
        return decorator;
    }
}
