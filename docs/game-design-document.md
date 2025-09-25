# Reality Check: Game Design Document (GDD)
*Version 0.4 - The Hybrid Model*

## 1. Core Game Loop & Vision

**Vision:** To create a satirical, narrative-driven board game that mirrors the complexities of modern adult life. The game should encourage social interaction, moral ambiguity, and strategic thinking beyond simple resource accumulation. The primary goal is not just to "win," but to generate memorable stories and conversations.

**Core Loop: The "Narrative Momentum" System**
The game's loop is designed to give players agency over the pacing and narrative depth of their experience. It is broken into two interconnected phases: "The Grind" and "The Turning Point."

1.  **The Grind (Turn-to-Turn Gameplay):**
    *   On their turn, a player spends **Action Points (AP)** on simple, fast-paced actions (e.g., drawing a card, working overtime).
    *   These actions have clear, immediate effects on a player's core stats.
    *   Crucially, these simple actions also generate a new resource: **Narrative Momentum**.

2.  **The Turning Point (Player-Driven Narrative Events):**
    *   At any time, a player can choose to spend their accumulated **Narrative Momentum** to trigger a "Life Happens" event.
    *   This injects a deep, complex narrative choice into the game, presenting the player with a multi-faceted dilemma that can have significant short-term and long-term consequences.
    *   This allows players to opt-in to deeper story moments at a pace they control, keeping the game accessible while offering rewarding strategic depth.

## 2. The Four Pillars: Core Stats & Economy

The game's economy is based on the four core stats, or "Pillars of Life." The fundamental design principle is **inefficient conversion**: converting one resource into another should always result in a net loss of value, making choices impactful and difficult to reverse. For example, gaining Money through a "Sinful" action should be easier than spending that Money to regain the lost Virtue or Mental Health.

*   **💰 Money:** Your financial health.
*   **🧠 Mental Health:** Your psychological wellbeing.
*   **☠️ Sin:** A measure of your moral corruption.
*   **✝️ Virtue:** A measure of your moral strength and altruism.

### 2.1. The Fifth Resource: Narrative Momentum

**Concept:** A spendable resource representing the accumulation of life experiences, stress, and minor events that build up between major life-altering moments. It serves as a currency that players use to buy into deeper narrative events, giving them control over the game's pacing.

**Rules:**
*   Players gain **Narrative Momentum (NM)** tokens by taking simple, everyday actions.
    *   **Work Overtime:** +1 NM
    *   **Draw a Card:** +1 NM
*   At any time on their turn, a player may spend **5 NM** to trigger a **"Life Happens"** event. This does not cost an Action Point.

## 3. Core Mechanic Definitions

This section provides concrete rules for the game's primary systems.

### 3.1. The "Life Happens" Deck

**Concept:** The "Life Happens" deck is the heart of the hybrid model. These cards represent major, life-altering events that players choose to engage with. They are designed to be complex, with branching choices and significant consequences, providing the deep narrative experience of the "Constant Dilemma" model on an opt-in basis.

**Rules:**
*   **Foresight Mechanic:** When a player spends 5 NM to trigger an event, they draw two cards from the "Life Happens" deck. They secretly choose one to resolve and discard the other. This increases player agency and mitigates purely random negative outcomes.
*   Each card presents a scenario and 2-3 choices.
*   The outcomes of these choices can be complex, affecting core stats, adding new cards to a player's hand or the main decks, or even adding "legacy" stickers to the game board that permanently alter rules for all players.

### 3.2 The "Burnout" Mechanic

**Concept:** Mechanically represents the consequences of poor mental health, limiting a player's choices and forcing them to deal with their current problems rather than taking on new ones.

**Rule:**
*   At the start of your turn, if your **Mental Health** is **3 or lower**, you are suffering from **"Burnout."**
*   While suffering from Burnout, you **cannot** perform the "Draw a Card" action. You must choose another action, such as "Play a Card" from your hand.
*   If you have no other valid actions, you must spend your turn "recovering," which allows you to draw one card but immediately end your turn without playing it.
*   **Circuit Breaker:** After a turn in which you suffered from Burnout, you are immune to its effects for one full round (i.e., until your turn comes up again), giving you a window to recover.

### 3.3 "Community Impact" & The Builder Victory

**Concept:** Quantifies a player's positive contributions to the group, making "The Builder" victory condition measurable and balancing it to prevent runaway leaders.

**Rule:**
*   Each player has a **`communityImpact`** stat that tracks their positive contributions to the group.
*   Players can gain Community Impact points via Direct Aid, Virtue Cards, and Babel Events.
*   **The Builder Bonus:** At the end of the game, the player with the highest `communityImpact` stat is named "The Builder" and receives a tiered bonus to their final score, based on their final Virtue (V):
    *   If 1 ≤ V ≤ 4, bonus = **+1 point**.
    *   If 5 ≤ V ≤ 9, bonus = **+2 points**.
    *   If V ≥ 10, bonus = **+3 points**.
    *   This system of diminishing returns ensures that while Virtue is valuable, hyper-focusing on it at the expense of all else is not a dominant strategy.

### 3.4 Card & Action Economy

**Concept:** Defines the flow of cards and actions to ensure a balanced and well-paced game.

**Rules:**
*   **Action Points (AP):** Each player starts their turn with **2 Action Points**.
*   **Action Menu:**
    *   **Draw a Card:** Costs 1 AP.
    *   **Play a Card:** Costs 1 AP.
    *   **Work Overtime:** Costs 2 AP. Gain $500 Money but lose 1 Mental Health.
*   **Hand Size:** Players have a maximum hand size of **5 cards**. If you must draw a card and are already at your hand limit, you must first discard a card of your choice.
*   **Turn End:** A player's turn ends when they have spent all their Action Points.

### 3.5 End Game Trigger: The Final Chapter

**Concept:** The game's conclusion is not tied to a fixed number of rounds, but is instead triggered by a player choosing to capstone their personal story. This ensures the game ends at a moment of high narrative tension.

**Rule:**
*   The end of the game is triggered immediately when any player accumulates **20 or more Narrative Momentum** points.
*   When this threshold is met, the game transitions to the "Judgment Day" phase at the end of the current player's turn.

### 3.6 Judgment Day: Final Scoring

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
3.  **End-Game Titles (Accolades):**
    *   After the final scores are calculated, a series of titles are awarded to recognize different philosophies of "winning." These titles do not affect the final score but add a narrative layer to the game's conclusion.
    *   The titles are defined in `src/game/titles.js` and can be easily extended. The current titles include:
        *   **The Saint:** Highest virtue with minimal sin.
        *   **The Hustler:** Maximum money while staying morally neutral.
        *   **The Survivor:** Highest mental health.
        *   **The Influencer:** Most kudos received.

## 4. Advanced Mechanics & Systems

This section details the more complex systems that provide "Reality Check" with its unique strategic depth and narrative potential.

### 4.1 The Exile Protocol

**Concept:** A player-driven catch-up mechanism that addresses a runaway leader without resorting to player elimination. It transforms a dominant player into a new kind of disruptive force, keeping all players engaged.

**Rules:**
*   **Trigger Condition:** The Exile Protocol can be initiated at the start of any player's turn if one player's **Money** is more than **2.5 times the average** of all players. This condition only applies if there are 3 or more players.
*   **The Vote:** The player whose turn it is may propose a vote to "Exile" the wealthy player. The vote requires a simple majority to pass. The wealthy player does not get a vote.
*   **Consequences of Exile:**
    *   The Exiled player immediately loses **33%** of their Money, which is redistributed equally among all other players.
    *   The Exiled player receives a new secret objective card from the `exile-objectives.json` deck.
    *   The Exiled player no longer pursues the standard victory conditions. They can only win by achieving their new secret objective. They are still part of the game, but their goals are now fundamentally different and often disruptive.
*   **Exile Objectives:**
    *   **Saboteur's Gambit:** Win if the player who was the leader in money at the time of your exile comes in last place.
    *   **Anarchist's Dream:** Win if at least two other players are in burnout at the end of the game.

### 4.2. Social Capital as a Spendable Resource

**Concept:** Social Capital is a spendable resource representing a player's reputation, social clout, and network of favors. It mechanizes the power of social influence, allowing players to take powerful actions that are not tied to the game's economic engine.

**Rules:**
*   **Gaining Social Capital:** Players gain Social Capital points (SC) through:
    *   **Card Effects:** Specific choices on Virtue, Sin, or Life Happens cards can award SC.
    *   **Community Events:** Pro-social choices during certain events can award SC.
    *   **Direct Aid:** When you give another player a resource voluntarily (not as part of a card effect that forces you to), you may gain 1 SC.
*   **Spending Social Capital:** On their turn, a player can spend their accumulated SC to perform one of the following special actions. This does not cost an Action Point.
    *   **1 SC: "Call in a Favor"** - Reroll any single die roll you make this turn.
    *   **3 SC: "Lean on Your Network"** - Negate a Mental Health loss of 2 points or less that you would suffer from a card or event.
    *   **5 SC: "Community Organizer"** - Add an additional vote to your side during any group decision or Exile vote.

### 4.3. "Crossroads" Interrupt System

**Concept:** A system of thematic, player-driven interruptions that makes the game more interactive and the narrative more emergent. This system is modeled after the "Crossroads" mechanic in the game *Dead of Winter*.

**Rules:**
*   **Crossroads Deck:** A new deck of "Crossroads Cards" is added to the game.
*   **Turn Procedure:** At the start of each player's turn, a new `Crossroads Card` is drawn from the deck and becomes the active card for that turn.
*   **Trigger Condition:** Each Crossroads Card has a specific, contextual trigger condition. These triggers are tied to game events, such as:
    *   `ACTION`: Triggered when a player takes a specific type of action (e.g., `WORK_OVERTIME`).
    *   `STAT_CHANGE`: Triggered when a player's core stat increases or decreases (e.g., `sin` increases).
*   **Interrupt:** If the active player takes an action that meets the trigger condition of the active `Crossroads Card`, the game is immediately paused.
*   **Resolution:** The active player is presented with the thematic choice from the card. They must resolve the choice and its effects before their turn can continue. This can dramatically alter their plans and the game state.
*   If the trigger condition is not met by the end of the player's turn, the `Crossroads Card` is discarded without effect.

### 3.7 End-Game Accolades (Titles)

**Concept:** At the end of the game, a series of over 20 unique "Titles" are awarded to players based on their stats and actions throughout the game. These serve as a narrative summary of their playstyle and achievements, similar to accolades in games like *Counter-Strike 2*. These titles do not affect the final score but provide a fun, narrative conclusion to the game.

**Examples of Titles:**
*   **The Capitalist:** Finished with the most money.
*   **The Saint:** Finished with the most virtue.
*   **The Survivor:** Finished with the highest mental health.
*   **The Influencer:** Received the most "Kudos" tokens.
*   **The Penny Pincher:** Finished with high money and low sin.
*   **The Martyr:** Finished with the lowest mental health but highest virtue.
*   **The Socialite:** Finished with the most Social Capital.
*   *(And many more...)*

## 5. UI/UX Principles & Information Design

**Objective:** To mitigate "Analysis Paralysis" and ensure the game is intuitive and enjoyable, the presentation of information is critical.

**Core Principles:**
*   **Clarity over Clutter:** The game state must be presented clearly. A player should be able to understand the current situation at a glance.
*   **Minimalist HUD:** For a digital implementation, the main on-screen display should be minimal, showing only the most critical information (e.g., current AP, player stats).
*   **Contextual Information:** Detailed information (e.g., other players' public stats, the effects of a card) should be available on demand through clear tooltips or a dedicated "info" button.
*   **Clear Feedback:** Every player action must be met with clear visual and auditory feedback to confirm that the action was registered and to show its immediate consequence.

---
*Designer's Note on "Work Overtime": The efficiency of the "Work Overtime" action must be carefully calibrated during playtesting. It should be a viable fallback option when a player has no other good moves, but it should not be so efficient that it becomes a dominant, low-interaction strategy. It should feel like a safe, but slightly suboptimal, choice compared to engaging with the game's core card-play mechanics.*

*Designer's Note on Card Impact: A comprehensive review of the "Life Happens" deck should be conducted to tune the impact of individual cards. Underpowered cards that offer negligible benefits should be buffed or redesigned. The goal of this review should be to ensure that every card draw has the potential to be a meaningful strategic moment, thereby increasing the value and excitement of interacting with the system.*
