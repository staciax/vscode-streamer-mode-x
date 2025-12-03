import vscode from 'vscode';

import type { StreamerModeEditor } from './editor';
import type Logger from './logger';
import { getConfig } from './settings';
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

        // Check if auto-detection is enabled
        if (!getConfig('streamer-mode', 'autoDetected.enable', true)) {
            return;
        }

        const activeInterval = getConfig(
            'streamer-mode',
            'autoDetected.interval.active',
            60,
        );
        const inactiveInterval = getConfig(
            'streamer-mode',
            'autoDetected.interval.inactive',
            30,
        );

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
        if (!getConfig('streamer-mode', 'autoDetected.enable', true)) {
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
