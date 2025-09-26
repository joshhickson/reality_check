# Playtest Debugging Log - 2025-09-25

**Objective:** To conduct a series of bot playtests to analyze game balance and prepare for a comprehensive expansion of the Game Design Document.

**Initial Status:** The project had several new mechanics implemented based on a GDD analysis, but the simulation environment was unstable.

## Summary of Issues and Resolutions

This document chronicles the extensive debugging process undertaken to get the bot playtests to a stable, functional state. The process was fraught with multiple, cascading bugs that made diagnosis difficult.

### Issue 1: Server and Bot Logic Desynchronization

*   **Symptom:** Initial playtests failed to start or crashed immediately.
*   **Diagnosis:** The core game logic was duplicated between `game-server.js` and `src/game/Game.js`. The server was not using the centralized `Game.js` `handleAction` method, meaning that critical updates (like the `Crossroads` system) were not being called.
*   **Resolution:** I refactored the `player_action` handler in `game-server.js` to delegate all action logic to `game.handleAction()`. This required expanding `Game.js` to handle all action types (`WORK_OVERTIME`, `DRAW_CARD`, etc.) that were previously only defined in the server file.

### Issue 2: Bot Crash on "Crossroads" Event

*   **Symptom:** Playtests would hang the moment a `Crossroads` event was triggered.
*   **Diagnosis:** The `makeDecision` function in all bot strategies (`random.js`, `hustler.js`, etc.) did not have a case for the new `crossroads` decision type, causing them to hang.
*   **Resolution:** I added logic to the `makeDecision` function in all strategy files to handle the `crossroads` event type, allowing bots to make a choice and the game to proceed.

### Issue 3: Server Crash on `PLAY_CARD` Action

*   **Symptom:** After fixing the bot decision logic, playtests began crashing whenever a bot attempted to play a Sin or Virtue card.
*   **Diagnosis:** The `PLAY_CARD` logic in `Game.js` incorrectly assumed that all cards had an `effects` property, which is only true for `LifeHappens` cards. For Sin and Virtue cards, the effects are stored as direct properties on the card object. This was causing a null reference error when `player.applyEffects(cardToPlay.effects)` was called.
*   **Diagnosis Confirmed:** I inspected the card definitions in `src/cards/sin.csv` and `src/game/decks/SinDeck.js` to confirm the data structure.
*   **Resolution:** I modified the `PLAY_CARD` case in `game.handleAction()` to correctly construct an `effects` object from the card's root properties before passing it to `player.applyEffects()`.

### Issue 4: Server Crash on `card_choice` Event

*   **Symptom:** After fixing the `PLAY_CARD` logic, playtests would crash immediately after a bot made a choice for a `Crossroads` event.
*   **Diagnosis:** The `card_choice` handler in `game-server.js` had the same bug as the bot client: it was trying to access `pendingDecision.options` for a `crossroads` event, when the choices are located on `pendingDecision.card.choices`. This was causing a null reference error.
*   **Resolution:** I corrected the `card_choice` handler to check the decision type and access the choices from the correct location.

### Issue 5: Persistent Game Hang (The Final Bug)

*   **Symptom:** Despite fixing all known crashes, the `clash` playtest scenario (featuring `Hustler` and `Zen` bots) would run for an exceptionally long time without completing, while simpler tests with `Random` bots would finish.
*   **Diagnosis:**
    1.  **Initial Theory:** The bot strategies were not incentivized to gain Narrative Momentum (NM), the resource required to end the game. I refactored the `Hustler` and `Zen` strategies to be more goal-oriented and to prioritize gaining NM when the game was close to ending. This did not solve the issue.
    2.  **Deep Log Analysis:** After adding extensive, detailed logging, I was able to trace the execution flow and discovered the final, critical bug. After a `crossroads` or `foresight` event, the `game.status` was not being reset from `awaiting-crossroads-decision` or `awaiting-foresight-decision` back to `in-progress`. This meant that after the first such event, the game would get permanently stuck, as all bots would be waiting for a state update that would never come.
*   **Resolution:** I added the necessary logic to the `resolveForesight` function in `Game.js` and the `card_choice` handler in `game-server.js` to ensure that `game.status` is always reset to `'in-progress'` after a decision is made.

## Final Status

After a lengthy and complex debugging process, all known bugs have been resolved. The playtests now run to completion, and the simulation environment is stable. The project is now ready for the next phase of analysis and GDD expansion. This document serves as a record of the debugging process. The next step is to analyze the completed playtest logs.