import * as assert from 'node:assert';

import * as vscode from 'vscode';

import { StreamerModeEditor } from '../editor';
import type { StreamerModeFileDecorationProvider } from '../file-decorator';
import {
    createEditorAssociationsHandler,
    streamerModeConfigChangeHandler,
} from '../listeners';
import type { StatusBar } from '../status-bar';

suite('Listeners Test Suite', () => {
    let mockFileDecorator: StreamerModeFileDecorationProvider;
    let refreshCalledWith: string[] | undefined;
    let refreshCallCount: number;

    setup(() => {
        refreshCalledWith = undefined;
        refreshCallCount = 0;
        mockFileDecorator = {
            refresh: (changedKeys?: string[]) => {
                refreshCallCount++;
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
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', undefined, vscode.ConfigurationTarget.Global);
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
        assert.strictEqual(refreshCallCount, 1);
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
        assert.strictEqual(refreshCallCount, 1);
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
        assert.strictEqual(refreshCallCount, 0);
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
        assert.strictEqual(refreshCallCount, 1);
    });

    test('createEditorAssociationsHandler should refresh even when disabled', async () => {
        // Disable streamer mode
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', false, vscode.ConfigurationTarget.Global);

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
        assert.strictEqual(refreshCallCount, 1);
    });

    test('streamerModeConfigChangeHandler should refresh when disabled', async () => {
        // Enable streamer mode initially
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);

        // Mock status bar
        const mockStatusBar = {
            update: (_enabled: boolean) => {
                // mock
            },
        } as StatusBar;

        // Trigger handler with disable event
        // We need to actually change the config so getSettings() returns false
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', false, vscode.ConfigurationTarget.Global);

        const mockEvent = {
            affectsConfiguration: (section: string) =>
                section === 'streamer-mode.enabled',
        } as vscode.ConfigurationChangeEvent;

        streamerModeConfigChangeHandler(
            mockEvent,
            mockStatusBar,
            mockFileDecorator,
        );

        // refresh should be called (with undefined args)
        assert.strictEqual(refreshCallCount, 1);
        assert.strictEqual(refreshCalledWith, undefined);
    });
});
