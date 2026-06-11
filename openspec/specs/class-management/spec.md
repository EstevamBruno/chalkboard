# class-management Specification

## Purpose

Create, list, and view classes; each class has a unique ID and an owner; membership links users to classes.

## Requirements

### Requirement: Create a class
The system SHALL allow any authenticated user to create a class. Each class MUST have a unique opaque ID and MUST record the creating user as its owner.

#### Scenario: Authenticated user creates a class
- **WHEN** an authenticated user submits a class name
- **THEN** the system creates a class with a unique opaque ID, sets the requesting user as owner, adds the owner as a member, and returns the class with its ID

#### Scenario: Unauthenticated creation denied
- **WHEN** an unauthenticated request attempts to create a class
- **THEN** the system rejects it with an unauthorized error and creates no class

### Requirement: List a user's classes
The system SHALL allow an authenticated user to list the classes they own or are a member of, each identified by its unique ID.

#### Scenario: Member lists their classes
- **WHEN** an authenticated user requests their class list
- **THEN** the system returns every class where the user is owner or member, including each class ID and name

#### Scenario: Classes the user is not part of are excluded
- **WHEN** an authenticated user requests their class list
- **THEN** the system excludes classes where the user is neither owner nor member

### Requirement: View a class by ID
The system SHALL allow a member or owner of a class to retrieve that class by its unique ID, and SHALL deny access to non-members.

#### Scenario: Member views class
- **WHEN** a user who is a member or owner requests a class by its ID
- **THEN** the system returns the class details

#### Scenario: Non-member denied
- **WHEN** a user who is neither member nor owner requests a class by its ID
- **THEN** the system rejects the request with a forbidden error

### Requirement: Delete a class
The system SHALL allow only the owner of a class to delete it. Deleting a class MUST remove the class together with its memberships, invitations, and board elements.

#### Scenario: Owner deletes their class
- **WHEN** the owner of a class requests deletion of that class by its ID
- **THEN** the system permanently removes the class and all of its memberships, invitations, and board elements

#### Scenario: Non-owner cannot delete
- **WHEN** a member (non-owner) or any other authenticated user requests deletion of a class
- **THEN** the system rejects the request with a forbidden error and the class is unchanged

#### Scenario: Deleting a missing class
- **WHEN** a user requests deletion of a class ID that does not exist
- **THEN** the system responds with a not-found error
