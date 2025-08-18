const { defineConfig } = require('cypress')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, './.env.test') })

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // node event listeners here
    },
    specPattern: 'apps/web/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'apps/web/cypress/support/e2e.ts',
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3001',
    env: {
      DATABASE_URL: process.env.CYPRESS_DATABASE_URL,
    },
  },
})
