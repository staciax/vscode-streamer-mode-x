import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: ['out/*.test.js', 'out/**/*.test.js'],
    launchArgs: ['src/test/workspace'],
});
