## ADDED Requirements

### Requirement: User registration
The system SHALL allow a person to register an account using email, name, and password. Email MUST be unique. Passwords MUST be stored hashed (never in plaintext).

#### Scenario: Successful registration
- **WHEN** a person submits a unique email, a name, and a password meeting minimum length
- **THEN** the system creates a user account, stores the password hashed, and returns the created user's id, email, and name (never the password)

#### Scenario: Duplicate email
- **WHEN** a person submits an email that already belongs to an existing account
- **THEN** the system rejects the request with a conflict error and does not create a second account

#### Scenario: Invalid input
- **WHEN** a person submits a malformed email, empty name, or password below the minimum length
- **THEN** the system rejects the request with a validation error describing the invalid fields

### Requirement: User login with bearer token
The system SHALL authenticate a user with email and password and, on success, issue a bearer token the client uses for subsequent authenticated requests.

#### Scenario: Successful login
- **WHEN** a user submits a registered email with the correct password
- **THEN** the system returns a signed bearer token identifying the user

#### Scenario: Wrong credentials
- **WHEN** a user submits an email with an incorrect password, or an email that is not registered
- **THEN** the system rejects the request with an authentication error and issues no token

### Requirement: Authenticated request authorization
The system SHALL protect non-public endpoints by requiring a valid bearer token in the `Authorization: Bearer <token>` header and SHALL reject requests with a missing, malformed, or expired token.

#### Scenario: Valid token grants access
- **WHEN** a request to a protected endpoint includes a valid, unexpired bearer token
- **THEN** the system resolves the requesting user and processes the request

#### Scenario: Missing or invalid token denied
- **WHEN** a request to a protected endpoint has no token, a malformed token, or an expired token
- **THEN** the system rejects the request with an unauthorized error
