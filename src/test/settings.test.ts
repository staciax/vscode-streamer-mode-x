import * as assert from 'node:assert';

import * as vscode from 'vscode';

import { getConfig, getSettings, updateConfig } from '../settings';

suite('Settings Test Suite', () => {
    setup(async () => {
        // Reset configuration before each test to ensure clean state
        const config = vscode.workspace.getConfiguration('streamer-mode');
        await config.update(
            'enabled',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.enable',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.interval.active',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.interval.inactive',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.additionalApps',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'decoration.propagate',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
    });

    teardown(async () => {
        // Reset configuration after each test
        const config = vscode.workspace.getConfiguration('streamer-mode');
        await config.update(
            'enabled',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.enable',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.interval.active',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.interval.inactive',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.additionalApps',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'decoration.propagate',
            undefined,
            vscode.ConfigurationTarget.Global,
        );
    });

    test('getSettings should return default values', () => {
        const settings = getSettings();
        assert.strictEqual(settings.enabled, true);
        assert.strictEqual(settings.autoDetected.enable, false);
        assert.strictEqual(settings.autoDetected.interval.active, 60);
        assert.strictEqual(settings.autoDetected.interval.inactive, 30);
        assert.deepStrictEqual(settings.autoDetected.additionalApps, []);
        assert.strictEqual(settings.decoration.propagate, true);
    });

    test('getSettings should return configured values', async () => {
        const config = vscode.workspace.getConfiguration('streamer-mode');
        await config.update(
            'enabled',
            false,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.enable',
            true,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.interval.active',
            120,
            vscode.ConfigurationTarget.Global,
        );
        await config.update(
            'autoDetected.additionalApps',
            ['obs'],
            vscode.ConfigurationTarget.Global,
        );

        const settings = getSettings();
        assert.strictEqual(settings.enabled, false);
        assert.strictEqual(settings.autoDetected.enable, true);
        assert.strictEqual(settings.autoDetected.interval.active, 120);
        assert.deepStrictEqual(settings.autoDetected.additionalApps, ['obs']);
    });

    test('getConfig should return configured value', async () => {
        const config = vscode.workspace.getConfiguration('streamer-mode');
        await config.update(
            'enabled',
            false,
            vscode.ConfigurationTarget.Global,
        );

        const value = getConfig<boolean>('streamer-mode', 'enabled');
        assert.strictEqual(value, false);
    });

    test('getConfig should return default value if key is missing', () => {
        const value = getConfig<string>(
            'streamer-mode',
            'nonExistentKey',
            'defaultValue',
        );
        assert.strictEqual(value, 'defaultValue');
    });

    test('getConfig should return undefined if key is missing and no default provided', () => {
        const value = getConfig<string>('streamer-mode', 'nonExistentKey');
        assert.strictEqual(value, undefined);
    });

    test('updateConfig should update configuration', async () => {
        await updateConfig('streamer-mode', 'enabled', false);
        const config = vscode.workspace.getConfiguration('streamer-mode');
        assert.strictEqual(config.get('enabled'), false);
    });
});
