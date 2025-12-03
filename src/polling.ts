import vscode from 'vscode';

import type { StreamerModeEditor } from './editor';
import type Logger from './logger';
import { getSettings } from './settings';
import { detectStreamingApps } from './utils/streamer';

export class PollingService implements vscode.Disposable {
    private interval: NodeJS.Timeout | undefined;
    private readonly editor: StreamerModeEditor;
    private readonly logger: Logger;

    constructor(editor: StreamerModeEditor, logger: Logger) {
        this.editor = editor;
        this.logger = logger;
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
            const isStreaming = await detectStreamingApps();
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
    }
}
