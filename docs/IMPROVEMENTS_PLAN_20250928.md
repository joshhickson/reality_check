# Game Logic & Documentation Improvement Plan - 2025-09-28

This document outlines a plan to improve the game logic, architecture, and documentation for the Reality Check game.

## 1. Documentation Enhancements

### 1.1. Create a Central Game Mechanics Document
- **Action:** Create a `docs/GAME_MECHANICS.md` file.
- **Purpose:** To provide a single source of truth for game rules, player stats, card effects, and special game phases (e.g., Exile, Judgment Day). This will be invaluable for developers, designers, and new team members.
- **Status:** Initial version to be created.

### 1.2. Improve Code-Level Documentation (JSDoc)
- **Action:** Add JSDoc-style comments to critical classes and methods, starting with `src/game/Game.js` and `game-server.js`.
- **Purpose:** To improve code clarity, making it easier to understand the purpose of each function, its parameters, and its return values. This speeds up development and reduces bugs.
- **Status:** To be started.

## 2. Game Logic & Architecture Refactoring

### 2.1. Centralize Game Logic in `Game.js`
- **Action:** Move the `player_action` switch statement from `game-server.js` into a new method within the `Game.js` class (e.g., `game.handlePlayerAction(...)`).
- **Purpose:** The `game-server.js` file should be responsible for network communication, not core game logic. This change will centralize game rules within the `Game` class, improving separation of concerns and making the logic easier to manage and test.

### 2.2. Consolidate State Management
- **Action:** Refactor the game to use the `StateMachine` as the single source of truth for the game's state, removing the parallel `game.status` string property.
- **Purpose:** Using two different state management systems (`game.status` and `game.stateMachine`) is redundant and a likely source of bugs. Consolidating to the state machine will make state transitions more robust and predictable.

### 2.3. Review and Clarify "Foresight" Mechanic
- **Action:** Investigate the two different implementations of the "Spend Momentum" action. There appears to be a redundant or dead code path in `Game.js` (`handleAction` and `triggerForesight`) that conflicts with the implementation in `game-server.js`.
- **Purpose:** To remove ambiguity, fix potential bugs, and ensure the feature works as intended.

### 2.4. Refactor `checkTurnEnd` Logic
- **Action:** Move the `checkTurnEnd` function from `game-server.js` into a method on the `Game.js` class.
- **Purpose:** Turn management is a core responsibility of the `Game` object, and this logic should reside there.

## 3. Next Steps
1. Await feedback on this plan.
2. Begin implementation, starting with documentation changes.
3. Proceed with refactoring tasks.
4. Test all changes thoroughly using the bot simulator (`bot-client.js`) to ensure no regressions are introduced.