import { minimatch } from 'minimatch';
import vscode from 'vscode';

import { StreamerModeEditor } from './editor';
import { getConfig, getSettings } from './settings';

export class StreamerModeFileDecorationProvider
    implements vscode.FileDecorationProvider
{
    private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<
        vscode.Uri | vscode.Uri[] | undefined
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

    public refresh(_changedKeys?: string[]) {
        // TODO: Use changedKeys to optimize refresh by only updating affected files
        this.loadHiddenPatterns();

        this._onDidChangeFileDecorations.fire(undefined);
    }

    async provideFileDecoration(
        uri: vscode.Uri,
        token: vscode.CancellationToken,
    ): Promise<vscode.FileDecoration | undefined> {
        const cancelPromise = new Promise<undefined>((resolve) => {
            token.onCancellationRequested(() => resolve(undefined));
        });

        const providePromise = this._provideFileDecoration(uri);

        return Promise.race([cancelPromise, providePromise]);
    }

    private async _provideFileDecoration(
        uri: vscode.Uri,
    ): Promise<vscode.FileDecoration | undefined> {
        const settings = getSettings();

        if (!settings.enabled) {
            return undefined;
        }

        const basename = vscode.workspace.asRelativePath(uri);
        const shouldPropagate = settings.decoration.propagate;

        for (const pattern of this.hiddenPatterns) {
            if (this.matchPattern(basename, pattern)) {
                return {
                    badge: 'S',
                    tooltip: 'Protected in Streamer Mode',
                    color: new vscode.ThemeColor('streamerMode.hiddenFile'),
                    propagate: shouldPropagate,
                };
            }
        }

        return undefined;
    }

    private matchPattern(path: string, pattern: string): boolean {
        return minimatch(path, pattern, { dot: true });
    }

    public dispose() {
        this._onDidChangeFileDecorations.dispose();
    }

    public static register(
        context: vscode.ExtensionContext,
    ): StreamerModeFileDecorationProvider {
        const decorator = new StreamerModeFileDecorationProvider();
        context.subscriptions.push(
            vscode.window.registerFileDecorationProvider(decorator),
        );
        return decorator;
    }
}
