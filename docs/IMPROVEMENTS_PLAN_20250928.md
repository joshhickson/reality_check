# Game Logic & Documentation Improvement Plan - 2025-09-28

This document outlines a plan to improve the game logic, architecture, and documentation for the Reality Check game.

## 1. Documentation Enhancements

### 1.1. Create a Central Game Mechanics Document
- **Action:** Create a `docs/GAME_MECHANICS.md` file.
- **Purpose:** To provide a single source of truth for game rules, player stats, card effects, and special game phases (e.g., Exile, Judgment Day).
- **Status:** **DONE**.

### 1.2. Improve Code-Level Documentation (JSDoc)
- **Action:** Add JSDoc-style comments to critical classes and methods.
- **Purpose:** To improve code clarity, making it easier to understand the purpose of each function, its parameters, and its return values.
- **Status:** **DONE**.

## 2. Game Logic & Architecture Refactoring

### 2.1. Centralize Game Logic in `Game.js`
- **Action:** Move the `player_action` switch statement from `game-server.js` into a new method within the `Game.js` class.
- **Purpose:** To improve separation of concerns and centralize game rules within the `Game` class.
- **Status:** **DONE**.

### 2.2. Consolidate State Management
- **Action:** Refactor the game to use the `StateMachine` as the single source of truth for the game's state.
- **Purpose:** To remove the redundant `game.status` property and make state transitions more robust.
- **Status:** **DONE**.

### 2.3. Resolve Conflicting "Foresight" Mechanic
- **Action:** Investigate and resolve the two different implementations of the "Spend Momentum" action.
- **Purpose:** To remove ambiguity and fix potential bugs.
- **Status:** **DONE** (Resolved during logic centralization).

### 2.4. Refactor `checkTurnEnd` Logic
- **Action:** Move the `checkTurnEnd` function from `game-server.js` into a method on the `Game.js` class.
- **Purpose:** To ensure turn management resides within the core `Game` object.
- **Status:** **DONE**.

## 3. Feature Implementation and Bug Fixes (from Mermaid Map)

This section outlines new work identified by comparing the implemented code with the `Game_Logic_Mermaid_Map.md` document.

### 3.1. Implement Missing Player Stats
- **Action:** Add `socialCapital` and `communityImpact` to the `Player` class stats.
- **Purpose:** These stats are required dependencies for several broken accolades and bot strategies.

### 3.2. Fix Broken Scoring and Accolades
- **Action:** Implement the correct logic for the "Builder Bonus" calculation in `Game.js`.
- **Action:** Fix the logic for awarding the "The Socialite" and "The Community Builder" accolades, which depend on the new stats.

### 3.3. Implement Placeholder Accolades
- **Action:** Implement the underlying tracking mechanisms and award logic for the following placeholder accolades:
    - The Workhorse (requires action count tracking)
    - The Storyteller (requires event count tracking)
    - The Gambler (requires choice risk tracking)
    - The Drama Queen (requires event count tracking)
    - The Rollercoaster (requires stat history tracking)

### 3.4. Fix and Complete Bot Strategies
- **Action:** Fix the `Puppeteer` bot strategy, which is currently marked as `Broken` and depends on the `socialCapital` stat.
- **Action:** Complete the `Agitator` bot strategy, which is currently `Incomplete` and also depends on the `socialCapital` stat.

## 4. Testing and Verification
- **Action:** Test all new features and bug fixes thoroughly using the bot simulator (`bot-client.js`).
- **Note:** The underlying environmental connection issue needs to be resolved before the bot simulator can be used effectively.