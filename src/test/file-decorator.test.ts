import * as assert from 'node:assert';

import * as vscode from 'vscode';

import { StreamerModeFileDecorationProvider } from '../file-decorator';

suite('File Decorator Test Suite', () => {
    let provider: StreamerModeFileDecorationProvider;

    setup(() => {
        provider = new StreamerModeFileDecorationProvider();
    });

    teardown(() => {
        provider.dispose();
    });

    test('should provide decoration for .env file when enabled', async () => {
        // Mock settings by updating configuration (integration test style)
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('workbench').update(
            'editorAssociations',
            {
                '**/*.env': 'streamer-mode',
            },
            vscode.ConfigurationTarget.Global,
        );

        // Force provider to reload patterns since it doesn't listen to config changes automatically in the test environment unless we trigger it
        // However, the provider loads patterns in constructor. We might need to create a new provider instance or call a method to reload.
        // The provider has a refresh method but it takes changedKeys.
        // Let's create a new provider instance after config update to ensure it loads the new config.
        provider.dispose();
        provider = new StreamerModeFileDecorationProvider();

        const uri = vscode.Uri.file('/path/to/.env');
        const token = new vscode.CancellationTokenSource().token;

        const decoration = await provider.provideFileDecoration(uri, token);

        assert.ok(decoration, 'Decoration should be provided for .env file');
        assert.strictEqual(decoration?.badge, 'S');
        assert.strictEqual(decoration?.tooltip, 'Protected in Streamer Mode');
    });

    test('should NOT provide decoration when disabled', async () => {
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', false, vscode.ConfigurationTarget.Global);

        const uri = vscode.Uri.file('/path/to/.env');
        const token = new vscode.CancellationTokenSource().token;

        const decoration = await provider.provideFileDecoration(uri, token);

        assert.strictEqual(
            decoration,
            undefined,
            'Decoration should NOT be provided when disabled',
        );
    });

    test('should NOT provide decoration for non-matching file', async () => {
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);

        const uri = vscode.Uri.file('/path/to/readme.md');
        const token = new vscode.CancellationTokenSource().token;

        const decoration = await provider.provideFileDecoration(uri, token);

        assert.strictEqual(
            decoration,
            undefined,
            'Decoration should NOT be provided for non-matching file',
        );
    });
});
