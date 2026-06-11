# class-invitations Specification

## Purpose

Invite users to a class and accept/decline invitations to gain membership.

## Requirements

### Requirement: Invite a user to a class
The system SHALL allow a class owner to invite an existing user (by email) to join their class, creating a pending invitation.

#### Scenario: Owner invites an existing user
- **WHEN** a class owner submits the email of an existing user for one of their classes
- **THEN** the system creates a pending invitation linking that user to the class

#### Scenario: Non-owner cannot invite
- **WHEN** a user who is not the owner of the class attempts to send an invitation for it
- **THEN** the system rejects the request with a forbidden error and creates no invitation

#### Scenario: Invitee does not exist
- **WHEN** an owner invites an email that belongs to no registered user
- **THEN** the system rejects the request with a not-found error and creates no invitation

#### Scenario: Duplicate invitation
- **WHEN** an owner invites a user who already has a pending invitation or is already a member of that class
- **THEN** the system does not create a duplicate invitation and reports the existing state

### Requirement: List received invitations
The system SHALL allow an authenticated user to list the pending invitations addressed to them.

#### Scenario: User lists pending invitations
- **WHEN** an authenticated user requests their invitations
- **THEN** the system returns each pending invitation including the class ID and name and the inviting owner

### Requirement: Respond to an invitation
The system SHALL allow an invited user to accept or decline a pending invitation. Accepting MUST add the user as a member of the class.

#### Scenario: Accept invitation
- **WHEN** an invited user accepts their pending invitation
- **THEN** the system adds the user as a member of the class and marks the invitation accepted

#### Scenario: Decline invitation
- **WHEN** an invited user declines their pending invitation
- **THEN** the system marks the invitation declined and does not add the user as a member

#### Scenario: Responding to someone else's invitation denied
- **WHEN** a user attempts to accept or decline an invitation not addressed to them
- **THEN** the system rejects the request with a forbidden error
