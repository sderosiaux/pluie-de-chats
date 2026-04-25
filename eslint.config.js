import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', '*.config.js', '*.config.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Bug catchers (strict)
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-dupe-keys': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-unreachable': 'error',
      'no-fallthrough': 'error',
      // no-undef est désactivé : TypeScript le gère mieux (et connaît OscillatorType etc.)
      'no-undef': 'off',
      // Ternaire comme expression-statement = pratique courante en JS, on autorise
      '@typescript-eslint/no-unused-expressions': ['warn', {
        allowShortCircuit: true,
        allowTernary: true,
      }],
      'no-useless-assignment': 'off',  // false positives sur boucles + break

      // TypeScript pragmatic
      '@typescript-eslint/no-explicit-any': 'off',           // utilisé volontairement aux frontières
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-nocheck': false,           // autorisé (render-cats.ts)
        'ts-ignore': 'allow-with-description',
        'ts-expect-error': 'allow-with-description',
      }],
      '@typescript-eslint/no-empty-function': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
);
