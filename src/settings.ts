import vscode from 'vscode';

export interface StreamerModeSettings {
    enabled: boolean;
    autoDetected: {
        enable: boolean;
        interval: {
            active: number;
            inactive: number;
        };
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
        },
        decoration: {
            propagate: config.get<boolean>('decoration.propagate', true),
        },
    };
}

export function getConfig<T>(
    section: string,
    key: string,
    defaultValue?: T,
): T {
    return (
        vscode.workspace.getConfiguration(section).get<T>(key) ??
        (defaultValue as T)
    );
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
