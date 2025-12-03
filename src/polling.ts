import vscode from 'vscode';

import type { StreamerModeEditor } from './editor';
import type Logger from './logger';
import { getSettings } from './settings';
import { detectStreamingApps } from './utils/streamer';

export class PollingService implements vscode.Disposable {
    private interval: NodeJS.Timeout | undefined;
    private readonly editor: StreamerModeEditor;
    private readonly logger: Logger;

    private disposables: vscode.Disposable[] = [];

    constructor(editor: StreamerModeEditor, logger: Logger) {
        this.editor = editor;
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

        // Check if auto-detection is enabled
        if (!settings.autoDetected.enable) {
            return;
        }

        const activeInterval = settings.autoDetected.interval.active;
        const inactiveInterval = settings.autoDetected.interval.inactive;

        const delay =
            (this.editor.isEnable ? activeInterval : inactiveInterval) * 1000;

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
        // Double check config in case it changed, but start() already handles the interval
        if (!getSettings().autoDetected.enable) {
            return;
        }

        try {
            const settings = getSettings();
            const isStreaming = await detectStreamingApps(
                settings.autoDetected.additionalApps,
            );
            if (isStreaming && !this.editor.isEnable) {
                await this.editor.setEnable(true);
                vscode.window.showInformationMessage(
                    'Streamer Mode enabled automatically (Streaming app detected)',
                );
                this.logger.info('polling: auto-enabled streamer mode');
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
