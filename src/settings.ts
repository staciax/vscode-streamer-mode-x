import vscode from 'vscode';

export interface StreamerModeSettings {
    enabled: boolean;
    autoDetected: {
        enable: boolean;
        interval: {
            active: number;
            inactive: number;
        };
        additionalApps: string[];
    };
    decoration: {
        propagate: boolean;
    };
}

export function getSettings(): StreamerModeSettings {
    const config = vscode.workspace.getConfiguration('streamer-mode');
    return {
        enabled: config.get<boolean>('enabled', true),
        autoDetected: {
            enable: config.get<boolean>('autoDetected.enable', true),
            interval: {
                active: config.get<number>('autoDetected.interval.active', 60),
                inactive: config.get<number>(
                    'autoDetected.interval.inactive',
                    30,
                ),
            },
            additionalApps: config.get<string[]>(
                'autoDetected.additionalApps',
                [],
            ),
        },
        decoration: {
            propagate: config.get<boolean>('decoration.propagate', true),
        },
    };
}

export function getConfig<T>(section: string, key: string): T | undefined;
export function getConfig<T>(section: string, key: string, defaultValue: T): T;
export function getConfig<T>(
    section: string,
    key: string,
    defaultValue?: T,
): T | undefined {
    const config = vscode.workspace.getConfiguration(section);
    const value = config.get<T>(key);
    return value ?? defaultValue;
}

export async function updateConfig(
    section: string,
    key: string,
    // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
    value: any,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global,
) {
    await vscode.workspace.getConfiguration(section).update(key, value, target);
}
