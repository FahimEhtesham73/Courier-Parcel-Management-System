describe('Authentication', () => {
  beforeEach(() => {
    // Visit the base URL before each test
    cy.visit('/');
  });

  it('should allow a user to register successfully', () => {
    // Navigate to the registration page
    cy.get('a').contains('Register').click();
    cy.url().should('include', '/register');

    // Fill out the registration form
    const randomEmail = `testuser${Date.now()}@example.com`;
    const password = 'password123';
    const username = `testuser${Date.now()}`;

    cy.get('input[name="username"]').type(username);
    cy.get('input[name="email"]').type(randomEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('select[name="role"]').select('Customer'); // Assuming 'Customer' is an option

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Assert successful registration (e.g., redirection to login page)
    cy.url().should('include', '/login');
    cy.contains('Registration successful').should('be.visible'); // Assuming a success message is shown
  });

  it('should allow a user to login successfully', () => {
    // Assuming a user is already registered or you register one in a beforeEach hook
    // For simplicity here, we'll assume a user exists or you can uncomment registration above
    // or use Cypress commands to seed the database before tests.

    // Navigate to the login page
    cy.get('a').contains('Login').click();
    cy.url().should('include', '/login');

    // Fill out the login form with valid credentials
    // Replace with actual valid user credentials for testing or seed the database
    const validEmail = 'existinguser@example.com';
    const validPassword = 'existingpassword123';

    cy.get('input[name="email"]').type(validEmail);
    cy.get('input[name="password"]').type(validPassword);

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Assert successful login (e.g., redirection to dashboard or home page)
    cy.url().should('not.include', '/login'); // Should navigate away from login
    // Adjust the URL assertion based on your application's redirect logic after login
    // cy.url().should('include', '/dashboard'); // Example redirect
    cy.contains('Welcome').should('be.visible'); // Assuming a welcome message is shown after login
  });

  it('should show an error message for invalid login credentials', () => {
    // Navigate to the login page
    cy.get('a').contains('Login').click();
    cy.url().should('include', '/login');

    // Fill out the login form with invalid credentials
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Assert that an error message is displayed
    cy.contains('Invalid credentials').should('be.visible'); // Assuming an error message is shown
    cy.url().should('include', '/login'); // Should remain on the login page
  });
});