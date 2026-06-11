# realtime-board Specification

## Purpose

Per-class board holding text, shapes, and free-hand strokes, with live multi-user synchronization.

## Requirements

### Requirement: Board element model
The system SHALL maintain one board per class composed of elements. Each element MUST have a unique id, a type (`stroke`, `rect`, `ellipse`, `line`, or `text`), type-specific data, an author, and a last-updated timestamp.

#### Scenario: Board exists for each class
- **WHEN** a class is created
- **THEN** the system associates an initially empty board with that class

#### Scenario: Supported element types
- **WHEN** a member adds an element to the board
- **THEN** the system accepts elements of type stroke (free-hand), rect, ellipse, line, and text, and rejects unknown types

### Requirement: Board snapshot retrieval
The system SHALL allow a class member to fetch the full current set of board elements for a class.

#### Scenario: Member fetches board snapshot
- **WHEN** a member requests the board of a class they belong to
- **THEN** the system returns all current elements of that board

#### Scenario: Non-member denied board access
- **WHEN** a user who is not a member requests a class board
- **THEN** the system rejects the request with a forbidden error

### Requirement: Real-time board synchronization
The system SHALL synchronize board edits in real time among members currently viewing a class board. When a member adds, updates, deletes, or clears elements, the change MUST be persisted and broadcast to all other connected members of that class.

#### Scenario: Edit broadcast to viewers
- **WHEN** a connected member adds, updates, or deletes a board element
- **THEN** the system persists the change and pushes it to every other member currently connected to that class board

#### Scenario: Late joiner gets current state
- **WHEN** a member opens a class board after edits have already occurred
- **THEN** the member receives the full current board state and thereafter receives live updates

#### Scenario: Clear board
- **WHEN** a connected member clears the board
- **THEN** the system removes all elements and broadcasts the clear to every other connected member

### Requirement: Real-time connection authorization
The system SHALL authorize real-time board connections using a valid bearer token and SHALL restrict a connection to boards of classes the authenticated user belongs to.

#### Scenario: Valid token joins own class board
- **WHEN** a user connects to the real-time channel with a valid token and subscribes to a class they are a member of
- **THEN** the system admits the connection to that class's board room

#### Scenario: Connection without valid token rejected
- **WHEN** a connection attempt has no valid bearer token
- **THEN** the system rejects the connection

#### Scenario: Subscribing to a non-member class rejected
- **WHEN** an authenticated user attempts to subscribe to the board of a class they do not belong to
- **THEN** the system rejects the subscription with an authorization error
