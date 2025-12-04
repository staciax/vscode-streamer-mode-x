import * as assert from 'node:assert';

import * as vscode from 'vscode';

import type Logger from '../logger';
import { PollingService } from '../polling';

suite('Polling Service Test Suite', () => {
    let logger: Logger;
    let pollingService: PollingService;
    let detectorMock: (additionalApps?: string[]) => Promise<boolean>;

    setup(() => {
        logger = {
            info: () => {},
            debug: () => {},
            warn: () => {},
            error: () => {},
        } as unknown as Logger;
    });

    teardown(() => {
        if (pollingService) {
            pollingService.dispose();
        }
    });

    test('should auto-enable streamer mode when streaming app detected', async () => {
        // Mock settings: auto-detect enabled, streamer mode disabled
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update(
                'autoDetected.enable',
                true,
                vscode.ConfigurationTarget.Global,
            );
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', false, vscode.ConfigurationTarget.Global);

        detectorMock = async () => true; // Simulate streaming app detected
        pollingService = new PollingService(logger, detectorMock);

        await pollingService.check();

        const enabled = vscode.workspace
            .getConfiguration('streamer-mode')
            .get('enabled');
        assert.strictEqual(enabled, true, 'Streamer mode should be enabled');
    });

    test('should auto-disable streamer mode when NO streaming app detected', async () => {
        // Mock settings: auto-detect enabled, streamer mode enabled
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update(
                'autoDetected.enable',
                true,
                vscode.ConfigurationTarget.Global,
            );
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);

        detectorMock = async () => false; // Simulate NO streaming app detected
        pollingService = new PollingService(logger, detectorMock);

        await pollingService.check();

        const enabled = vscode.workspace
            .getConfiguration('streamer-mode')
            .get('enabled');
        assert.strictEqual(enabled, false, 'Streamer mode should be disabled');
    });

    test('should NOT change state if detection matches current state', async () => {
        // Mock settings: auto-detect enabled, streamer mode enabled
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update(
                'autoDetected.enable',
                true,
                vscode.ConfigurationTarget.Global,
            );
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', true, vscode.ConfigurationTarget.Global);

        detectorMock = async () => true; // Simulate streaming app detected (matches enabled state)
        pollingService = new PollingService(logger, detectorMock);

        await pollingService.check();

        const enabled = vscode.workspace
            .getConfiguration('streamer-mode')
            .get('enabled');
        assert.strictEqual(
            enabled,
            true,
            'Streamer mode should remain enabled',
        );
    });

    test('should NOT change state if auto-detect is disabled', async () => {
        // Mock settings: auto-detect DISABLED, streamer mode disabled
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update(
                'autoDetected.enable',
                false,
                vscode.ConfigurationTarget.Global,
            );
        await vscode.workspace
            .getConfiguration('streamer-mode')
            .update('enabled', false, vscode.ConfigurationTarget.Global);

        detectorMock = async () => true; // Simulate streaming app detected
        pollingService = new PollingService(logger, detectorMock);

        await pollingService.check();

        const enabled = vscode.workspace
            .getConfiguration('streamer-mode')
            .get('enabled');
        assert.strictEqual(
            enabled,
            false,
            'Streamer mode should remain disabled because auto-detect is off',
        );
    });
});
