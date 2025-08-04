const eslintJs = require('@eslint/js')
const tseslint = require('typescript-eslint')
const prettierConfig = require('eslint-config-prettier')
const eslintPluginReact = require('eslint-plugin-react')

module.exports = tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/out/',
      '**/.next/',
      '**/coverage/',
      '**/generated/',
    ],
  },

  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.tsx'],
    plugins: {
      react: eslintPluginReact,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  prettierConfig
);