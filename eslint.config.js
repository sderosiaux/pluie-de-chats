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
  {
    // Déterminisme (GAME_SPEC §24) : la simulation ne lit ni horloge ni aléa,
    // et n'appelle aucune fonction transcendante (résultats non garantis identiques entre moteurs JS).
    files: ['src/sim/**/*.ts'],
    ignores: ['src/sim/**/*.test.ts'],
    rules: {
      'no-restricted-properties': ['error',
        ...['random', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'exp', 'expm1', 'log', 'log2', 'log10', 'log1p', 'sinh', 'cosh', 'tanh', 'cbrt', 'hypot']
          .map(property => ({ object: 'Math', property, message: 'Interdit dans src/sim (déterminisme cross-engine, GAME_SPEC §24).' })),
      ],
      'no-restricted-globals': ['error',
        { name: 'Date', message: 'Pas d\'horloge dans src/sim (GAME_SPEC §24).' },
        { name: 'performance', message: 'Pas d\'horloge dans src/sim (GAME_SPEC §24).' },
        { name: 'setTimeout', message: 'La sim avance par ticks, pas par timers.' },
        { name: 'setInterval', message: 'La sim avance par ticks, pas par timers.' },
        { name: 'requestAnimationFrame', message: 'La sim avance par ticks, pas par frames.' },
        { name: 'globalThis', message: 'Accès indirect aux globales interdit dans src/sim (GAME_SPEC §24).' },
        { name: 'window', message: 'Pas de DOM dans src/sim.' },
        { name: 'self', message: 'Accès indirect aux globales interdit dans src/sim (GAME_SPEC §24).' },
        { name: 'crypto', message: 'Pas d\'aléa dans src/sim (GAME_SPEC §24).' },
      ],
      'no-restricted-syntax': ['error',
        { selector: 'BinaryExpression[operator="**"]', message: '** peut passer par pow : interdit dans src/sim (GAME_SPEC §24).' },
        { selector: 'AssignmentExpression[operator="**="]', message: '**= peut passer par pow : interdit dans src/sim (GAME_SPEC §24).' },
        { selector: 'MemberExpression[object.name="Math"][computed=true]', message: 'Math[...] contourne la liste des fonctions interdites (GAME_SPEC §24).' },
        { selector: ':not(MemberExpression) > Identifier[name="Math"]', message: 'Math ne s\'utilise que sous la forme Math.f(...) : pas d\'alias (GAME_SPEC §24).' },
      ],
      'no-restricted-imports': ['error', {
        patterns: [{ regex: '^(?!\\.)', message: 'src/sim ne dépend d\'aucun paquet : tout doit être reproductible au bit près.' },
          { group: ['**/game/**', '**/bots/**'], message: 'src/sim ne dépend ni du client ni des bots.' }],
      }],
    },
  },
);
