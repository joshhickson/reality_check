# Reality Check: Game Design Document (GDD)
*Version 0.1 - Initial Draft*

## 1. Core Game Loop & Vision

**Vision:** To create a satirical, narrative-driven board game that mirrors the complexities of modern adult life. The game should encourage social interaction, moral ambiguity, and strategic thinking beyond simple resource accumulation. The primary goal is not just to "win," but to generate memorable stories and conversations.

**Core Loop:**
1.  **Start Turn:** Apply any ongoing effects.
2.  **Take Action:** Choose one primary action (e.g., Draw Card, Play Card).
3.  **Resolve Action:** Apply effects and make choices.
4.  **End Turn:** Pass play to the next player.

## 2. Core Mechanic Definitions

This section provides concrete rules for previously ambiguous mechanics.

### 2.1. The "Burnout" Mechanic (Low Mental Health)

**Concept:** Mechanically represents the consequences of poor mental health, limiting a player's choices and forcing them to deal with their current problems rather than taking on new ones.

**Rule:**
*   At the start of your turn, if your **Mental Health** is **3 or lower**, you are suffering from **"Burnout."**
*   While suffering from Burnout, you **cannot** perform the "Draw a Card" action. You must choose another action, such as "Play a Card" from your hand.
*   If you have no other valid actions (e.g., no cards to play), you must spend your turn "recovering," which allows you to draw one card but immediately end your turn without playing it. This represents the difficulty of progress when mentally exhausted.

### 2.2. "Community Impact" Tracking

**Concept:** Quantifies a player's positive contributions to the group, making "The Builder" victory condition measurable.

**Rule:**
*   A new global tracker, the **"Community Impact Track,"** is added to the game. It is a simple track from 0 to 20.
*   Players gain Community Impact points in the following ways:
    *   **Direct Aid:** When a card or game effect instructs you to give another player a resource (e.g., Money, Mental Health), you gain **1 Community Impact point** for every $1000 given or **1 point** for every 2 Mental Health points restored.
    *   **Virtue Cards:** Certain Virtue cards will explicitly state, "Gain +X Community Impact."
    *   **Babel Events:** Choosing a pro-social option during a Babel Event may award Community Impact points to all participating players.
*   At the end of the game, the player with the highest score on the Community Impact Track wins **"The Builder"** title, granting them a significant bonus to their final score.

### 2.3. Card & Action Economy

**Concept:** Defines the flow of cards and actions to ensure a balanced and well-paced game.

**Rules:**
*   **Action Points (AP):** Each player starts their turn with **2 Action Points**.
*   **Action Menu:**
    *   **Draw a Card:** Costs 1 AP.
    *   **Play a Card:** Costs 1 AP.
    *   **Work Overtime:** Costs 2 AP. Gain $500 Money but lose 1 Mental Health.
*   **Hand Size:** Players have a maximum hand size of **5 cards**. If you must draw a card and are already at your hand limit, you must first discard a card of your choice.
*   **Turn End:** A player's turn ends when they have spent all their Action Points.

### 2.4. "Peer Testimony" Phase

**Concept:** Formalizes the end-game social review into a mechanically significant phase.

**Rule:**
*   After the final round, but before final scoring, the Peer Testimony phase begins.
*   Each player is secretly given one **"Kudos"** token and one **"Concern"** token.
*   Simultaneously, all players will secretly assign their Kudos token to one other player and their Concern token to one other player. You cannot assign tokens to yourself.
*   **Scoring Impact:**
    *   Each Kudos token a player receives adds **+3 points** to their final score.
    *   Each Concern token a player receives subtracts **-1 point** from their final score.
*   This system encourages players to be mindful of their social standing throughout the game and gives mechanical weight to their reputation.

## 3. Advanced Mechanics & Systems

This section details the more complex systems that provide "Reality Check" with its unique strategic depth and narrative potential.

### 3.1. The Exile Protocol (Replaces Red Line Protocol)

**Concept:** A player-driven catch-up mechanism that addresses a runaway leader without resorting to player elimination. It transforms a dominant player into a new kind of disruptive force, keeping all players engaged.

**Rules:**
*   **Trigger Condition:** The Exile Protocol can be initiated at the start of any player's turn if one player's **Money** is more than double the combined total of the two players with the least Money.
*   **The Vote:** The player whose turn it is may propose a vote to "Exile" the wealthy player. The vote requires a simple majority to pass. The wealthy player does not get a vote.
*   **Consequences of Exile:**
    *   The Exiled player immediately loses 50% of their Money, which is redistributed equally among all other players.
    *   The Exiled player receives a new secret objective card (e.g., "Cause two other players to fall below 3 Mental Health," or "Ensure the player with the highest Virtue does not win.").
    *   The Exiled player no longer pursues the standard victory conditions. They can only win by achieving their new secret objective. They are still part of the game, but their goals are now fundamentally different and often disruptive.

### 3.2. Social Capital Resource System

**Concept:** A spendable resource representing a player's reputation, social clout, and network of favors. It mechanizes the power of social influence.

**Rules:**
*   **Gaining Social Capital:** Players gain Social Capital tokens (SC) through:
    *   **Virtue Cards:** Specific choices on Virtue cards will award SC.
    *   **Community Events:** Pro-social choices during Babel Events can award SC.
    *   **Direct Aid:** When you give another player a resource voluntarily (not as part of a card effect that forces you to), you may gain 1 SC.
*   **Spending Social Capital:** A player can spend their accumulated SC on their turn to perform powerful social actions. A player may only perform one Social Capital action per turn.
    *   **1 SC: "Call in a Favor"** - Reroll any one die roll you make this turn.
    *   **2 SC: "Lean on Your Network"** - Negate a Mental Health loss of 2 points or less.
    *   **4 SC: "Community Organizer"** - Add an additional vote to any group decision or Babel Event vote.

### 3.3. "Crossroads" Interrupt System

**Concept:** A system of thematic, player-driven interruptions that makes the game more interactive and the narrative more emergent.

**Rules:**
*   **Crossroads Deck:** A new deck of "Crossroads Cards" is added to the game.
*   **Turn Procedure:** At the start of Player A's turn, the player to their right (Player B) draws one Crossroads Card and holds it, keeping it secret.
*   **Trigger Condition:** Each Crossroads Card has a specific trigger condition (e.g., "If the active player moves to the Health Ring," "If the active player's Sin increases").
*   **Interrupt:** If the trigger condition on the Crossroads Card is met at any point during Player A's turn, Player B immediately interrupts the game by shouting "Crossroads!" and reading the card aloud.
*   **Resolution:** The active player (Player A) must then resolve the choice presented on the Crossroads Card before continuing their turn. This can dramatically alter their plans and the game state.
*   If the trigger condition is not met by the end of the turn, the Crossroads Card is discarded without effect.
