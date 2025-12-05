import * as assert from 'node:assert';

import * as vscode from 'vscode';

import { StreamerModeEditor } from '../editor';
import type { StreamerModeFileDecorationProvider } from '../file-decorator';
import { createEditorAssociationsHandler } from '../listeners';

suite('Listeners Test Suite', () => {
    let mockFileDecorator: StreamerModeFileDecorationProvider;
    let refreshCalledWith: string[] | undefined;

    setup(() => {
        refreshCalledWith = undefined;
        mockFileDecorator = {
            refresh: (changedKeys?: string[]) => {
                refreshCalledWith = changedKeys;
            },
            dispose: () => {
                // mock
            },
            onDidChangeFileDecorations: new vscode.EventEmitter<
                vscode.Uri | vscode.Uri[] | undefined
            >().event,
            provideFileDecoration: async () => undefined,
        } as unknown as StreamerModeFileDecorationProvider;
    });

    teardown(async () => {
        // Reset configuration
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                undefined,
                vscode.ConfigurationTarget.Global,
            );
    });

    test('createEditorAssociationsHandler should detect added associations', async () => {
        // Initial state: empty associations
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                {},
                vscode.ConfigurationTarget.Global,
            );

        const handler = createEditorAssociationsHandler(mockFileDecorator);

        // Update config to add an association
        const newAssociations = {
            '*.txt': StreamerModeEditor.viewType,
        };
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                newAssociations,
                vscode.ConfigurationTarget.Global,
            );

        // Mock event
        const mockEvent = {
            affectsConfiguration: (section: string) =>
                section === 'workbench.editorAssociations',
        } as vscode.ConfigurationChangeEvent;

        // Trigger handler
        handler(mockEvent);

        assert.deepStrictEqual(refreshCalledWith, ['*.txt']);
    });

    test('createEditorAssociationsHandler should detect removed associations', async () => {
        // Initial state: one association
        const initialAssociations = {
            '*.log': StreamerModeEditor.viewType,
        };
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                initialAssociations,
                vscode.ConfigurationTarget.Global,
            );

        const handler = createEditorAssociationsHandler(mockFileDecorator);

        // Update config to remove the association
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                {},
                vscode.ConfigurationTarget.Global,
            );

        // Mock event
        const mockEvent = {
            affectsConfiguration: (section: string) =>
                section === 'workbench.editorAssociations',
        } as vscode.ConfigurationChangeEvent;

        // Trigger handler
        handler(mockEvent);

        assert.deepStrictEqual(refreshCalledWith, ['*.log']);
    });

    test('createEditorAssociationsHandler should ignore unrelated changes', async () => {
        // Initial state
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                {},
                vscode.ConfigurationTarget.Global,
            );

        const handler = createEditorAssociationsHandler(mockFileDecorator);

        // Update config with unrelated association
        const newAssociations = {
            '*.png': 'default.image-viewer',
        };
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                newAssociations,
                vscode.ConfigurationTarget.Global,
            );

        // Mock event
        const mockEvent = {
            affectsConfiguration: (section: string) =>
                section === 'workbench.editorAssociations',
        } as vscode.ConfigurationChangeEvent;

        // Trigger handler
        handler(mockEvent);

        assert.strictEqual(refreshCalledWith, undefined);
    });

    test('createEditorAssociationsHandler should handle multiple changes', async () => {
        // Initial state
        const initialAssociations = {
            '*.old': StreamerModeEditor.viewType,
            '*.keep': StreamerModeEditor.viewType,
        };
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                initialAssociations,
                vscode.ConfigurationTarget.Global,
            );

        const handler = createEditorAssociationsHandler(mockFileDecorator);

        // Update config: remove one, add one, keep one
        const newAssociations = {
            '*.keep': StreamerModeEditor.viewType,
            '*.new': StreamerModeEditor.viewType,
        };
        await vscode.workspace
            .getConfiguration('workbench')
            .update(
                'editorAssociations',
                newAssociations,
                vscode.ConfigurationTarget.Global,
            );

        // Mock event
        const mockEvent = {
            affectsConfiguration: (section: string) =>
                section === 'workbench.editorAssociations',
        } as vscode.ConfigurationChangeEvent;

        // Trigger handler
        handler(mockEvent);

        // Should contain both removed and added keys
        assert.ok(refreshCalledWith?.includes('*.old'));
        assert.ok(refreshCalledWith?.includes('*.new'));
        assert.strictEqual(refreshCalledWith?.length, 2);
    });
});
