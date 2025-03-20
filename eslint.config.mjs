import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: {
            parser: tsParser
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase']
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_'
                }
            ],

            curly: 'warn',
            eqeqeq: 'warn',
            'no-throw-literal': 'warn',
            semi: 'warn'
        }
    },
    {
        files: ['**/media/**/*.js'],
        languageOptions: {
            globals: globals.browser
        }
    },
    {
        plugins: {
            'simple-import-sort': simpleImportSort
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error'
        }
    }
);
