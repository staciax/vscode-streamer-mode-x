import * as vscode from 'vscode';

/**
 * Waits for a specific configuration value to be set for a given pattern in `workbench.editorAssociations`.
 *
 * @param pattern The filename pattern to check in the configuration.
 * @param expectedValue The expected value for the configuration key.
 * @param timeout The timeout in milliseconds (default: 2000ms).
 */
export async function waitForConfig(
    pattern: string,
    expectedValue: string | undefined,
    timeout = 2000,
): Promise<void> {
    // Check if already in expected state
    const currentConfig = vscode.workspace
        .getConfiguration('workbench')
        .get<Record<string, string>>('editorAssociations');
    if (currentConfig?.[pattern] === expectedValue) {
        return;
    }

    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            disposable.dispose();
            reject(
                new Error(
                    `Config did not update to expected value: ${expectedValue} within ${timeout}ms`,
                ),
            );
        }, timeout);

        const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('workbench.editorAssociations')) {
                const config = vscode.workspace
                    .getConfiguration('workbench')
                    .get<Record<string, string>>('editorAssociations');
                if (config?.[pattern] === expectedValue) {
                    clearTimeout(timer);
                    disposable.dispose();
                    resolve();
                }
            }
        });
    });
}
