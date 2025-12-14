import js from '@eslint/js';
import html from 'eslint-plugin-html';

export default [
  js.configs.recommended,
  {
    files: ['dashboard/**/*.js', 'dashboard/**/*.html'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        'auth': 'readonly',
        'api': 'readonly',
        'toast': 'readonly',
        'window': 'readonly',
        'document': 'readonly',
        'console': 'readonly',
        'localStorage': 'readonly',
        'sessionStorage': 'readonly',
        'fetch': 'readonly',
        'Promise': 'readonly',
        'setTimeout': 'readonly',
        'clearTimeout': 'readonly',
        'setInterval': 'readonly',
        'clearInterval': 'readonly',
        'Date': 'readonly',
        'Math': 'readonly',
        'JSON': 'readonly',
        'Array': 'readonly',
        'Object': 'readonly',
        'String': 'readonly',
        'Number': 'readonly',
        'Boolean': 'readonly',
        'Error': 'readonly',
        'RegExp': 'readonly',
        'Intl': 'readonly',
        'FileReader': 'readonly',
        'FormData': 'readonly',
        'URL': 'readonly',
        'URLSearchParams': 'readonly',
        'Headers': 'readonly',
        'Request': 'readonly',
        'Response': 'readonly',
        'Blob': 'readonly',
        'File': 'readonly',
        'confirm': 'readonly',
        'alert': 'readonly',
        'prompt': 'readonly',
        // External libraries
        'bootstrap': 'readonly',
        'QRCode': 'readonly',
        'navigator': 'readonly',
        'HubAPI': 'readonly',
      },
    },
    plugins: {
      html,
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-undef': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always'],
      'curly': ['warn', 'all'], // Warning instead of error for now
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '*.min.js',
      'dashboard/assets/js/config.js',
      '_site/',
      '.jekyll-cache/',
    ],
  },
];

