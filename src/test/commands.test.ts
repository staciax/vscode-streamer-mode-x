import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as vscode from 'vscode';

import { toggleFileProtection } from '../commands';
import { StreamerModeEditor } from '../editor';
import type Logger from '../logger';

suite('Commands Test Suite', () => {
    let logger: Logger;
    let tempFileUri: vscode.Uri;

    setup(async () => {
        logger = {
            info: () => {
                /* mock */
            },
            debug: () => {
                /* mock */
            },
            warn: () => {
                /* mock */
            },
            error: () => {
                /* mock */
            },
        } as unknown as Logger;

        // Use a file in the workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        // Ensure workspace directory exists (it should, but just in case)
        if (!fs.existsSync(workspaceFolder.uri.fsPath)) {
            fs.mkdirSync(workspaceFolder.uri.fsPath, { recursive: true });
        }

        tempFileUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test.txt');
        await vscode.workspace.fs.writeFile(
            tempFileUri,
            Buffer.from('test content'),
        );
    });

    teardown(async () => {
        // Cleanup file
        try {
            await vscode.workspace.fs.delete(tempFileUri);
        } catch (_e) {
            // Ignore if file doesn't exist
        }

        // Reset configuration
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                undefined,
                vscode.ConfigurationTarget.Workspace,
            );
    });

    test('toggleFileProtection should use active editor URI if no URI provided', async () => {
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);

        // Open the temp file
        const doc = await vscode.workspace.openTextDocument(tempFileUri);
        await vscode.window.showTextDocument(doc);

        const initialConfig = vscode.workspace
            .getConfiguration('workbench')
            .get('editorAssociations');
        await toggleFileProtection(undefined, logger);
        const finalConfig = vscode.workspace
            .getConfiguration('workbench')
            .get('editorAssociations');

        assert.deepStrictEqual(
            initialConfig,
            finalConfig,
            'Config should not change if no URI provided',
        );
    });

    test('should protect a file when toggled on', async () => {
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);

        await toggleFileProtection(tempFileUri, logger);

        const config = vscode.workspace
            .getConfiguration('workbench')
            .get<Record<string, string>>('editorAssociations');
        const pattern = path.basename(tempFileUri.fsPath);

        assert.strictEqual(
            config?.[pattern],
            StreamerModeEditor.viewType,
            'File should be associated with Streamer Mode',
        );
    });

    test('should unprotect a file when toggled off', async () => {
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);
        const pattern = path.basename(tempFileUri.fsPath);

        // First protect it
        await toggleFileProtection(tempFileUri, logger);

        // Wait for config update to propagate
        await new Promise((resolve) => setTimeout(resolve, 500));

        let config = vscode.workspace
            .getConfiguration('workbench')
            .get<Record<string, string>>('editorAssociations');
        assert.strictEqual(
            config?.[pattern],
            StreamerModeEditor.viewType,
            'File should be protected initially',
        );

        // Then unprotect it
        await toggleFileProtection(tempFileUri, logger);

        // Wait for config update to propagate
        await new Promise((resolve) => setTimeout(resolve, 500));

        config = vscode.workspace
            .getConfiguration('workbench')
            .get<Record<string, string>>('editorAssociations');
        assert.strictEqual(
            config?.[pattern],
            undefined,
            'File should be unprotected',
        );
    });
});
