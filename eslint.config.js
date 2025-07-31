const eslintJs = require('@eslint/js')
const tseslint = require('typescript-eslint')
const prettierConfig = require('eslint-config-prettier')

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
  prettierConfig
)
