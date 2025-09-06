# Reality Check: Game Design Document (GDD)
*Version 0.2 - Balanced Systems*

## 1. Core Game Loop & Vision

**Vision:** To create a satirical, narrative-driven board game that mirrors the complexities of modern adult life. The game should encourage social interaction, moral ambiguity, and strategic thinking beyond simple resource accumulation. The primary goal is not just to "win," but to generate memorable stories and conversations.

**Core Loop:**
1.  **Start Turn:** Apply any ongoing effects.
2.  **Take Action:** Spend Action Points (AP) on various actions.
3.  **Resolve Action:** Apply effects and make choices.
4.  **End Turn:** Pass play to the next player.

## 2. The Four Pillars: Core Stats & Economy

The game's economy is based on the four core stats, or "Pillars of Life." The fundamental design principle is **inefficient conversion**: converting one resource into another should always result in a net loss of value, making choices impactful and difficult to reverse. For example, gaining Money through a "Sinful" action should be easier than spending that Money to regain the lost Virtue or Mental Health.

*   **💰 Money:** Your financial health.
*   **🧠 Mental Health:** Your psychological wellbeing.
*   **☠️ Sin:** A measure of your moral corruption.
*   **✝️ Virtue:** A measure of your moral strength and altruism.

## 3. Core Mechanic Definitions

This section provides concrete rules for the game's primary systems.

### 3.1. The "Burnout" Mechanic (Low Mental Health)

**Concept:** Mechanically represents the consequences of poor mental health, limiting a player's choices and forcing them to deal with their current problems rather than taking on new ones.

**Rule:**
*   At the start of your turn, if your **Mental Health** is **3 or lower**, you are suffering from **"Burnout."**
*   While suffering from Burnout, you **cannot** perform the "Draw a Card" action. You must choose another action, such as "Play a Card" from your hand.
*   If you have no other valid actions, you must spend your turn "recovering," which allows you to draw one card but immediately end your turn without playing it.
*   **Circuit Breaker:** After a turn in which you suffered from Burnout, you are immune to its effects for one full round, giving you a window to recover.

### 3.2. "Community Impact" & The Builder Victory

**Concept:** Quantifies a player's positive contributions to the group, making "The Builder" victory condition measurable and balancing it to prevent runaway leaders.

**Rule:**
*   A new global tracker, the **"Community Impact Track,"** is added to the game (0-20).
*   Players gain Community Impact points via Direct Aid, Virtue Cards, and Babel Events.
*   **The Builder Bonus:** At the end of the game, the player with the highest score on the Community Impact Track wins **"The Builder"** title. This title grants a tiered bonus to their final score, based on their final Virtue (V):
    *   If 1 ≤ V ≤ 4, bonus = **+1 point**.
    *   If 5 ≤ V ≤ 9, bonus = **+2 points**.
    *   If V ≥ 10, bonus = **+3 points**.
    *   This system of diminishing returns ensures that while Virtue is valuable, hyper-focusing on it at the expense of all else is not a dominant strategy.

### 3.3. Card & Action Economy

**Concept:** Defines the flow of cards and actions to ensure a balanced and well-paced game.

**Rules:**
*   **Action Points (AP):** Each player starts their turn with **2 Action Points**.
*   **Action Menu:**
    *   **Draw a Card:** Costs 1 AP.
    *   **Play a Card:** Costs 1 AP.
    *   **Work Overtime:** Costs 2 AP. Gain $500 Money but lose 1 Mental Health.
*   **Hand Size:** Players have a maximum hand size of **5 cards**. If you must draw a card and are already at your hand limit, you must first discard a card of your choice.
*   **Turn End:** A player's turn ends when they have spent all their Action Points.

### 3.4. End Game: Judgment Day

**Concept:** A multi-faceted end-game sequence that evaluates each player's journey and determines a winner based on multiple, value-driven victory conditions.

**Rules:**
1.  **Peer Testimony Phase:**
    *   Each player secretly receives one **"Kudos"** token and one **"Concern"** token.
    *   Simultaneously, all players assign their tokens to other players (not themselves).
2.  **Final Scoring:**
    *   Let M, MH, S, V be the final values for each pillar.
    *   Let `Kudos` be the number of Kudos tokens received, and `Concern` be the number of Concern tokens received.
    *   **Mental Health Bonus (MH_Bonus):**
        *   If MH ≥ 8, MH_Bonus = 10 points.
        *   If 5 ≤ MH ≤ 7, MH_Bonus = 5 points.
        *   If MH < 5, MH_Bonus = 0 points.
    *   **Final Score = (M / 1000) + (V * 2) - (S * 2) + MH_Bonus + (Kudos * 3) - (Concern * 1)**

## 4. Advanced Mechanics & Systems

This section details the more complex systems that provide "Reality Check" with its unique strategic depth and narrative potential.

### 4.1. The Exile Protocol (Replaces Red Line Protocol)

**Concept:** A player-driven catch-up mechanism that addresses a runaway leader without resorting to player elimination. It transforms a dominant player into a new kind of disruptive force, keeping all players engaged.

**Rules:**
*   **Trigger Condition:** The Exile Protocol can be initiated at the start of any player's turn if one player's **Money** is more than double the combined total of the two players with the least Money.
*   **The Vote:** The player whose turn it is may propose a vote to "Exile" the wealthy player. The vote requires a simple majority to pass. The wealthy player does not get a vote.
*   **Consequences of Exile:**
    *   The Exiled player immediately loses 50% of their Money, which is redistributed equally among all other players.
    *   The Exiled player receives a new secret objective card (e.g., "Cause two other players to fall below 3 Mental Health," or "Ensure the player with the highest Virtue does not win.").
    *   The Exiled player no longer pursues the standard victory conditions. They can only win by achieving their new secret objective. They are still part of the game, but their goals are now fundamentally different and often disruptive.

### 4.2. Social Capital Resource System

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

### 4.3. "Crossroads" Interrupt System

**Concept:** A system of thematic, player-driven interruptions that makes the game more interactive and the narrative more emergent.

**Rules:**
*   **Crossroads Deck:** A new deck of "Crossroads Cards" is added to the game.
*   **Turn Procedure:** At the start of Player A's turn, the player to their right (Player B) draws one Crossroads Card and holds it, keeping it secret.
*   **Trigger Condition:** Each Crossroads Card has a specific trigger condition (e.g., "If the active player moves to the Health Ring," "If the active player's Sin increases").
*   **Interrupt:** If the trigger condition on the Crossroads Card is met at any point during Player A's turn, Player B immediately interrupts the game by shouting "Crossroads!" and reading the card aloud.
*   **Resolution:** The active player (Player A) must then resolve the choice presented on the Crossroads Card before continuing their turn. This can dramatically alter their plans and the game state.
*   If the trigger condition is not met by the end of the turn, the Crossroads Card is discarded without effect.

## 5. UI/UX Principles & Information Design

**Objective:** To mitigate "Analysis Paralysis" and ensure the game is intuitive and enjoyable, the presentation of information is critical.

**Core Principles:**
*   **Clarity over Clutter:** The game state must be presented clearly. A player should be able to understand the current situation at a glance.
*   **Minimalist HUD:** For a digital implementation, the main on-screen display should be minimal, showing only the most critical information (e.g., current AP, player stats).
*   **Contextual Information:** Detailed information (e.g., other players' public stats, the effects of a card) should be available on demand through clear tooltips or a dedicated "info" button.
*   **Clear Feedback:** Every player action must be met with clear visual and auditory feedback to confirm that the action was registered and to show its immediate consequence.

---
*Designer's Note on "Work Overtime": The efficiency of the "Work Overtime" action must be carefully calibrated during playtesting. It should be a viable fallback option when a player has no other good moves, but it should not be so efficient that it becomes a dominant, low-interaction strategy. It should feel like a safe, but slightly suboptimal, choice compared to engaging with the game's core card-play mechanics.*
