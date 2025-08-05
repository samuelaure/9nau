const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: "apps/web/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "apps/web/cypress/support/e2e.ts",
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3001"
  },
});
