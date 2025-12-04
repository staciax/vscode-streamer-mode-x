import * as assert from 'node:assert';

import { isValidAppName } from '../../utils/streamer';

suite('Streamer Utils Test Suite', () => {
    test('isValidAppName should accept names with spaces', () => {
        assert.strictEqual(isValidAppName('streamlabs desktop'), true);
        assert.strictEqual(isValidAppName('Google Chrome'), true);
    });

    test('isValidAppName should accept names with dots, dashes, and underscores', () => {
        assert.strictEqual(isValidAppName('node.exe'), true);
        assert.strictEqual(isValidAppName('my-app_v1'), true);
    });

    test('isValidAppName should reject empty or whitespace-only strings', () => {
        assert.strictEqual(isValidAppName(''), false);
        assert.strictEqual(isValidAppName('   '), false);
    });

    test('isValidAppName should reject invalid characters', () => {
        assert.strictEqual(isValidAppName('invalid@name'), false);
        assert.strictEqual(isValidAppName('app$name'), false);
    });
});
