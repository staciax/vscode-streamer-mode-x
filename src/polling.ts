import vscode from 'vscode';

import type Logger from './logger';
import { getSettings, updateConfig } from './settings';
import { detectStreamingApps } from './utils/streamer';

export class PollingService implements vscode.Disposable {
    private interval: NodeJS.Timeout | undefined;
    private readonly logger: Logger;

    private disposables: vscode.Disposable[] = [];

    constructor(logger: Logger) {
        this.logger = logger;

        vscode.workspace.onDidChangeConfiguration(
            this.onConfigurationChanged,
            this,
            this.disposables,
        );
    }

    private onConfigurationChanged(e: vscode.ConfigurationChangeEvent) {
        if (
            e.affectsConfiguration('streamer-mode.enabled') ||
            e.affectsConfiguration('streamer-mode.autoDetected')
        ) {
            this.start();
        }
    }

    public start() {
        this.stop();

        const settings = getSettings();

        if (!settings.autoDetected.enable) {
            return;
        }

        const activeInterval = settings.autoDetected.interval.active;
        const inactiveInterval = settings.autoDetected.interval.inactive;

        const delay =
            (settings.enabled ? activeInterval : inactiveInterval) * 1000;

        this.interval = setInterval(() => this.check(), delay);
        this.logger.debug(`polling: interval set to ${delay}ms`);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    public async check() {
        const settings = getSettings();

        // Double check config in case it changed, but start() already handles the interval
        if (!settings.autoDetected.enable) {
            return;
        }

        try {
            const isStreaming = await detectStreamingApps(
                settings.autoDetected.additionalApps,
            );
            if (isStreaming && !settings.enabled) {
                await updateConfig('streamer-mode', 'enabled', true);
                vscode.window.showInformationMessage(
                    'Streamer Mode enabled automatically (Streaming app detected)',
                );
                this.logger.info('polling: auto-enabled streamer mode');
            } else if (!isStreaming && settings.enabled) {
                await updateConfig('streamer-mode', 'enabled', false);
                vscode.window.showInformationMessage(
                    'Streamer Mode disabled automatically (No streaming app detected)',
                );
                this.logger.info('polling: auto-disabled streamer mode');
            }
        } catch (error) {
            this.logger.error(
                `polling: failed to check streaming apps: ${error}`,
            );
        }
    }

    public dispose() {
        this.stop();
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
    }
}
