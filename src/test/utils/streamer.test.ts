import * as assert from 'node:assert';

import { isValidAppName } from '../../utils/streamer';

suite('Streamer Utils Test Suite', () => {
    test('isValidAppName should accept names with spaces', () => {
        assert.strictEqual(isValidAppName('OBS Studio'), true);
        assert.strictEqual(isValidAppName('Streamlabs OBS'), true);
    });

    test('isValidAppName should accept names with dots, dashes, and underscores', () => {
        assert.strictEqual(isValidAppName('obs.exe'), true);
        assert.strictEqual(isValidAppName('stream-labs'), true);
        assert.strictEqual(isValidAppName('my_streamer'), true);
    });

    test('isValidAppName should reject empty or whitespace-only strings', () => {
        assert.strictEqual(isValidAppName(''), false);
        assert.strictEqual(isValidAppName('   '), false);
    });

    test('isValidAppName should reject invalid characters', () => {
        assert.strictEqual(isValidAppName('invalid/name'), false);
        assert.strictEqual(isValidAppName('invalid\\name'), false);
        assert.strictEqual(isValidAppName('invalid:name'), false);
        assert.strictEqual(isValidAppName('invalid*name'), false);
        assert.strictEqual(isValidAppName('invalid?name'), false);
        assert.strictEqual(isValidAppName('invalid"name'), false);
        assert.strictEqual(isValidAppName('invalid<name'), false);
        assert.strictEqual(isValidAppName('invalid>name'), false);
        assert.strictEqual(isValidAppName('invalid|name'), false);
        assert.strictEqual(isValidAppName('invalid@name'), false);
        assert.strictEqual(isValidAppName('app$name'), false);
    });
});
