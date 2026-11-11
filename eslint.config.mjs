export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        AudioContext: 'readonly',
        MutationObserver: 'readonly',
        Promise: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
        caches: 'readonly',
        clearInterval: 'readonly',
        clients: 'readonly',
        console: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        module: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        require: 'readonly',
        self: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-fallthrough': 'error',
      'no-redeclare': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error'
    }
  }
];
