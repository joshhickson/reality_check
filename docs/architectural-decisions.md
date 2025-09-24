# Architectural Decisions Log

This document records significant architectural decisions made during the development of the "Reality Check" game.

## 2025-09-23: Refactoring Player Actions and Introducing Unit Tests

As the project grows in complexity with the addition of new features from the Game Design Document (GDD), we are making two key architectural improvements to ensure long-term maintainability and stability.

### 1. Refactoring the Player Action Handler

**Problem:** The current `player_action` handler in `game-server.js` is implemented as a single, large `switch` statement. While functional for the initial set of actions, this approach will become difficult to read, maintain, and test as we add more complex player actions (e.g., Exile Protocol, Crossroads Interrupts).

**Decision:** We will refactor the player action logic into a more modular, command-based pattern.
*   Each player action will be moved into its own file within a new `src/game/actions/` directory.
*   The main `player_action` handler in `game-server.js` will be modified to dynamically call the appropriate action module based on the `action.type`.

**Benefits:**
*   **Maintainability:** Each action's logic will be self-contained, making it easier to understand, modify, and debug.
*   **Scalability:** Adding new actions will be as simple as adding a new file, without increasing the complexity of the main server file.
*   **Testability:** This modular approach will make it easier to write unit tests for individual actions.

### 2. Introducing a Unit Testing Framework

**Problem:** The project currently relies exclusively on the end-to-end bot simulation for testing. While valuable, this makes it difficult to test specific pieces of game logic in isolation. Debugging a failure in a 40-turn simulation can be time-consuming and inefficient.

**Decision:** We will integrate the **Jest** testing framework into the project.
*   Jest will be added as a `devDependency`.
*   A `tests/` directory will be created for unit test files.
*   A `test` script will be added to `package.json` to easily run the test suite.

**Benefits:**
*   **Reliability:** We can write tests for pure functions within the game logic (e.g., stat calculations, card effects) to ensure they behave as expected and prevent regressions.
*   **Development Speed:** Running a focused unit test is much faster than running a full simulation, allowing for quicker iteration during development.
*   **Code Quality:** The practice of writing tests encourages the development of more modular and testable code.

These two changes are being implemented together as the refactoring of the action handler will make the code significantly easier to unit test.
