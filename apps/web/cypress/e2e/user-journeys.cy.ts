/// <reference types="cypress" />

describe('User Journeys', () => {
  // Clear the database and local state before each test suite
  before(() => {
    const databaseUrl = Cypress.env('DATABASE_URL')

    cy.exec('pnpm --filter api run db:test:reset', {
      env: {
        DATABASE_URL: databaseUrl,
      },
    })
    cy.clearLocalStorage()
  })

  it('should allow a user to create a block, drag it to the dashboard, and mark it complete', () => {
    // 1. Visit the home page
    cy.visit('/')
    cy.wait(1000) // Wait for the app to initialize

    // 2. Create a new note
    const noteText = 'A new note for my daily plan'
    cy.contains('Take a note...').click()
    cy.get('textarea[placeholder="Take a note..."]').type(noteText)
    cy.get('button').contains('Close').click()
    cy.wait(500)

    // 3. Find the created note
    cy.get('p').contains(noteText).should('be.visible')
    cy.contains('Notes Inbox').scrollIntoView()

    // 4. Drag the note to the daily actions section
    cy.get('p').contains(noteText).as('draggedNote')
    // Target the content area of the section to trigger onDragOver
    cy.get('h3').contains('Actions').closest('.mb-4').find('.pl-2.mt-2').as('dropZone')
    cy.get('@draggedNote').trigger('dragstart', { dataTransfer: new DataTransfer() })
    cy.get('@dropZone').trigger('dragover')
    // The drop event is on the main dashboard container which has the onDrop handler
    cy.get('[data-testid="dashboard-main-content"]').trigger('drop', { force: true })
    cy.get('@draggedNote').trigger('dragend')
    cy.wait(500)

    // 5. Verify the item is now in the Actions section and no longer in the Notes Inbox
    cy.get('h3').contains('Actions').scrollIntoView()
    cy.get('h3').contains('Actions').closest('.mb-4').contains(noteText).should('be.visible')
    cy.get('h3').contains('Notes Inbox').closest('.mb-4').contains(noteText).should('not.exist')

    // 6. Mark the item as complete
    cy.get('h3')
      .contains('Actions')
      .closest('.mb-4')
      .find('span')
      .contains(noteText)
      .closest('.relative.group')
      .find('input[type="checkbox"]')
      .check()
    cy.get('h3')
      .contains('Actions')
      .closest('.mb-4')
      .find('span')
      .contains(noteText)
      .should('have.class', 'line-through')

    // 7. Delete the item
    cy.get('h3')
      .contains('Actions')
      .closest('.mb-4')
      .find('span')
      .contains(noteText)
      .closest('.relative.group')
      .find('button')
      .click({ force: true })
    cy.get('h3').contains('Actions').closest('.mb-4').contains(noteText).should('not.exist')
  })
})
