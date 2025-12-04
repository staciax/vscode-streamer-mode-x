import vscode from 'vscode';

import type Logger from './logger';
import { getSettings, updateConfig } from './settings';
import { detectStreamingApps } from './utils/streamer';

export class PollingService implements vscode.Disposable {
    private interval: NodeJS.Timeout | undefined;
    private isChecking = false;
    private readonly detector: (additionalApps?: string[]) => Promise<boolean>;

    private disposables: vscode.Disposable[] = [];

    constructor(
        private logger: Logger,
        detector?: (additionalApps?: string[]) => Promise<boolean>,
    ) {
        this.detector = detector ?? detectStreamingApps;

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

    public start(enabledOverride?: boolean) {
        this.stop();

        const settings = getSettings();

        if (!settings.autoDetected.enable) {
            return;
        }

        const activeInterval = settings.autoDetected.interval.active;
        const inactiveInterval = settings.autoDetected.interval.inactive;

        const isEnabled = enabledOverride ?? settings.enabled;

        const delay = (isEnabled ? activeInterval : inactiveInterval) * 1000;

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
        if (this.isChecking) {
            return;
        }

        this.isChecking = true;

        try {
            const settings = getSettings();

            // Check config again in case 'autoDetected.enable' was disabled since the last interval.
            // This prevents unnecessary polling if the feature is turned off between intervals.
            // Note: start() handles interval timing, but not this enable/disable check.
            if (!settings.autoDetected.enable) {
                return;
            }

            const isStreaming = await this.detector(
                settings.autoDetected.additionalApps,
            );
            if (isStreaming && !settings.enabled) {
                await updateConfig('streamer-mode', 'enabled', true);
                vscode.window.showInformationMessage(
                    'Streamer Mode enabled automatically (Streaming app detected)',
                );
                this.logger.info('polling: auto-enabled streamer mode');
                this.start(true);
            } else if (!isStreaming && settings.enabled) {
                await updateConfig('streamer-mode', 'enabled', false);
                vscode.window.showInformationMessage(
                    'Streamer Mode disabled automatically (No streaming app detected)',
                );
                this.logger.info('polling: auto-disabled streamer mode');
                this.start(false);
            }
        } catch (error) {
            this.logger.error(
                `polling: failed to check streaming apps: ${error}`,
            );
        } finally {
            this.isChecking = false;
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
