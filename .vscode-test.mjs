import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: ['out/*.test.js', 'out/**/*.test.js'],
    launchArgs: ['src/test/workspace'],
    coverage: {
        reporter: ['text', 'lcov'],
        exclude: ['**/src/test/**', '**/node_modules/**'],
    },
});