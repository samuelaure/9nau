const eslintJs = require('@eslint/js')
const tseslint = require('typescript-eslint')
const prettierConfig = require('eslint-config-prettier')

module.exports = tseslint.config(
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig
)